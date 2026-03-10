package gis

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jdetok/stlmetromap/pkg/pgis"
	"github.com/jdetok/stlmetromap/pkg/util"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type DataLayers struct {
	Outfile    string
	Counties   *FeatureColl
	Tracts     *FeatureColl
	CyclePaths *FeatureColl
	BusStops   *FeatureColl
	TrnStops   *FeatureColl
	Amtrak     *FeatureColl
	Places     *FeatureColl
}

func (l *DataLayers) DataToJSONFile() error {
	return util.WriteStructToJSONFile(l, l.Outfile)
}
func (l *DataLayers) DataFromJSONFile() error {
	return util.FillStructFromJSONFile(l, l.Outfile)
}

// Builds, aggregates, and joins all data to be served as data layers
func GetDataLayers(ctx context.Context, fname string, db *pgxpool.Pool, lg *zap.SugaredLogger) (*DataLayers, error) {
	g, ctx := errgroup.WithContext(ctx)

	counties := &FeatureColl{}
	tracts := &FeatureColl{}
	cyclPths := &FeatureColl{}
	busStops := &FeatureColl{}
	trnStops := &FeatureColl{}
	amtrak := &FeatureColl{}
	places := &FeatureColl{}

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
	g.Go(func() error {
		lg.Infof("getting amtrak from db")
		if err := amtrak.QueryDB(ctx, db, pgis.AMTRAK, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch amtrak: %w", err)
		}
		return nil
	})
	g.Go(func() error {
		lg.Infof("getting places from db")
		if err := places.QueryDB(ctx, db, pgis.PLACES, "geom", []any{}); err != nil {
			return fmt.Errorf("failed to fetch places: %w", err)
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
		Amtrak:     amtrak,
		CyclePaths: cyclPths,
		Places:     places,
	}, nil
}
