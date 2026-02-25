package gis

import (
	"context"
	"fmt"
	"math"
	"strconv"

	"github.com/jdetok/stlmetromap/pkg/util"
	"golang.org/x/sync/errgroup"
)

const CYCLE_FILE = "data/cycle_osm.geojson"

// each layer must be available to http server at setup time to serve to frontend
type Layers struct {
	Counties       *GeoData
	Tracts         *GeoData
	PoplDens       GeoIDPopl
	TractsPoplDens *GeoTractFeatures
	Bikes          *GeoBikeData
	Railroad       *GeoData
	ACS            *ACSData
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
	rails := &GeoData{}
	poplDens := GeoIDPopl{}
	bikes := &GeoBikeData{}
	acs := &ACSData{}

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

	g.Go(func() error {
		var err error
		rails, err = FetchTigerRR(ctx, 9)
		if err != nil {
			return fmt.Errorf("failed to fetch railroad: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		var err error
		acs, err = GetACSData(ctx)
		if err != nil {
			return fmt.Errorf("failed to get new acs data: %w", err)
		}
		return nil
	})
	g.Go(func() error {
		var err error
		bikes, err = LoadBikePathFile(CYCLE_FILE)
		if err != nil {
			return fmt.Errorf("failed to fetch bikes: %w", err)
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
		TractsPoplDens: DemographicsForTracts(tracts, acs),
		Bikes:          bikes,
		Railroad:       rails,
		ACS:            acs,
	}, nil
}

func getPoplDensity(area string, popl float64) float64 {
	metersToMiles := 2589988
	sqMeters, _ := strconv.ParseFloat(area, 64)
	sqMi := sqMeters / float64(metersToMiles)
	return math.Round((popl/sqMi)*100) / 100
}

// original acs just popl
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

func DemographicsForTracts(geo *GeoData, acs *ACSData) *GeoTractFeatures {
	feats := &GeoTractFeatures{}
	for i := range geo.Features {
		f := geo.Features[i]
		acsObj := acs.Data["1400000US"+f.Attributes.GEOID]
		popl, _ := strconv.ParseFloat(acsObj["B01003_001E"], 64)
		area := f.Attributes.AREALAND
		// if i == 0 {
		// 	fmt.Println(acsObj)
		// }
		feats.Features = append(feats.Features, GeoPoplFeature{
			Geometry: f.Geometry,
			Attributes: map[string]any{
				"GEOID":    f.Attributes.GEOID,
				"TRACT":    f.Attributes.TRACT,
				"AREALAND": area,
				"POPL":     popl,
				"POPLSQMI": getPoplDensity(area, popl),
				"INCOME":   acsObj["B06011_001E"],
				"AGE":      acsObj["B01002_001E"],
			},
		})
	}
	return feats
}
