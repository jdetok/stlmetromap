package util

import (
	"os"
)

func FileExists(fname string) bool {
	f, err := os.Stat(fname)
	if err != nil {
		return false
	}
	if !f.IsDir() || f.Size() > 0 {
		return true
	}
	return false
}