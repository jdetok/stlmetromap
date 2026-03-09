package srv

import (
	"encoding/json"
	"net/http"

	"github.com/jdetok/stlmetromap/pkg/gis"
)

const (
	GET_DATA  = false
	SAVE_DATA = false
	DATA_FILE = "data/persist.json"
)

func NewMux(layers *gis.DataLayers) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("server is healthy"))
	})

	mux.HandleFunc("/counties", func(w http.ResponseWriter, r *http.Request) {
		layers.Counties.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/tracts", func(w http.ResponseWriter, r *http.Request) {
		layers.Tracts.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/metrobus", func(w http.ResponseWriter, r *http.Request) {
		layers.BusStops.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/metrolink", func(w http.ResponseWriter, r *http.Request) {
		layers.TrnStops.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/amtrak", func(w http.ResponseWriter, r *http.Request) {
		layers.Amtrak.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/bikes", func(w http.ResponseWriter, r *http.Request) {
		layers.CyclePaths.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/grocery", func(w http.ResponseWriter, r *http.Request) {
		layers.Grocery.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/school", func(w http.ResponseWriter, r *http.Request) {
		layers.Schools.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/social", func(w http.ResponseWriter, r *http.Request) {
		layers.Social.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/parks", func(w http.ResponseWriter, r *http.Request) {
		layers.Parks.WriteJSONResp(w, r)
	})
	mux.HandleFunc("/fun", func(w http.ResponseWriter, r *http.Request) {
		layers.Fun.WriteJSONResp(w, r)
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

func WriteJSONResp(w http.ResponseWriter, r *http.Request, features *gis.FeatureColl) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(features); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
