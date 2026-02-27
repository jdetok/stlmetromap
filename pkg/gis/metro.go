package gis

import (
	"context"
	"fmt"
	"io"

	"github.com/jamespfennell/gtfs"
	"github.com/jdetok/stlmetromap/pkg/get"
)

const (
	METRO_STATIC_URL   = "https://www.metrostlouis.org/Transit/google_transit.zip"
	METRO_REALTIME_URL = "https://www.metrostlouis.org/RealTimeData/StlRealcTimeVehicles.pb"
	DOTIMEOUT          = true
	TIMEOUT            = 1
	ATTEMPTS           = 3
)

// slice of cleaned/transformed stops, returned to client from /stops endpoint
type StopMarkers struct {
	Stops    []StopMarker `json:"stops"`
	BusStops []StopMarker `json:"busStops"`
	MlStops  []StopMarker `json:"mlStops"`
}

type BusStopMarkers struct {
	BusStops []StopMarker `json:"stops"`
}

type MlStopMarkers struct {
	MlStops []StopMarker `json:"stops"`
}

type StopMarker struct {
	ID         string      `json:"id"`
	Name       string      `json:"name"`
	StopType   string      `json:"typ"`
	WhlChr     string      `json:"whlChr"`
	Routes     []Route     `json:"routes"`
	Coords     Coordinates `json:"yx"`
	TractGEOID string      `json:"tractGeoid,omitempty"`
}

type Route struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	NameLong string `json:"nameLong"`
}

type Routes map[*gtfs.Stop]map[*gtfs.Route]struct{}

func (d *StopMarkers) Get(ctx context.Context, src string, isURL bool) error {
	st, err := GetMetroStaticGTFS(ctx)
	if err != nil {
		return err
	}
	rts := MapRoutesToStops(st)
	stops := rts.BuildStops()
	*d = *stops
	return nil
}

func GetMetroStaticGTFS(ctx context.Context) (*gtfs.Static, error) {
	resp, err := get.Get(get.NewGetRequest(ctx, METRO_STATIC_URL, DOTIMEOUT, TIMEOUT, ATTEMPTS))
	if err != nil {
		return nil, fmt.Errorf("failed to get data: %w", err)
	}
	js, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	return gtfs.ParseStatic(js, gtfs.ParseStaticOptions{})
}

func GetMetroRealtimeGTFS(ctx context.Context) (*gtfs.Realtime, error) {
	resp, err := get.Get(get.NewGetRequest(ctx, METRO_REALTIME_URL, DOTIMEOUT, TIMEOUT, ATTEMPTS))
	if err != nil {
		return nil, fmt.Errorf("get request failed: %w", err)
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}
	return gtfs.ParseRealtime(b, &gtfs.ParseRealtimeOptions{})
}

func MapRoutesToStops(s *gtfs.Static) Routes {
	rts := Routes{}
	for _, t := range s.Trips {
		for _, st := range t.StopTimes {
			if rts[st.Stop] == nil {
				rts[st.Stop] = map[*gtfs.Route]struct{}{}
			}
			rts[st.Stop][t.Route] = struct{}{}
		}
	}
	return rts
}

func (r Routes) BuildStops() *StopMarkers {
	stops := []StopMarker{}
	busStops := []StopMarker{}
	mlStops := []StopMarker{}
	for k, v := range r {
		sm := StopMarker{
			ID:     k.Id,
			Name:   k.Name,
			WhlChr: k.WheelchairBoarding.String(),
			Coords: Coordinates{
				La: *k.Latitude,
				Lo: *k.Longitude,
			},
		}

		isMLB := false
		isMLR := false
		for rt := range v {
			if rt.ShortName == "MLB" {
				if isMLB {
					continue
				}
				isMLB = true
			}
			if rt.ShortName == "MLR" {
				if isMLR {
					continue
				}
				isMLR = true
			}
			sm.Routes = append(sm.Routes, Route{
				ID:       rt.Id,
				Name:     rt.ShortName,
				NameLong: rt.LongName,
			})
		}
		// assign stop type
		switch {
		case (isMLB && isMLR):
			sm.StopType = "mlc"
		case (isMLB):
			sm.StopType = "mlb"
		case (isMLR):
			sm.StopType = "mlr"
		default:
			sm.StopType = "bus"
		}

		stops = append(stops, sm)
		if isMLB || isMLR {
			mlStops = append(mlStops, sm)
		} else {
			busStops = append(busStops, sm)
		}
	}
	return &StopMarkers{
		Stops:    stops,
		BusStops: busStops,
		MlStops:  mlStops,
	}
}
