package gis

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/get"
)

const (
	ACS_BASE_URL      = "https://api.census.gov/data/2023/acs/acs5"
	ACS_HEADER_FIELDS = "GEO_ID,NAME,B01003_001E,B01001_002E,B01001_026E,B02001_002E,B02001_003E,B02001_004E,B02001_005E,B02001_006E,B02001_007E,B02001_008E,B02001_009E,B02001_010E,B06011_001E,B01002_001E,B17001_002E,B25064_001E,B28008_002E"
	ACS_IN_MO         = "state:29+county:510,189,183,099,071,219"
	ACS_IN_IL         = "state:17+county:163,119,133,083,013,117,027,005"
	ACS_KEY           = "CENSUS_API_KEY"
)

type ACSHeaders map[string]string

func buildACSHeaders() ACSHeaders {
	return ACSHeaders{
		"B01003_001E": "Total Population",
		"B01001_002E": "Male Population",
		"B01001_026E": "Female Population",
		"B02001_002E": "White Population",
		"B02001_003E": "African American Population",
		"B02001_004E": "American Indian/Native Alaskan Population",
		"B02001_005E": "Asian Population",
		"B02001_006E": "Native Hawaiian/Pacific Islander Population",
		"B02001_007E": "Other Race Population",
		"B02001_008E": "Two+ Race Population",
		"B02001_009E": "Two+ Races including other Population",
		"B02001_010E": "Two+, Two+ including other, Three+ Races Population",
		"B06011_001E": "Median Income Past 12 Months",
		"B01002_001E": "Median Age",
		"B17001_002E": "Income Past 12 Months Below Poverty Level",
		"B25064_001E": "Median Gross Rent",
		"B28008_002E": "Presence of a Component and type of internet",
	}
}

type ACSQueries struct {
	Mo string
	Il string
}

// builds full URL strings for MO and IL queries
func buildACSUrls() *ACSQueries {
	return &ACSQueries{
		Mo: buildACSUrl(ACS_IN_MO),
		Il: buildACSUrl(ACS_IN_IL),
	}
}
func buildACSUrl(stateIn string) string {
	return fmt.Sprintf("%s?for=tract:*&get=%s&in=%s&key=%s",
		ACS_BASE_URL,
		ACS_HEADER_FIELDS,
		stateIn,
		os.Getenv(ACS_KEY),
	)
}

// map GEOID to a map containing header:val (map[1400000US123...]["B01003_001E"]"1234")
type ACSObj map[string]map[string]string

// responses from ACS data come as an array of headers then a raw array for each object
type ACSData struct {
	Labels ACSHeaders
	Data   ACSObj
}

// send get request for both URLs, fill map
func (d *ACSData) Get(ctx context.Context, src string, isURL bool) error {
	data := ACSObj{}
	urls := buildACSUrls()
	for _, url := range []string{urls.Mo, urls.Il} {
		// fmt.Println(url)
		// fmt.Printf("getting data from %s\n", url)
		resp, err := get.Get(get.NewGetRequest(ctx, url, true, 1, 3))
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		var rows [][]string
		if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
			return err
		}

		for _, row := range rows[1:] {
			gid := row[0]
			data[gid] = map[string]string{}
			for i, d := range row {
				data[gid][rows[0][i]] = d
			}
		}
	}
	d.Labels = buildACSHeaders()
	d.Data = data
	return nil
}

// send get request for both URLs, fill map
func GetACSData(ctx context.Context) (*ACSData, error) {
	data := ACSObj{}
	urls := buildACSUrls()
	for _, url := range []string{urls.Mo, urls.Il} {
		// fmt.Println(url)
		resp, err := get.Get(get.NewGetRequest(ctx, url, true, 1, 3))
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var rows [][]string
		if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
			return nil, err
		}

		for _, row := range rows[1:] {
			gid := row[0]
			data[gid] = map[string]string{}
			for i, d := range row {
				data[gid][rows[0][i]] = d
			}
		}
	}
	return &ACSData{Labels: buildACSHeaders(), Data: data}, nil
}
