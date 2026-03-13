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

	layers, err := gis.GetFeatureLayers(ctx, gis.LayerMeta{
		"bus":      &pgis.QBUS,
		"ml":       &pgis.QRAIL,
		"amtrak":   &pgis.QAMTRAK,
		"places":   &pgis.QPLACES,
		"cycle":    &pgis.QCYCLE,
		"tracts":   &pgis.QTRACTS,
		"counties": &pgis.QCOUNTIES,
	}, a.db, a.lg)
	if err != nil {
		a.lg.Fatal(err)
	}
	a.layers = layers

	a.lg.Infof("finished buildling DataLayers, starting HTTP server at %s...", a.addr)

	mux := srv.Mount(a.layers)
	if err := srv.Serve(a.addr, mux); err != nil {
		a.lg.Fatal(err)
	}
}
