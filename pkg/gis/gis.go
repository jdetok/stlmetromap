package gis

import (
	"context"
	"fmt"
	"maps"
	"math"
	"strconv"

	"github.com/jdetok/stlmetromap/pkg/util"
	"golang.org/x/sync/errgroup"
)

// each layer must be available to http server at setup time to serve to frontend
type Layers struct {
	Counties       *GeoData
	Tracts         *GeoData
	PoplDens       GeoIDPopl
	TractsPoplDens *GeoTractFeatures
}

func (l *Layers) StructToJSONFile(fname string) error {
	return util.WriteStructToJSONFile(l, fname)
}

func (l *Layers) StructFromJSONFile(fname string) error {
	return util.FillStructFromJSONFile(l, fname)
}

func BuildLayers(ctx context.Context) (*Layers, error) {
	g, ctx := errgroup.WithContext(ctx)

	counties := &GeoData{}
	tracts := &GeoData{}
	poplDens := GeoIDPopl{}

	g.Go(func() error {
		mo, err := FetchACSPopulation(ctx, "29", []string{"099", "071", "183", "189", "219", "510"})
		if err != nil {
			return fmt.Errorf("failed to fetch MO population: %w", err)
		}
		il, err := FetchACSPopulation(ctx, "17", []string{"005", "013", "027", "083", "117", "119", "133", "163"})
		if err != nil {
			return fmt.Errorf("failed to fetch IL population: %w", err)
		}
		// add all illinois to mo
		maps.Copy(mo, il)
		poplDens = mo
		return nil
	})

	g.Go(func() error {
		var err error
		counties, err = FetchTigerData(ctx, 82)
		if err != nil {
			return fmt.Errorf("failed to fetch counties: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		var err error
		tracts, err = FetchTigerData(ctx, 8)
		if err != nil {
			return fmt.Errorf("failed to fetch tracts: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &Layers{
		Counties:       counties,
		Tracts:         tracts,
		PoplDens:       poplDens,
		TractsPoplDens: JoinPopulation(tracts, poplDens),
	}, nil
}

type GeoPoplTract struct {
	GeoID    string  `json:"geoid"`
	Tract    string  `json:"tract"`
	Area     string  `json:"area"`
	Popl     float64 `json:"popl"`
	PoplSqMi float64 `json:"poplsqmi"`
}

func NewGeoPoplTract(gId, tract, area string, popl float64) *GeoPoplTract {
	return &GeoPoplTract{
		GeoID:    gId,
		Tract:    tract,
		Area:     area,
		Popl:     popl,
		PoplSqMi: getPoplDensity(area, popl),
	}
}

func getPoplDensity(area string, popl float64) float64 {
	sqMeters, _ := strconv.ParseFloat(area, 64)
	sqMi := sqMeters / 2589988
	return math.Round((popl/sqMi)*100) / 100
}

type GeoIDPopl map[string]float64
type GeoAttrs map[string]any
type GeoPoplFeature struct {
	Geometry   Geo      `json:"geometry"`
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
	MTFCC      string
	OID        string
	GEOID      string
	STATE      string
	COUNTY     string
	TRACT      string
	BASENAME   string
	NAME       string
	LSADC      string
	AREALAND   string
	CENTLAT    string
	CENTLON    string
	INTPTLAT   string
	INTPTLON   string
	OBJECTID   int
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
