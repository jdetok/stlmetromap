package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/gis"
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
		a.lg.Fatal("failed to load environment variables")
	}

	a.lg.Info("Environment configured, building data layers...")
	layers, err := gis.BuildLayers(context.Background(), gis.BuildMode{
		Get:         true,
		Save:        true,
		PersistFile: "data/persist.json",
	}, a.lg)
	if err != nil {
		a.lg.Fatal(err)
	}
	a.layers = layers

	a.lg.Infof("finished buildling DataLayers, starting HTTP server at %s...", a.addr)

	mux := srv.NewMux(a.layers)
	if err := srv.Serve(a.addr, mux); err != nil {
		a.lg.Fatal(err)
	}
}
