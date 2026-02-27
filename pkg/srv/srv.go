package srv

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jdetok/stlmetromap/pkg/gis"
	"github.com/jdetok/stlmetromap/pkg/util"
)

const (
	GET_DATA   = false
	SAVE_DATA  = false
	DATA_FILE  = "data/persist.json"
	CYCLE_FILE = "data/cycle_osm.geojson"
)

func SetupServer(ctx context.Context) error {
	var err error
	layers := &gis.DataLayers{Outfile: DATA_FILE}

	if GET_DATA || (!GET_DATA && !util.FileExists(DATA_FILE)) {
		layers, err = gis.GetDataLayers(ctx, DATA_FILE)
		if err != nil {
			return err
		}
	} else {
		if !util.FileExists(DATA_FILE) {
			return err
		}
		if err := layers.DataFromJSONFile(); err != nil {
			return err
		}
	}

	if SAVE_DATA {
		if err := layers.DataToJSONFile(); err != nil {
			return err
		}
	}

	http.HandleFunc("/counties", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.CountiesPoplDens)
	})
	http.HandleFunc("/tracts", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.TractsPoplDens)
	})

	http.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, &gis.StopMarkers{Stops: layers.Metro.Data.(*gis.StopMarkers).Stops})
	})
	http.HandleFunc("/stops/bus", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, &gis.StopMarkers{Stops: layers.Metro.Data.(*gis.StopMarkers).BusStops})
	})
	http.HandleFunc("/stops/ml", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, &gis.StopMarkers{Stops: layers.Metro.Data.(*gis.StopMarkers).MlStops})
	})
	http.HandleFunc("/bikes", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.Bikes.Data)
	})
	http.HandleFunc("/about", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "www/about.html")
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
