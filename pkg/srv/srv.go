package srv

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jdetok/stlmetromap/pkg/gis"
)

func Mount(layers gis.FeatureLayers) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("server is healthy"))
	})

	mountLayers(mux, layers)

	mux.HandleFunc("/about", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "www/about.html")
	})
	mountStatic(mux)

	return mux
}

func mountStatic(mux *http.ServeMux) {
	toMount := []string{"/", "js", "css"}
	for _, m := range toMount {
		dir := "www"
		q := m
		if m != "" {
			dir += fmt.Sprintf("/%s", m)
			q = fmt.Sprintf("/%s/", m)
		}
		mux.Handle(q, http.StripPrefix(q, http.FileServer(http.Dir(dir))))
	}

}

func mountLayers(mux *http.ServeMux, layers gis.FeatureLayers) {
	for name, data := range layers {
		mux.HandleFunc(fmt.Sprintf("/layers/%s", name), func(w http.ResponseWriter, r *http.Request) {
			data.Features.WriteJSONResp(w, r)
		})
	}
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
