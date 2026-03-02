package etl

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

type ACSHdrsVals map[string]map[string]string

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

func (m ACSHdrsVals) Get(ctx context.Context) error {
	urls := buildACSUrls()
	for _, url := range []string{urls.Mo, urls.Il} {
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
			m[gid] = map[string]string{}
			for i, d := range row {
				m[gid][rows[0][i]] = d
			}
		}
	}
	return nil
}
