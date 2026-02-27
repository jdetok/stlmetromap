package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jdetok/stlmetromap/pkg/gis"
	"github.com/jdetok/stlmetromap/pkg/srv"
	"github.com/joho/godotenv"
)

const DATA_FILE = "data/persist.json"

var build = gis.BuildMode{
	Get:         true,
	Save:        true,
	PersistFile: "data/persist.json",
}

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("no .env file")
	}

	layers, err := gis.BuildLayers(context.Background(), gis.BuildMode{
		Get:         true,
		Save:        true,
		PersistFile: "data/persist.json",
	})
	if err != nil {
		log.Fatal(err)
	}

	mux := srv.NewMux(layers)
	if err := srv.Serve(":3333", mux); err != nil {
		log.Fatal(err)
	}
}
