package pgis

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// index fields will have an index created as [name]indexcol
type TableConf struct {
	Table      string
	Schema     string
	Headers    []string
	GeoIndexes map[string]string
	Indexes    map[string]string
	GeomType   string
}

// create table if not exists
func CreateTableNotExists(ctx context.Context, db *pgxpool.Pool, cnf *TableConf, lg *zap.SugaredLogger) error {
	if cnf.Schema == "" || cnf.Table == "" {
		return fmt.Errorf("schema and table must both be passed")
	}

	if len(cnf.Headers) == 0 {
		return fmt.Errorf("schema and table must both be passed")
	}

	createTbl := cnf.CreateTableStatement()
	fmt.Println(createTbl)
	indexes := cnf.CreateIndexStatements()

	tx, err := db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() error {
		if err != nil {
			lg.Errorf("an error occured: %v\nattempting to rollback...", err)
			rbErr := tx.Rollback(ctx)
			if rbErr != nil {
				return fmt.Errorf("rollback failed: %v\noriginal error: %v", rbErr, err)
			}
			return fmt.Errorf("rollback success after error: %v", err)
		}
		return nil
	}()

	_, err = db.Exec(ctx, createTbl)
	if err != nil {
		return err
	}

	for _, idx := range indexes {
		fmt.Println(idx)
		_, err = db.Exec(ctx, idx)
		if err != nil {
			return err
		}
	}
	lg.Infof("created table with %d indexes", len(indexes))
	return nil
}

func (c *TableConf) CreateTableStatement() string {
	geom := ""
	if c.GeomType != "" {
		geom = fmt.Sprintf(",\n\tgeom geometry(%s, 4326)", c.GeomType)
	}
	return fmt.Sprintf(
		"create table if not exists %s.%s (\n\tid bigserial primary key,\n\t%s text%s\n)",
		c.Schema, c.Table, strings.Join(c.Headers, " text,\n\t"), geom)
}

// returns array of create index strings
func (c *TableConf) CreateIndexStatements() []string {
	idxStatements := make([]string, len(c.Indexes)+len(c.GeoIndexes))
	for _, col := range c.Indexes {
		idxStatements = append(idxStatements, c.buildIndex(col, false))
	}
	for _, col := range c.GeoIndexes {
		idxStatements = append(idxStatements, c.buildIndex(col, true))
	}
	return idxStatements
}

// if index on multiple columns, pass cols with commas c1,c2,c3
func (c *TableConf) buildIndex(col string, isGeo bool) string {
	geom := ""
	idxPrefix := "idx"
	if isGeo {
		geom = "using gist"
		idxPrefix = "gix"
	}
	return fmt.Sprintf("create index if not exists %s_%s_%s on %s.%s %s (%s)",
		idxPrefix, c.Table, col, c.Schema, c.Table, geom, col)
}
