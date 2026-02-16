package srv

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"slices"
	"strings"
	"text/template"

	"github.com/jamespfennell/gtfs"
)

type lalo struct {
	La float64 `json:"latitude"`
	Lo float64 `json:"longitude"`
	Name string `json:"name"`
	Typ string `json:"typ"`
}

func SetupServer(ctx context.Context, static *gtfs.Static) error {
	tmpl := template.Must(template.ParseFiles("www/index.html"))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	http.HandleFunc("/oldstops", func(w http.ResponseWriter, r *http.Request) {HandleStops(w, r, static)})
	http.HandleFunc("/mlrstops", func(w http.ResponseWriter, r *http.Request) {HandleMLRStops(w, r, static)})
	http.HandleFunc("/mlbstops", func(w http.ResponseWriter, r *http.Request) {HandleMLBStops(w, r, static)})
	http.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) {HandleAllStops(w, r, static)})
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

func HandleStops(w http.ResponseWriter, r *http.Request, static *gtfs.Static) {
    coords := make([]lalo, 0, len(static.Stops))

    for _, s := range static.Stops {
		// if i >= 500 { break }
        if s.Latitude == nil || s.Longitude == nil {
            continue
        }
        coords = append(coords, lalo{La: *s.Latitude, Lo: *s.Longitude, Name: s.Name})
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")

    if err := json.NewEncoder(w).Encode(coords); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}

func HandleMLRStops(w http.ResponseWriter, r *http.Request, s *gtfs.Static) {
	coords := []lalo{}
	for _, t := range s.Trips {
		if (t.ID == "3292103" || t.ID == "3292127") {
			for _, s := range t.StopTimes {
				coords = append(coords, lalo{La: *s.Stop.Latitude, Lo: *s.Stop.Longitude})		
			}
		}
	}
	   w.Header().Set("Content-Type", "application/json; charset=utf-8")

    if err := json.NewEncoder(w).Encode(coords); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}

func HandleMLBStops(w http.ResponseWriter, r *http.Request, s *gtfs.Static) {
	coords := []lalo{}
	for _, t := range s.Trips {
		if (t.ID == "3292104" || t.ID == "3292128") {
			for _, s := range t.StopTimes {
				coords = append(coords, lalo{La: *s.Stop.Latitude, Lo: *s.Stop.Longitude})		
			}
		}
	}
	   w.Header().Set("Content-Type", "application/json; charset=utf-8")

    if err := json.NewEncoder(w).Encode(coords); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}

func HandleAllStops(w http.ResponseWriter, r *http.Request, static *gtfs.Static) {
    coords := make([]lalo, 0, len(static.Stops))

	var redLineStops []string
	var blueLineStops []string
	var combinedStops []string

	for _, t := range static.Trips {
		if (t.ID == "3292103") {
			for _, s := range t.StopTimes {
				if s.Stop == nil { continue }
				redLineStops = append(redLineStops, s.Stop.Id)
			}
		}

		if (t.ID == "3292104") {
			for _, s := range t.StopTimes {
				if s.Stop == nil { continue }
				blueLineStops = append(blueLineStops, s.Stop.Id)
			}
		}
	}

	for _, rls := range redLineStops {
		if slices.Contains(blueLineStops, rls) {
			combinedStops = append(combinedStops, rls)
		}
	}

	var finalRLStops []string
	var finalBLStops []string
	for _, rls := range redLineStops {
		if !slices.Contains(combinedStops, rls) {
			finalRLStops = append(finalRLStops, rls)
		}
	}
	for _, bls := range blueLineStops {
		if !slices.Contains(combinedStops, bls) {
			finalBLStops = append(finalBLStops, bls)
		}
	}

    for _, s := range static.Stops {
		// if i >= 500 { break }
        if s.Latitude == nil || s.Longitude == nil {
            continue
        }

		c := lalo{La: *s.Latitude, Lo: *s.Longitude, Name: s.Name}

		if !strings.Contains(s.Name, "METROLINK") {
			c.Typ = "bus"
		} else {
			if slices.Contains(finalRLStops, s.Id) {
				c.Typ = "mlr"
			}
			if slices.Contains(finalBLStops, s.Id) {
				c.Typ = "mlb"
			}
			if slices.Contains(combinedStops, s.Id) {
				c.Typ = "mlc"
			}
		}
        coords = append(coords, c)
    }

    w.Header().Set("Content-Type", "application/json; charset=utf-8")

    if err := json.NewEncoder(w).Encode(coords); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}