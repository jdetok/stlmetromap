package srv

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"
	"net/http"
	"time"

	"github.com/jamespfennell/gtfs"
	"github.com/jdetok/stlmetromap/pkg/gis"
	"github.com/jdetok/stlmetromap/pkg/metro"
	"golang.org/x/sync/errgroup"
)

const (
	CensusCountiesWhere = "STATE = '29' AND COUNTY IN ('099','071','183','189','219','510') OR STATE = '17' AND COUNTY IN ('005','013','027','083','117','119','133','163')"
	CensusTractsWhere   = "(STATE = '29' AND COUNTY IN ('099','071','183','189','219','510')) OR (STATE = '17' AND COUNTY IN ('005','013','027','083','117','119','133','163'))"
	countiesURL = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2025/MapServer/82"
	tractsURL   = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2025/MapServer/8"
)

func buildLayerData(ctx context.Context) (*gis.Layers, error) {
	g, ctx := errgroup.WithContext(ctx)
	// layers := &gis.Layers{}

	counties := &gis.GeoData{}
	tracts := &gis.GeoData{}
	poplDens := gis.GeoIDPopl{}
	// tractPoplDens := &gis.GeoPoplTract{}

	g.Go(func() error {
		moPop, err := gis.FetchACSPopulation(ctx, "29", []string{"099", "071", "183", "189", "219", "510"})
		if err != nil {
			return fmt.Errorf("failed to fetch MO population: %w", err)
		}
		ilPop, err := gis.FetchACSPopulation(ctx, "17", []string{"005", "013", "027", "083", "117", "119", "133", "163"})
		if err != nil {
			return fmt.Errorf("failed to fetch IL population: %w", err)
		}
		maps.Copy(moPop, ilPop)
		// maps.Copy()
		poplDens = moPop
		return nil
	})

	g.Go(func() error {
		var err error
		counties, err = gis.FetchTigerData(ctx, countiesURL, CensusCountiesWhere)
		if err != nil {
			return fmt.Errorf("failed to fetch counties: %w", err)
		}
		return nil
	})

	g.Go(func() error {
		var err error
		tracts, err = gis.FetchTigerData(ctx, tractsURL, CensusTractsWhere)
		if err != nil {
			return fmt.Errorf("failed to fetch tracts: %w", err)
		}
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return &gis.Layers{
		Counties: counties,
		Tracts: tracts,
		PoplDens: poplDens,
		TractsPoplDens: gis.JoinPopulation(tracts, poplDens),
	}, nil
}

func SetupServer(ctx context.Context, static *gtfs.Static, stops *metro.StopMarkers) error {
	layers, err := buildLayerData(ctx)
	if err != nil {
		return err
	}

	http.HandleFunc("/counties", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.Counties)
	})
	http.HandleFunc("/tracts", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(layers.TractsPoplDens)
	})
	http.HandleFunc("/stops", func(w http.ResponseWriter, r *http.Request) { 
		HandleMetroStops(w, r, stops)
	})
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("www/js"))))
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("www/css"))))
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("www"))))

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

// func WriteJSONFile()