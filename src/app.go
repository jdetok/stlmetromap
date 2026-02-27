package main

import (
	"github.com/jdetok/stlmetromap/pkg/gis"
	"go.uber.org/zap"
)

type app struct {
	lg     *zap.SugaredLogger
	addr   string
	layers *gis.DataLayers
}
