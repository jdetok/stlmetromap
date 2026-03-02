package etl

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// intent: provide standardized structs and interfaces with functionality for getting external data, transforming it
// to a defined type, and loading into postgres/postgis.
// attempting to replace individual workflows in gis package as of 3/2/2026

type DataMap map[string]map[string]string

type Getter interface {
	BuildUrl() string
	Get() error
}

// create datamap out of type that the json resp is marshaled into
type DataConverter interface {
	Conv() (DataMap, error)
}

type DataLoader interface {
	Load() error
}
type LoadCfg struct {
	Conn   *pgxpool.Pool
	Schema string
	Table  string
}
type GetCfg struct {
	Base  string
	Query string
}

func (g *GetCfg) BuildUrl() string {
	return g.Base + g.Query
}
func (g *GetCfg) Get() error {
	return nil
}

type DataObj struct {
	ctx    context.Context
	URL    string
	Schema string
	Table  string
	DataIn DataConverter
	Data   DataMap
}

func NewDataObj(ctx context.Context, url, schema, table string) *DataObj {
	return &DataObj{ctx: ctx, URL: url, Schema: schema, Table: table}
}

// get data, convert to map, exec
func (d *DataObj) Exec() error {
	return nil
}
