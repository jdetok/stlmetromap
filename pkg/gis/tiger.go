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

func NewTigerGeoData(serverNum int, useWhere bool) *util.DataSource {
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
