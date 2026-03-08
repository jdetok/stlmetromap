package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jdetok/stlmetromap/pkg/pgis"
	"github.com/jdetok/stlmetromap/pkg/util"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type FeatureWriter interface {
	WriteJSONResp(http.ResponseWriter, *http.Request)
}

type FeatureColl struct {
	Type     string    `json:"type"`
	Features []Feature `json:"features"`
}

func (f *FeatureColl) WriteJSONResp(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/geo+json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(f); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

type Feature struct {
	Type       string          `json:"type"`
	Geometry   json.RawMessage `json:"geometry"`
	Properties map[string]any  `json:"properties"`
}

type DataLayers struct {
	Outfile    string
	Counties   *FeatureColl
	Tracts     *FeatureColl
	CyclePaths *FeatureColl
	BusStops   *FeatureColl
	TrnStops   *FeatureColl
}

func (l *DataLayers) DataToJSONFile() error {
	return util.WriteStructToJSONFile(l, l.Outfile)
}
func (l *DataLayers) DataFromJSONFile() error {
	return util.FillStructFromJSONFile(l, l.Outfile)
}

type BuildMode struct {
	Get         bool
	Save        bool
	PersistFile string
}

func BuildLayers(ctx context.Context, b BuildMode, db *pgxpool.Pool, lg *zap.SugaredLogger) (*DataLayers, error) {

	var err error
	layers := &DataLayers{Outfile: b.PersistFile}

	if b.Get || (!b.Get && !util.FileExists(b.PersistFile)) {
		layers, err = GetDataLayers(ctx, b.PersistFile, db, lg)
		if err != nil {
			return nil, err
		}
	} else {
		if !util.FileExists(b.PersistFile) {
			return nil, err
		}
		lg.Infof("attempting to fill DataLayers struct from persisted data in %s", layers.Outfile)
		if err := layers.DataFromJSONFile(); err != nil {
			return nil, err
		}
	}

	if b.Save {
		if err := layers.DataToJSONFile(); err != nil {
			return nil, err
		}
		lg.Infof("DataLayers struct stored as JSON at %s", layers.Outfile)
	}
	return layers, nil
}

// Builds, aggregates, and joins all data to be served as data layers
func GetDataLayers(ctx context.Context, fname string, db *pgxpool.Pool, lg *zap.SugaredLogger) (*DataLayers, error) {
	g, ctx := errgroup.WithContext(ctx)

	counties := &FeatureColl{}
	tracts := &FeatureColl{}
	cyclPths := &FeatureColl{}
	busStops := &FeatureColl{}
	trnStops := &FeatureColl{}

	g.Go(func() error {
		lg.Infof("getting counties from db")
		if err := counties.QueryDB(ctx, db, pgis.COUNTIES, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch counties: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		lg.Infof("getting tracts from db")
		if err := tracts.QueryDB(ctx, db, pgis.TRACTS, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch tracts: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		lg.Infof("getting cycling path lines from OSM db")
		if err := cyclPths.QueryDB(ctx, db, pgis.CYCLING_PATHS, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch bikes: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		lg.Infof("getting bus stops from db")
		if err := busStops.QueryDB(ctx, db, pgis.BUS_STOPS, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch bus stops: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		lg.Infof("getting train stops from db")
		if err := trnStops.QueryDB(ctx, db, pgis.TRN_STOPS, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch train stops: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	lg.Info("finished getting data, transforming data into final structs")

	return &DataLayers{
		Outfile:    fname,
		Counties:   counties,
		Tracts:     tracts,
		BusStops:   busStops,
		TrnStops:   trnStops,
		CyclePaths: cyclPths,
	}, nil
}

func (fc *FeatureColl) QueryDB(
	ctx context.Context, db *pgxpool.Pool, query, geomCol string, args []any,
) error {
	fc.Type = "FeatureCollection"
	fc.Features = []Feature{}

	rows, err := db.Query(ctx, query, args...)
	if err != nil {
		return err
	}
	defer rows.Close()

	flds := rows.FieldDescriptions()
	colNames := make([]string, len(flds))
	geomIdx := -1
	for i, f := range flds {
		name := string(f.Name)
		colNames[i] = name
		if name == geomCol {
			geomIdx = i
		}
	}
	if geomIdx == -1 {
		return fmt.Errorf("geometry column %v not found", geomCol)
	}

	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return err
		}
		props := make(map[string]any, len(vals)-1)
		var geom json.RawMessage

		// map col values in properties
		for i, v := range vals {
			col := colNames[i]
			if i == geomIdx {
				switch t := v.(type) {
				case []byte:
					geom = json.RawMessage(t)
				case string:
					geom = json.RawMessage(t)
				case json.RawMessage:
					geom = t
				default:
					b, mErr := json.Marshal(t)
					if mErr != nil {
						return fmt.Errorf("geom col %q: unsupported type %T", geomCol, v)
					}
					geom = json.RawMessage(b)
				}
				continue
			}
			props[col] = v
		}
		if len(geom) == 0 {
			continue
		}
		fc.Features = append(fc.Features, Feature{
			Type:       "Feature",
			Geometry:   geom,
			Properties: props,
		})
	}
	return rows.Err()
}
