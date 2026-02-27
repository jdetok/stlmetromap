package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
)

//
/*
cycle data from https://overpass-turbo.eu
QUERY:

[out:json][timeout:25];
(
  way["highway"="cycleway"](38.53,-90.32,38.75,-90.15);

);
out body;
>;
out skel qt;

*/

// PARKS: // nwr["leisure"="park"](37.9,-91,39.5,-89);

type GeoBikeData struct {
	Features []GeoBikeFeature `json:"features"`
}

func (d *GeoBikeData) Get(ctx context.Context, src string, isURL bool) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, d)
}

type GeoBikeFeature struct {
	Typ        string       `json:"type"`
	Properties GeoBikeProps `json:"properties"`
	Geometry   GeoBike      `json:"geometry"`
	ID         string       `json:"id"`
}

type GeoBikeProps struct {
	Typ           string `json:"type"`
	ID            string `json:"@id"`
	Bicycle       string `json:"bicycle"`
	Bridge        string `json:"bridge"`
	Foot          string `json:"foot"`
	Highway       string `json:"highway"`
	Name          string `json:"name"`
	OldRWOp       string `json:"old_railway_operator"`
	Oneway        string `json:"oneway"`
	Railway       string `json:"railway"`
	Surface       string `json:"surface"`
	Segregated    string `json:"segregated"`
	TigerCFCC     string `json:"tiger:cfcc"`
	TigerCounty   string `json:"tiger:county"`
	TigerNamseBae string `json:"tiger:name_base"`
}

type GeoBike struct {
	Typ    string      `json:"type"`
	Coords [][]float64 `json:"coordinates"`
}

func LoadBikePathFile(fname string) (*GeoBikeData, error) {
	data, err := os.ReadFile(fname)
	if err != nil {
		return nil, err
	}

	fmt.Printf("reading %d bytes from %s\n", len(data), fname)
	geo := &GeoBikeData{}
	if err := json.Unmarshal(data, geo); err != nil {
		return nil, err
	}
	return geo, nil
}
