package util

import (
	"encoding/json"
	"fmt"
	"os"
)

type PeristJSON interface {
	DataToJSONFile() error
	DataFromJSONFile() error
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
