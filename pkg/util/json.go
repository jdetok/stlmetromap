package util

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/jdetok/stlmetromap/pkg/get"
)

type PeristJSON interface {
	DataToJSONFile() error
	DataFromJSONFile() error
}

type AppData interface {
	Get(ctx context.Context, src string, isFile bool) error
}

type DataSource struct {
	URL   string
	Fname string
	Data  AppData
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

// Marhsal a generic struct to a JSON file. Assumes already checked that file exists.
func WriteStructToJSONFile[T any](data T, fname string) error {
	js, err := json.MarshalIndent(data, "", "    ")
	if err != nil {
		return fmt.Errorf("marshal error: %v", err)
	}

	if err := os.WriteFile(fname, js, 0644); err != nil {
		return fmt.Errorf("write file error: %v", err)
	}
	fmt.Println("saved data struct to", fname)
	return nil
}

// Fill a generic struct from a JSON file. The function assumes the file exists.
func FillStructFromJSONFile[T any](data *T, fname string) error {
	js, err := os.ReadFile(fname)
	if err != nil {
		return fmt.Errorf("failed to read file at %s: %v", fname, err)
	}
	fmt.Println("reading data from", fname)
	if err := json.Unmarshal(js, data); err != nil {
		return fmt.Errorf("failed to unmarshal data from %s: %v", fname, err)
	}
	return nil
}
