package srv

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"text/template"

	"github.com/jamespfennell/gtfs"
)
func SetupServer(ctx context.Context, static *gtfs.Static) error {
	tmpl := template.Must(template.ParseFiles("www/index.html"))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	http.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) {
		HandleStop(w, r, static)
})
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
	fmt.Println("listening...")
	return http.ListenAndServe(":3333", nil)
}

func HandleStop(w http.ResponseWriter, r *http.Request, static *gtfs.Static) {
    coords := make([]lalo, 0, len(static.Stops))

    for _, s := range static.Stops {
		// if i >= 500 { break }
        if s.Latitude == nil || s.Longitude == nil {
            continue
        }
        coords = append(coords, lalo{La: *s.Latitude, Lo: *s.Longitude})
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")

    if err := json.NewEncoder(w).Encode(coords); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}


type lalo struct {
	La float64 `json:"latitude"`
	Lo float64 `json:"longitude"`
}
