package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/gis"
	"github.com/jdetok/stlmetromap/pkg/pgis"
	"github.com/jdetok/stlmetromap/pkg/srv"
	"github.com/joho/godotenv"
)

func main() {
	zapLog, err := buildLogger()
	if err != nil {
		fmt.Printf("An error occured configuring the logger: %s\n", err.Error())
		os.Exit(1)
	}
	defer zapLog.Sync()

	a := &app{
		addr: ":9999",
		lg:   zapLog,
	}

	if err := godotenv.Load(); err != nil {
		a.lg.Fatalf("failed to load environment variables: %v", err)
	}

	ctx := context.Background()

	a.lg.Info("Environment configured, connecting to postgis...")

	pool, err := pgis.NewPgxPool(ctx)
	if err != nil {
		a.lg.Fatalf("failed to connect to postgis: %v", err)
	}
	a.db = pool

	a.lg.Info("postgis connection successful, building data layers...")

	if err := pgis.CreateTableNotExists(ctx, a.db, &pgis.TableConf{
		Table:      "test1",
		Schema:     "test",
		Headers:    []string{"col1", "col2", "col3"},
		Indexes:    map[string]string{"": "col1"},
		GeoIndexes: map[string]string{"": "geom"},
		GeomType:   "Point",
	}, a.lg); err != nil {
		a.lg.Error(err)
	}

	layers, err := gis.BuildLayers(ctx, gis.BuildMode{
		Get:         true,
		Save:        true,
		PersistFile: "data/persist.json",
	}, a.db, a.lg)
	if err != nil {
		a.lg.Fatal(err)
	}
	a.layers = layers

	a.lg.Infof("finished buildling DataLayers, starting HTTP server at %s...", a.addr)

	if err := gis.UpsertStops(ctx, a.db, a.layers.Metro.Data.(*gis.StopMarkers)); err != nil {
		a.lg.Errorf("upsert failed: %v", err)
	}

	if err := gis.UpsertTracts(ctx, a.db, a.layers.TractsPoplDens); err != nil {
		a.lg.Errorf("upsert failed: %v", err)
	}
	if err := gis.UpsertCounties(ctx, a.db, a.layers.CountiesPoplDens); err != nil {
		a.lg.Errorf("upsert failed: %v", err)
	}
	mux := srv.NewMux(a.layers)
	if err := srv.Serve(a.addr, mux); err != nil {
		a.lg.Fatal(err)
	}
}
