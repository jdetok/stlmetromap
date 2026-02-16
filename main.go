package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jamespfennell/gtfs"
	"github.com/jdetok/stlmetromap/pkg/metro"
	"github.com/jdetok/stlmetromap/pkg/srv"
	"github.com/joho/godotenv"
	"golang.org/x/sync/errgroup"
)

func main() {

	if err := godotenv.Load(); err != nil {
		fmt.Println("no .env file")
	}

	staticData := &gtfs.Static{}
	st, err := metro.GetStatic()
	if err != nil {
		fmt.Println("couldn't fetch static data:", err)
	}
	staticData = st

	g, ctx := errgroup.WithContext(context.Background())

	g.Go(func() error {
		return srv.SetupServer(ctx, staticData)
	})
	
	if err := g.Wait(); err != nil {
		log.Fatal(err)
	}

}