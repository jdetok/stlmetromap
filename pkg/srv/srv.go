package srv

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"text/template"
	"time"

	"github.com/jamespfennell/gtfs"
	"github.com/jdetok/stlmetromap/pkg/metro"
)

type lalo struct {
	La float64 `json:"latitude"`
	Lo float64 `json:"longitude"`
	Name string `json:"name"`
	Typ string `json:"typ"`
}

func SetupServer(ctx context.Context, static *gtfs.Static, stops *metro.StopMarkers) error {
	tmpl := template.Must(template.ParseFiles("www/index.html"))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	http.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) {HandleMetroStops(w, r, stops)})
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data := struct {
			ArcGISKey string
		}{
			ArcGISKey: os.Getenv("ARCGIS_API_KEY"),
		}
		tmpl.Execute(w, data)
	})

	if ctx.Err() != nil {
		return ctx.Err()
	}
	fmt.Printf("listening at %v...\n", time.Now())
	return http.ListenAndServe(":3333", nil)
}

func HandleMetroStops(w http.ResponseWriter, r *http.Request, stops *metro.StopMarkers) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

    if err := json.NewEncoder(w).Encode(stops); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}
