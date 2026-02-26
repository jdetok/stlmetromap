package gis

import (
	"context"
	"fmt"

	"github.com/jdetok/stlmetromap/pkg/util"
	"golang.org/x/sync/errgroup"
)

type DataLayers struct {
	Outfile        string
	Counties       *util.DataSource
	Tracts         *util.DataSource
	ACS            *util.DataSource
	Bikes          *util.DataSource
	Metro          *util.DataSource
	TractsPoplDens *GeoTractFeatures
}

func (l *DataLayers) DataToJSONFile() error {
	return util.WriteStructToJSONFile(l, l.Outfile)
}
func (l *DataLayers) DataFromJSONFile() error {
	return util.FillStructFromJSONFile(l, l.Outfile)
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
		if err := stops.Data.Get(ctx, stops.URL, true); err != nil {
			return fmt.Errorf("failed to fetch metro stops: %w", err)
		}
		return nil
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
	tgrData := tracts.Data.(*TGRData)
	acsData := acs.Data.(*ACSData)

	tractGeoFeatures := GeoFeaturesFromTGR(tgrData)

	stopGroups := [][]StopMarker{stopMarkers.Stops, stopMarkers.BusStops, stopMarkers.MlStops}
	for i := range stopGroups {
		if err := StopsInTracts(tractGeoFeatures, stopGroups[i]); err != nil {
			return nil, err
		}
	}

	tractsPoplDens := DemographicsForTracts(tgrData, acsData, stopMarkers.Stops)

	// if err := StopsInTracts(tractsPoplDens.Features, stopMarkers.Stops); err != nil {
	// 	return nil, err
	// }

	return &DataLayers{
		Outfile:        fname,
		Counties:       counties,
		Tracts:         tracts,
		Bikes:          bikes,
		ACS:            acs,
		Metro:          stops,
		TractsPoplDens: tractsPoplDens,
	}, nil
}
