package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/jdetok/stlmetromap/pkg/get"
	"golang.org/x/sync/errgroup"
)

const (
	TIGER       = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2025/MapServer/"
	TIGER_WHERE = "(STATE = '29' AND COUNTY IN ('099','071','183','189','219','510')) OR (STATE = '17' AND COUNTY IN ('005','013','027','083','117','119','133','163'))"
	ACS_URL     = "https://api.census.gov/data/2023/acs/acs5"
	ACS_GET     = "B01003_001E,GEO_ID"
	ACS_FOR     = "tract:*"
	ACS_KEY     = "CENSUS_API_KEY"
	TIGER_RR    = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/"
)

func FetchTigerData(ctx context.Context, serverNum int) (*GeoData, error) {
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

	var result = &GeoData{}
	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		fmt.Println("error decoding JSON:", err)
	}
	fmt.Println("fetched", len(result.Features), "features")

	return result, nil
}
func FetchTigerRR(ctx context.Context, serverNum int) (*GeoData, error) {
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

	var result = &GeoData{}
	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		fmt.Println("error decoding JSON:", err)
	}
	fmt.Println("fetched", len(result.Features), "features")

	return result, nil
}
func FetchACSPopulation(ctx context.Context, state string, counties []string) (GeoIDPopl, error) {
	popByGEOID := GeoIDPopl{}
	var mu sync.Mutex
	g, errCtx := errgroup.WithContext(ctx)
	for _, county := range counties {
		g.Go(func() error {
			url := fmt.Sprintf("https://api.census.gov/data/2023/acs/acs5?%s", url.Values{
				"key": {os.Getenv(ACS_KEY)},
				"get": {ACS_GET},
				"for": {ACS_FOR},
				"in":  {fmt.Sprintf("state:%s county:%s", state, county)},
			}.Encode())
			fmt.Println("querying:", url)

			resp, err := get.Get(get.NewGetRequest(ctx, url, true, 1, 3))
			if err != nil {
				return err
			}
			defer resp.Body.Close()

			var rows [][]string
			json.NewDecoder(resp.Body).Decode(&rows)
			if len(rows) == 0 {
				fmt.Println("warning: empty response from Census API for", state, county, resp.Status, "|", url)
				return nil
			}
			for _, row := range rows[1:] {
				geoid := strings.TrimPrefix(row[1], "1400000US")
				pop, _ := strconv.ParseFloat(row[0], 64)
				mu.Lock()
				popByGEOID[geoid] = pop
				mu.Unlock()
			}
			return nil
		})
	}
	if errCtx.Err() != nil {
		return popByGEOID, errCtx.Err()
	}
	if err := g.Wait(); err != nil {
		return popByGEOID, err
	}
	return popByGEOID, nil
}
