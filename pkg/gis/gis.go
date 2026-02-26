package gis

import (
	"math"
	"strconv"

	"github.com/jdetok/stlmetromap/pkg/util"
)

const CYCLE_FILE = "data/cycle_osm.geojson"

func init() {
	util.RegisterAppData("acs", func() util.AppData { return &ACSData{} })
	util.RegisterAppData("tgr", func() util.AppData { return &TGRData{} })
	util.RegisterAppData("stops", func() util.AppData { return &StopMarkers{} })
	util.RegisterAppData("bikes", func() util.AppData { return &GeoBikeData{} })
}

type GeoAttrs map[string]any

type GeoFeature struct {
	Geometry   Geo      `json:"geometry"`
	Attributes GeoAttrs `json:"attributes"`
}

type GeoTractFeatures struct {
	Features []GeoFeature `json:"features"`
}

type Geo struct {
	Rings [][][]float64 `json:"rings"`
	Paths [][][]float64 `json:"paths"`
}

func StopsInTracts(tracts []GeoFeature, stops []StopMarker) error {
	idxTracts := []TractNode{}
	for _, t := range tracts {
		rect, err := ComputeRectFromRings(t.Geometry.Rings)
		if err != nil {
			continue
		}
		idxTracts = append(idxTracts, TractNode{
			GEOID: t.Attributes["GEOID"].(string),
			Rings: t.Geometry.Rings,
			Rect:  rect,
		})
	}
	idx, err := NewIdx(idxTracts)
	if err != nil {
		return err
	}

	for i := range stops {
		lon := stops[i].Coords.Lo
		lat := stops[i].Coords.La
		geoid, ok := idx.PointInTract(lon, lat)
		if ok {
			stops[i].TractGEOID = geoid
		}
	}
	return nil
}

func CountStopsInTract(geoId string, stops []StopMarker) int {
	counter := 0
	for _, s := range stops {
		if s.TractGEOID == geoId {
			counter++
		}
	}
	return counter
}

func StopsPerTract(stops []StopMarker) map[string]int {
	m := map[string]int{}
	for _, s := range stops {
		if s.TractGEOID == "" {
			continue
		}
		m[s.TractGEOID]++
	}
	return m
}

// Combine geographic data from TIGER with census data from ACS
func DemographicsForTracts(geo *TGRData, acs *ACSData, stops *StopMarkers) *GeoTractFeatures {
	feats := &GeoTractFeatures{}
	for i := range geo.Features {
		f := geo.Features[i]

		stopsPerTract := StopsPerTract(stops.Stops)
		busStopsPerTract := StopsPerTract(stops.BusStops)
		mlStopsPerTract := StopsPerTract(stops.MlStops)

		// ACS appends the US code= for the GEOID, TIGER does not
		geoId := f.Attributes.GEOID

		acsGeoId := "1400000US" + geoId
		acsObj := acs.Data[acsGeoId]
		popl, _ := strconv.ParseFloat(acsObj["B01003_001E"], 64)
		area := f.Attributes.AREALAND
		feats.Features = append(feats.Features, GeoFeature{
			Geometry: f.Geometry,
			Attributes: map[string]any{
				"GEOID":              geoId,
				"STOPS_IN_TRACT":     stopsPerTract[geoId],
				"BUS_STOPS_IN_TRACT": busStopsPerTract[geoId],
				"ML_STOPS_IN_TRACT":  mlStopsPerTract[geoId],
				"TRACT":              f.Attributes.TRACT,
				"COUNTY":             f.Attributes.COUNTY,
				"AREALAND":           area,
				"POPL":               popl,
				"POPLSQMI":           getPoplDensity(area, popl),
				"INCOME":             acsObj["B06011_001E"],
				"AGE":                acsObj["B01002_001E"],
				"MGRENT":             acsObj["B25064_001E"],
				"INC_BELOW_POV":      acsObj["B17001_002E"],
				"HAS_COMP":           acsObj["B28008_002E"],
				"PCT_HAS_COMP":       divideStringInts(acsObj["B28008_002E"], acsObj["B01003_001E"]),
				"PCT_INC_BELOW_POV":  divideStringInts(acsObj["B17001_002E"], acsObj["B01003_001E"]),
			},
		})
	}
	return feats
}

func GeoFeaturesFromTGR(geo *TGRData) []GeoFeature {
	feats := make([]GeoFeature, 0, len(geo.Features))
	for i := range geo.Features {
		f := geo.Features[i]
		feats = append(feats, GeoFeature{
			Geometry: f.Geometry,
			Attributes: GeoAttrs{
				"GEOID": f.Attributes.GEOID,
			},
		})
	}
	return feats
}

// Pass an area and population, get persons/square mile
func getPoplDensity(area string, popl float64) float64 {
	var metersToMiles float64 = 2589988
	sqMeters, _ := strconv.ParseFloat(area, 64)
	sqMi := sqMeters / metersToMiles
	return math.Round((popl/sqMi)*100) / 100
}

func divideStringInts(s1, s2 string) float64 {
	f1, _ := strconv.ParseFloat(s1, 64)
	f2, _ := strconv.ParseFloat(s2, 64)
	if f2 == 0 {
		return 0
	}
	return math.Round(f1/f2*10000) / 100
}
