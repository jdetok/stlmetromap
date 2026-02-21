package srv

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jamespfennell/gtfs"
	"github.com/jdetok/stlmetromap/pkg/gis"
	"github.com/jdetok/stlmetromap/pkg/util"
)

const ( 
	GET_DATA = false
	SAVE_DATA = false
	DATA_FILE = "./data/persist.json"
)

func SetupServer(ctx context.Context, static *gtfs.Static, stops *gis.StopMarkers) error {
	var err error
	layers := &gis.Layers{}

	if GET_DATA || (!GET_DATA && !util.FileExists(DATA_FILE)) {
		layers, err = gis.BuildLayers(ctx)
		if err != nil {
			return err
		}
	} else {
		if !util.FileExists(DATA_FILE) {
			return err
		}
		if err := layers.StructFromJSONFile(DATA_FILE); err != nil {
			return err
		}
	}
	if SAVE_DATA {
		layers.StructToJSONFile(DATA_FILE)
	}

	http.HandleFunc("/counties", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.Counties)
	})
	http.HandleFunc("/tracts", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.TractsPoplDens)
	})
	http.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, stops)
	})
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("www"))))

	fmt.Printf("listening at %v...\n", time.Now())
	return http.ListenAndServe(":3333", nil)
}

func HandleMetroStops(w http.ResponseWriter, r *http.Request, stops *gis.StopMarkers) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if err := json.NewEncoder(w).Encode(stops); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// func WriteJSONFile()
