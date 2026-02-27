package srv

import (
	"encoding/json"
	"net/http"

	"github.com/jdetok/stlmetromap/pkg/gis"
)

const (
	GET_DATA   = false
	SAVE_DATA  = false
	DATA_FILE  = "data/persist.json"
	CYCLE_FILE = "data/cycle_osm.geojson"
)

func NewMux(layers *gis.DataLayers) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/counties", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.CountiesPoplDens)
	})
	mux.HandleFunc("/tracts", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.TractsPoplDens)
	})

	mux.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, &gis.StopMarkers{Stops: layers.Metro.Data.(*gis.StopMarkers).Stops})
	})
	mux.HandleFunc("/stops/bus", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, &gis.StopMarkers{Stops: layers.Metro.Data.(*gis.StopMarkers).BusStops})
	})
	mux.HandleFunc("/stops/ml", func(w http.ResponseWriter, r *http.Request) {
		HandleMetroStops(w, r, &gis.StopMarkers{Stops: layers.Metro.Data.(*gis.StopMarkers).MlStops})
	})
	mux.HandleFunc("/bikes", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.Bikes.Data)
	})
	mux.HandleFunc("/about", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "www/about.html")
	})
	mux.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	mux.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("www"))))
	return mux
}

func Serve(addr string, handler http.Handler) error {
	return http.ListenAndServe(addr, handler)
}

func HandleMetroStops(w http.ResponseWriter, r *http.Request, stops *gis.StopMarkers) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if err := json.NewEncoder(w).Encode(stops); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// func WriteJSONFile()
