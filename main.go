package main

import (
	"fmt"
	"html/template"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

// func getStatic() gtfs.Static {
// 	staticSTL := "https://www.metrostlouis.org/Transit/google_transit.zip"
// 	resp, _ := http.Get(staticSTL)
// 	b, _ := io.ReadAll(resp.Body)
// 	staticData, _ := gtfs.ParseStatic(b, gtfs.ParseStaticOptions{})
// 	return *staticData
// }

// func getRealtime() gtfs.Realtime {
// 	rtSTL := "https://www.metrostlouis.org/RealTimeData/StlRealTimeVehicles.pb"
// 	resp, _ := http.Get(rtSTL)
// 	b, _ := io.ReadAll(resp.Body)
// 	realtimeData, _ := gtfs.ParseRealtime(b, &gtfs.ParseRealtimeOptions{})
// 	return *realtimeData
// }

func main() {
	// staticData := getStatic()
	// fmt.Printf("STL Metro has %d routes and %d stations\n", len(staticData.Routes), len(staticData.Stops))
	// // fmt.Println(staticData)

	// realtimeData := getRealtime()
	// fmt.Printf("STL Metro currently has %d vehicles running or scheduled\n", len(realtimeData.Trips))

	// for i, t := range realtimeData.Trips {
	// 	v := t.Vehicle
	// 	fmt.Println(i)
	// 	fmt.Printf("%v, %v\n", *v.Position.Latitude, *v.Position.Longitude)
	// }

	if err := godotenv.Load(); err != nil {
		fmt.Println("no .env file")
	}

	tmpl := template.Must(template.ParseFiles("www/index.html"))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		data := struct {
			ArcGISKey string
		}{
			ArcGISKey: os.Getenv("ARCGIS_API_KEY"),
		}
		tmpl.Execute(w, data)
	})
	fmt.Println("listening...")
	http.ListenAndServe(":3333", nil)
}