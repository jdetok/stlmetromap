package main

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jdetok/stlmetromap/pkg/gis"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type app struct {
	lg     *zap.SugaredLogger
	db     *pgxpool.Pool
	addr   string
	layers gis.FeatureLayers
}

func buildLogger() (*zap.SugaredLogger, error) {
	zapCfg := zap.NewProductionConfig()
	zapCfg.Encoding = "console"
	zapCfg.EncoderConfig.TimeKey = "ts"
	zapCfg.EncoderConfig.LevelKey = "lvl"
	zapCfg.EncoderConfig.CallerKey = "caller"
	zapCfg.EncoderConfig.MessageKey = "msg"
	zapCfg.EncoderConfig.LineEnding = zapcore.DefaultLineEnding
	zapCfg.EncoderConfig.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		enc.AppendString(t.Format("010206_150405"))
	}

	zapLog, err := zapCfg.Build()
	if err != nil {
		return nil, err
	}
	return zapLog.Sugar(), nil
}
