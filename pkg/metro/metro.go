package metro

import (
	"io"
	"net/http"

	"github.com/jamespfennell/gtfs"
)

func GetStatic() (*gtfs.Static, error) {
	staticSTL := "https://www.metrostlouis.org/Transit/google_transit.zip"
	resp, err := http.Get(staticSTL)
	if err != nil { return nil, err }
	b, err := io.ReadAll(resp.Body) 
	if err != nil { return nil, err }
	staticData, err := gtfs.ParseStatic(b, gtfs.ParseStaticOptions{})
	if err != nil { return nil, err }
	return staticData, nil
}

func GetRealtime() gtfs.Realtime {
	rtSTL := "https://www.metrostlouis.org/RealTimeData/StlRealcTimeVehicles.pb"
	resp, _ := http.Get(rtSTL)
	b, _ := io.ReadAll(resp.Body)
	realtimeData, _ := gtfs.ParseRealtime(b, &gtfs.ParseRealtimeOptions{})
	return *realtimeData
}


