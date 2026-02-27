package gis

import (
	"context"
	"fmt"
	"time"

	"github.com/jdetok/stlmetromap/pkg/util"
	"golang.org/x/sync/errgroup"
)

type DataLayers struct {
	Outfile          string
	Counties         *util.DataSource
	Tracts           *util.DataSource
	ACS              *util.DataSource
	Bikes            *util.DataSource
	Metro            *util.DataSource
	TractsPoplDens   *GeoTractFeatures
	CountiesPoplDens *GeoTractFeatures
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

func BuildLayers(ctx context.Context, b BuildMode) (*DataLayers, error) {
	var err error
	layers := &DataLayers{Outfile: b.PersistFile}

	if b.Get || (!b.Get && !util.FileExists(b.PersistFile)) {
		layers, err = GetDataLayers(ctx, b.PersistFile)
		if err != nil {
			return nil, err
		}
	} else {
		if !util.FileExists(b.PersistFile) {
			return nil, err
		}
		if err := layers.DataFromJSONFile(); err != nil {
			return nil, err
		}
	}

	if b.Save {
		if err := layers.DataToJSONFile(); err != nil {
			return nil, err
		}
	}
	return layers, nil
}

// Builds, aggregates, and joins all data to be served as data layers
func GetDataLayers(ctx context.Context, fname string) (*DataLayers, error) {

	g, ctx := errgroup.WithContext(ctx)

	counties := NewTigerGeoData(82, true)
	tracts := NewTigerGeoData(8, true)
	acs := util.NewDataSourceFromURL("acs", "acs", &ACSData{})
	bikes := util.NewDataSourceFromFile(CYCLE_FILE, "bikes", &GeoBikeData{})
	stops := util.NewDataSourceFromURL("stops", "stops", &StopMarkers{})

	g.Go(func() error {
		var err error
		attempts := 3
		for i := range attempts {
			if err = stops.Data.Get(ctx, stops.URL, true); err == nil {
				return nil
			}
			if i < attempts-1 {
				time.Sleep(2 * time.Second)
			}

		}
		return fmt.Errorf("failed to fetch metro stops: %w", err)
	})

	g.Go(func() error {
		if err := counties.Data.Get(ctx, counties.URL, true); err != nil {
			return fmt.Errorf("failed to fetch counties: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		if err := tracts.Data.Get(ctx, tracts.URL, true); err != nil {
			return fmt.Errorf("failed to fetch tracts: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		if err := acs.Data.Get(ctx, acs.URL, true); err != nil {
			return fmt.Errorf("failed to get new acs data: %w", err)
		}
		return nil
	})
	g.Go(func() error {
		if err := bikes.Data.Get(ctx, bikes.Fname, false); err != nil {
			return fmt.Errorf("failed to fetch bikes: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	stopMarkers := stops.Data.(*StopMarkers)
	tgrTracts := tracts.Data.(*TGRData)
	tgrCounties := counties.Data.(*TGRData)
	acsData := acs.Data.(*ACSData)

	tractGeoFeatures := GeoFeaturesFromTGR(tgrTracts)
	countyGeoFeatures := GeoFeaturesFromTGR(tgrCounties)
	stopGroups := [][]StopMarker{stopMarkers.Stops, stopMarkers.BusStops, stopMarkers.MlStops}

	var tractsPoplDens *GeoTractFeatures
	var countiesPoplDens *GeoTractFeatures

	for i := range stopGroups {
		if err := StopsInTracts(tractGeoFeatures, stopGroups[i]); err != nil {
			return nil, err
		}
	}
	tractsPoplDens = DemographicsForTracts(tgrTracts, acsData, stopMarkers)

	for i := range stopGroups {
		if err := StopsInTracts(countyGeoFeatures, stopGroups[i]); err != nil {
			return nil, err
		}
	}
	countiesPoplDens = DemographicsForTracts(tgrCounties, acsData, stopMarkers)

	// if err := StopsInTracts(tractsPoplDens.Features, stopMarkers.Stops); err != nil {
	// 	return nil, err
	// }

	return &DataLayers{
		Outfile:          fname,
		Counties:         counties,
		Tracts:           tracts,
		Bikes:            bikes,
		ACS:              acs,
		Metro:            stops,
		TractsPoplDens:   tractsPoplDens,
		CountiesPoplDens: countiesPoplDens,
	}, nil
}
