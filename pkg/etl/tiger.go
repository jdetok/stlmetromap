package etl

import (
	"context"
	"encoding/json"
	"io"
	"os"

	"github.com/jdetok/stlmetromap/pkg/get"
)

// get, convert, and load data from the TIGER census data source into postgis

type FeatsAttrGeoRings struct {
	Features []FeatAttrGeoRings `json:"features"`
}

type FeatAttrGeoRings struct {
	Attr map[string]string `json:"attributes"`
	Geo  [][][]float64     `json:"rings"`
}

// get the data
func (f *FeatsAttrGeoRings) Get(ctx context.Context, src string, isURL bool) error {
	var err error
	var byts []byte
	if isURL {
		resp, rErr := get.Get(get.NewGetRequest(ctx, src, true, 1, 3))
		if rErr != nil {
			return rErr
		}
		defer resp.Body.Close()
		byts, err = io.ReadAll(resp.Body)

	} else {
		byts, err = os.ReadFile(src)
	}
	if err != nil {
		return err
	}
	return json.Unmarshal(byts, f)
}
