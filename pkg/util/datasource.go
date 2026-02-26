package util

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/get"
)

type AppData interface {
	Get(ctx context.Context, src string, isURL bool) error
}

type DataSource struct {
	Kind  string  `json:"kind"`
	URL   string  `json:"url,omitempty"`
	Fname string  `json:"fname,omitempty"`
	Data  AppData `json:"-"`
}

func NewDataSourceFromURL(url, kind string, data AppData) *DataSource {
	return &DataSource{URL: url, Kind: kind, Data: data}
}

func NewDataSourceFromFile(fname, kind string, data AppData) *DataSource {
	return &DataSource{Fname: fname, Kind: kind, Data: data}
}

func (d *DataSource) GetDataSource(ctx context.Context) error {
	resp, err := get.Get(get.NewGetRequest(ctx, d.URL, true, 1, 3))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if err := json.NewDecoder(resp.Body).Decode(d.Data); err != nil {
		return err
	}
	return nil
}

func (d *DataSource) ReadDataSource(ctx context.Context) error {
	js, err := os.ReadFile(d.Fname)
	if err != nil {
		return fmt.Errorf("failed to read file at %s: %v", d.Fname, err)
	}
	fmt.Println("reading data from", d.Fname)
	if err := json.Unmarshal(js, d.Data); err != nil {
		return fmt.Errorf("failed to unmarshal data from %s: %v", d.Fname, err)
	}
	return nil
}

// have to register the kinds to determine the type assertion fn
var appDataRegistry = map[string]func() AppData{}

func RegisterAppData(kind string, ctor func() AppData) {
	appDataRegistry[kind] = ctor
}

// must overwrite json marshal/unmarshal to allow the metro stops struct to be read from the file
func (d *DataSource) MarshalJSON() ([]byte, error) {
	type Alias DataSource
	var raw json.RawMessage
	if d.Data != nil {
		b, err := json.Marshal(d.Data)
		if err != nil {
			return nil, err
		}
		raw = b
	}
	return json.Marshal(&struct {
		*Alias
		DataLwr json.RawMessage `json:"data"`
		Data    json.RawMessage `json:"Data"`
	}{
		Alias: (*Alias)(d),
		Data:  raw,
	})
}
func (d *DataSource) UnmarshalJSON(b []byte) error {
	type Alias DataSource

	aux := &struct {
		*Alias
		DataLwr json.RawMessage `json:"data"`
		Data    json.RawMessage `json:"Data"`
	}{
		Alias: (*Alias)(d),
	}
	if err := json.Unmarshal(b, aux); err != nil {
		return err
	}

	raw := aux.Data
	if len(raw) == 0 {
		raw = aux.DataLwr
	}

	if d.Kind == "" {
		return fmt.Errorf("unknown datasource kind")
	}

	ctor, ok := appDataRegistry[d.Kind]
	if !ok {
		return fmt.Errorf("unknown datasource kind: %q", d.Kind)
	}

	d.Data = ctor()

	if len(raw) == 0 {
		return nil
	}
	return json.Unmarshal(raw, d.Data)
}
