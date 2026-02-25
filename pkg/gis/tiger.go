package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"os"

	"github.com/jdetok/stlmetromap/pkg/get"
	"github.com/jdetok/stlmetromap/pkg/util"
)

const (
	TIGER       = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2025/MapServer/"
	TIGER_WHERE = "(STATE = '29' AND COUNTY IN ('099','071','183','189','219','510')) OR (STATE = '17' AND COUNTY IN ('005','013','027','083','117','119','133','163'))"
	TIGER_RR    = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/"
)

// build GIS structs to build feature layers
type TGRData struct {
	Features []TgrFeature `json:"features"`
}
type TgrFeature struct {
	Attributes TgrAttributes `json:"attributes"`
	Geometry   Geo           `json:"geometry"`
}

type TgrAttributes struct {
	MTFCC      string
	OID        string
	GEOID      string
	STATE      string
	COUNTY     string
	TRACT      string
	BASENAME   string
	NAME       string
	LSADC      string
	AREALAND   string
	CENTLAT    string
	CENTLON    string
	INTPTLAT   string
	INTPTLON   string
	OBJECTID   int
	POPULATION string
	POP_SQMI   string
}

func (t *TGRData) Get(ctx context.Context, src string, isURL bool) error {
	var err error
	var byts []byte
	if isURL {
		resp, rErr := get.Get(get.NewGetRequest(ctx, src, true, 1, 3))
		if rErr != nil {
			return rErr
		}
		defer resp.Body.Close()
		byts, err = io.ReadAll(resp.Body)

	} else {
		byts, err = os.ReadFile(src)
	}
	if err != nil {
		return err
	}
	// no errors reading data, unmarshal

	return json.Unmarshal(byts, t)
}

func NewTigerCounties(serverNum int, useWhere bool) *util.DataSource {
	var where string
	if useWhere {
		where = TIGER_WHERE
	} else {
		where = "1=1"
	}

	return util.NewDataSourceFromURL(buildTigerURL(TIGER, where, serverNum), &TGRData{})
}

func buildTigerURL(base, where string, serverNum int) string {
	return fmt.Sprintf("%s%d/query?%s", base, serverNum, url.Values{
		"f":              {"json"},
		"outFields":      {"*"},
		"outSR":          {"4326"},
		"where":          {where},
		"returnGeometry": {"true"},
	}.Encode())
}

func FetchTgrData(ctx context.Context, serverNum int, useWhere bool, useGeo bool) (*TGRData, error) {
	var where string
	if useWhere {
		where = TIGER_WHERE
	} else {
		where = "1=1"
	}

	// urlVals := url.Values{}

	url := buildTigerURL(TIGER, where, serverNum)
	fmt.Println("querying:", url)

	resp, err := get.Get(get.NewGetRequest(ctx, url, true, 1, 3))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result = &TGRData{}
	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		fmt.Println("error decoding JSON:", err)
	}
	fmt.Println("fetched", len(result.Features), "features")

	return result, nil
}

func FetchTigerData(ctx context.Context, serverNum int) (*TGRData, error) {
	url := fmt.Sprintf("%s%d/query?%s", TIGER, serverNum, url.Values{
		"f":              {"json"},
		"outFields":      {"*"},
		"outSR":          {"4326"},
		"where":          {TIGER_WHERE},
		"returnGeometry": {"true"},
	}.Encode())

	fmt.Println("querying:", url)

	resp, err := get.Get(get.NewGetRequest(ctx, url, true, 1, 3))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result = &TGRData{}
	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		fmt.Println("error decoding JSON:", err)
	}
	fmt.Println("fetched", len(result.Features), "features")

	return result, nil
}
func FetchTigerRR(ctx context.Context, serverNum int) (*TGRData, error) {
	url := fmt.Sprintf("%s%d/query?%s", TIGER_RR, serverNum, url.Values{
		"f":              {"json"},
		"where":          {"1=1"},
		"geometry":       {"-91,38,-89.5,39.2"},
		"geometryType":   {"esriGeometryEnvelope"},
		"outFields":      {"*"},
		"inSR":           {"4326"},
		"returnGeometry": {"true"},
	}.Encode())

	fmt.Println("querying:", url)

	resp, err := get.Get(get.NewGetRequest(ctx, url, true, 1, 3))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result = &TGRData{}
	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		fmt.Println("error decoding JSON:", err)
	}
	fmt.Println("fetched", len(result.Features), "features")

	return result, nil
}
