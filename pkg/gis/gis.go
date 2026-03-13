package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jdetok/stlmetromap/pkg/util"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

const PERSISTF = "data/persist.json"

type FeatureWriter interface {
	WriteJSONResp(http.ResponseWriter, *http.Request)
}

type Feature struct {
	Type       string          `json:"type"`
	Geometry   json.RawMessage `json:"geometry"`
	Properties map[string]any  `json:"properties"`
}

type FeatureColl struct {
	Type     string    `json:"type"`
	Features []Feature `json:"features"`
}

type FeatureData struct {
	Features *FeatureColl
	q        *string
}

// map the layer name to a FeatureData pointer, holding the FeatureColl struct that will be filled with the data
// from the db, along with the pointer to the db query
type FeatureLayers map[string]*FeatureData

// pass to build layers, build with a string for the desired layer name (will be the REST endpoint) and a pointer to
// a SQL query string | map[layer name]pointer-to-query
type LayerMeta map[string]*string

func (l FeatureLayers) DataToJSONFile() error {
	return util.WriteStructToJSONFile(l, PERSISTF)
}

func (f *FeatureColl) WriteJSONResp(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/geo+json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(f); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func NewFeatureLayers(layerNames LayerMeta) FeatureLayers {
	fl := make(FeatureLayers)
	for l, q := range layerNames {
		fl[l] = &FeatureData{q: q, Features: &FeatureColl{}}
	}
	return fl
}

func GetFeatureLayers(ctx context.Context, layerNames LayerMeta, db *pgxpool.Pool, lg *zap.SugaredLogger) (FeatureLayers, error) {
	g, ctx := errgroup.WithContext(ctx)
	fl := NewFeatureLayers(layerNames)

	for l, data := range fl {
		g.Go(func() error {
			lg.Infof("getting data for %s from db", l)
			if err := data.Features.QueryDB(ctx, db, *data.q, "geom", []any{}); err != nil {
				return fmt.Errorf("failed to fetch bus stops: %w", err)
			}
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("an error occured getting data: %v", err)
	}
	if err := fl.DataToJSONFile(); err != nil {
		return fl, fmt.Errorf("failed to write built map to %s: %v", PERSISTF, err)
	}
	return fl, nil
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
