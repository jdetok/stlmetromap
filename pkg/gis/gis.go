package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
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

func (f *FeatureColl) WriteJSONResp(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/geo+json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(f); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func BuildLayers(ctx context.Context, db *pgxpool.Pool, lg *zap.SugaredLogger) (*DataLayers, error) {
	layers, err := GetDataLayers(ctx, PERSISTF, db, lg)
	if err != nil {
		return nil, err
	}
	layers.Outfile = PERSISTF

	if err := layers.DataToJSONFile(); err != nil {
		return nil, err
	}
	lg.Infof("DataLayers struct stored as JSON at %s", layers.Outfile)

	return layers, nil
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
