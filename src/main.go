package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/gis"
	"github.com/jdetok/stlmetromap/pkg/srv"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	zapLog, err := zap.NewDevelopment()
	defer zapLog.Sync()
	if err != nil {
		fmt.Printf("An error occured configuring the logger: %s\n", err.Error())
		os.Exit(1)
	}

	a := &app{
		addr: ":3333",
		lg:   zapLog.Sugar(),
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

	a.lg.Infof("Data layers built: starting HTTP server at %s...", a.addr)

	mux := srv.NewMux(a.layers)
	if err := srv.Serve(a.addr, mux); err != nil {
		a.lg.Fatal(err)
	}
}
