package util

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/get"
)

type AppData interface {
	Get(ctx context.Context, src string, isFile bool) error
}

type DataSource struct {
	URL   string
	Fname string
	Data  AppData `json:"data"`
}

func NewDataSourceFromURL(url string, data AppData) *DataSource {
	return &DataSource{URL: url, Data: data}
}

func NewDataSourceFromFile(fname string, data AppData) *DataSource {
	return &DataSource{Fname: fname, Data: data}
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
