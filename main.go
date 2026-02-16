package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/jamespfennell/gtfs"
	"github.com/joho/godotenv"
	"golang.org/x/sync/errgroup"
)

func getStatic() (*gtfs.Static, error) {
	staticSTL := "https://www.metrostlouis.org/Transit/google_transit.zip"
	resp, err := http.Get(staticSTL)
	if err != nil { return nil, err }
	b, err := io.ReadAll(resp.Body) 
	if err != nil { return nil, err }
	staticData, err := gtfs.ParseStatic(b, gtfs.ParseStaticOptions{})
	if err != nil { return nil, err }
	return staticData, nil
}

// func getRealtime() gtfs.Realtime {
// 	rtSTL := "https://www.metrostlouis.org/RealTimeData/StlRealTimeVehicles.pb"
// 	resp, _ := http.Get(rtSTL)
// 	b, _ := io.ReadAll(resp.Body)
// 	realtimeData, _ := gtfs.ParseRealtime(b, &gtfs.ParseRealtimeOptions{})
// 	return *realtimeData
// }

func setupServer(ctx context.Context, static *gtfs.Static) error {
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
    // 

    if err := json.NewEncoder(w).Encode(coords); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}


type lalo struct {
	La float64 `json:"latitude"`
	Lo float64 `json:"longitude"`
}

func main() {

	if err := godotenv.Load(); err != nil {
		fmt.Println("no .env file")
	}

	staticData := &gtfs.Static{}
	st, err := getStatic()
	if err != nil {
		fmt.Println("couldn't fetch static data:", err)
	}
	staticData = st

	g, ctx := errgroup.WithContext(context.Background())

	g.Go(func() error {
		return setupServer(ctx, staticData)
	})
	
	if err := g.Wait(); err != nil {
		log.Fatal(err)
	}

}

	
	// fmt.Printf("STL Metro has %d routes and %d stations\n", len(staticData.Routes), len(staticData.Stops))
	// // fmt.Println(staticData)

	// realtimeData := getRealtime()
	// fmt.Printf("STL Metro currently has %d vehicles running or scheduled\n", len(realtimeData.Trips))

	// for i, t := range realtimeData.Trips {
	// 	v := t.Vehicle
	// 	fmt.Println(i)
	// 	fmt.Printf("%v, %v\n", *v.Position.Latitude, *v.Position.Longitude)
	// }


	