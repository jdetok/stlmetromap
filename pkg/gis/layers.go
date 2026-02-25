package gis

import (
	"context"
	"fmt"

	"github.com/jdetok/stlmetromap/pkg/util"
	"golang.org/x/sync/errgroup"
)

type DataLayers struct {
	Outfile        string
	Counties       *TGRData
	Tracts         *TGRData
	Railroad       *TGRData
	ACS            *ACSData
	Bikes          *GeoBikeData
	TractsPoplDens *GeoTractFeatures
	CountiesNew    *util.DataSource
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

	countiesNew := NewTigerCounties(82, true)

	counties := &TGRData{}
	tracts := &TGRData{}
	rails := &TGRData{}
	acs := &ACSData{}
	bikes := &GeoBikeData{}

	g.Go(func() error {
		var err error
		counties, err = FetchTigerData(ctx, 82)
		if err != nil {
			return fmt.Errorf("failed to fetch counties: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		if err := countiesNew.Data.Get(ctx, countiesNew.URL, true); err != nil {
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

	return &DataLayers{
		Outfile:        fname,
		Counties:       counties,
		Tracts:         tracts,
		Bikes:          bikes,
		Railroad:       rails,
		ACS:            acs,
		TractsPoplDens: DemographicsForTracts(tracts, acs),
		CountiesNew:    countiesNew,
	}, nil
}
