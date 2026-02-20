package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/jdetok/stlmetromap/pkg/get"
	"golang.org/x/sync/errgroup"
)

type Layers struct {
	Counties *GeoData
	Tracts *GeoData
	PoplDens GeoIDPopl
	TractsPoplDens *GeoTractFeatures
}

type GeoPoplTract struct {
	GeoID string `json:"geoid"`
	Tract string `json:"tract"`
	Area string `json:"area"`
	Popl float64 `json:"popl"`
	PoplSqMi float64 `json:"poplsqmi"`
}

func NewGeoPoplTract(gId, tract, area string, popl float64) *GeoPoplTract {
	return &GeoPoplTract{
		GeoID: gId,
		Tract: tract,
		Area: area,
		Popl: popl,
		PoplSqMi: getPoplDensity(area, popl),
	}
}

func getPoplDensity(area string, popl float64) float64 {
	sqMeters, _ := strconv.ParseFloat(area, 64)
	sqMi := sqMeters / 2589988
	return math.Round((popl / sqMi)*100) / 100
}

type GeoIDPopl map[string]float64
type GeoAttrs map[string]any
type GeoPoplFeature struct {
    Geometry   Geo                    `json:"geometry"`
    Attributes GeoAttrs `json:"attributes"`
}

type GeoTractFeatures struct {
    Features []GeoPoplFeature `json:"features"`
}

// build GIS structs to build feature layers
type GeoData struct {
	Features []GeoFeature `json:"features"`
}

type GeoFeature struct {
	Attributes Attr `json:"attributes"`
	Geometry   Geo  `json:"geometry"`
}

type Geo struct {
	Rings [][][]float64 `json:"rings"`
	Paths [][][]float64 `json:"paths"`
}

type Attr struct {
	MTFCC    string
	OID      string
	GEOID    string
	STATE    string
	COUNTY   string
	TRACT    string
	BASENAME string
	NAME     string
	LSADC    string
	AREALAND string
	CENTLAT  string
	CENTLON  string
	INTPTLAT string
	INTPTLON string
	OBJECTID int
	POPULATION string
    POP_SQMI   string
}

func JoinPopulation(geo *GeoData, pop GeoIDPopl) *GeoTractFeatures {
    feats := &GeoTractFeatures{}
    for i := range geo.Features {
        f := geo.Features[i]
        popl := pop[f.Attributes.GEOID]
		area := f.Attributes.AREALAND
        feats.Features = append(feats.Features, GeoPoplFeature{
            Geometry: f.Geometry,
            Attributes: map[string]any{
                "GEOID":    f.Attributes.GEOID,
                "TRACT":    f.Attributes.TRACT,
                "AREALAND": area,
                "POPL":     popl,
                "POPLSQMI": getPoplDensity(area, popl),
            },
        })
    }
    return feats
}

func FetchACSPopulation(ctx context.Context, state string, counties []string) (GeoIDPopl, error) {
	popByGEOID := GeoIDPopl{}
	var mu sync.Mutex
	g, errCtx := errgroup.WithContext(ctx)
	for _, county := range counties {
		g.Go(func() error {
			params := url.Values{}
			params.Set("key", os.Getenv("CENSUS_API_KEY"))
			params.Set("get", "B01003_001E,GEO_ID")
			params.Set("for", "tract:*")
			params.Set("in", fmt.Sprintf("state:%s county:%s", state, county))

			u := fmt.Sprintf("https://api.census.gov/data/2023/acs/acs5?%s", params.Encode())
			fmt.Println("querying:", u)

			resp, err := get.Get(get.NewGetRequest(ctx, u, true, 1, 3))
			if err != nil {
				return err
			}
			defer resp.Body.Close()

			var rows [][]string
			json.NewDecoder(resp.Body).Decode(&rows)
			if len(rows) == 0 {
				fmt.Println("warning: empty response from Census API for", state, county, resp.Status, "|", u)
				return nil
			}
			for _, row := range rows[1:] {
				geoid := strings.TrimPrefix(row[1], "1400000US")
				pop, _ := strconv.ParseFloat(row[0], 64)
				mu.Lock()
				popByGEOID[geoid] = pop
				mu.Unlock()
			}
			return nil
		})
	}
	if errCtx.Err() != nil {
		return popByGEOID, errCtx.Err()
	}
	if err := g.Wait(); err != nil {
		return popByGEOID, err
	}
	return popByGEOID, nil
}

func FetchTigerData(ctx context.Context, baseURL, where string) (*GeoData, error) {
	offset := 0
	params := url.Values{}
	params.Set("resultRecordCount", "4000")
	params.Set("f", "json")
	params.Set("outFields", "*")
	params.Set("outSR", "4326")
	params.Set("maxAllowableOffset", "0.001")
	params.Set("where", where)
	params.Set("returnGeometry", "true")
	params.Set("resultOffset", fmt.Sprintf("%d", offset))

	u := fmt.Sprintf("%s/query?%s", baseURL, params.Encode())
	fmt.Println("querying:", u)

	resp, err := get.Get(get.NewGetRequest(ctx, u, true, 1, 3))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result = &GeoData{}
	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		fmt.Println("error decoding JSON:", err)
	}
	fmt.Println("fetched", len(result.Features), "features from", baseURL)

	offset += len(result.Features)

	return result, nil
}
