package gis

import (
	"fmt"
	"math"

	"github.com/dhconnelly/rtreego"
)

// build R-tree of the tracts to query points in space
type Coordinates struct {
	La float64 `json:"latitude"`
	Lo float64 `json:"longitude"`
}

type TractNode struct {
	GEOID string
	Rings [][][]float64
	Rect  rtreego.Rect
}

func (t *TractNode) Bounds() rtreego.Rect {
	return t.Rect
}

// wrapper for an Rtree: convert a compatible struct to TractNode to make a slice of polygon features indexable
type Idx struct {
	tree *rtreego.Rtree
}

func NewIdx(tracts []TractNode) (*Idx, error) {
	tree := rtreego.NewTree(2, 25, 50)
	for i := range tracts {
		t := &tracts[i]
		tree.Insert(t)
	}
	return &Idx{tree: tree}, nil
}

func (idx *Idx) PointInTract(lon, lat float64) (string, bool) {
	const eps = 1e-9
	p := rtreego.Point{lon, lat}
	rect, err := rtreego.NewRect(p, []float64{eps, eps})
	if err != nil {
		fmt.Println(err)
		return "", false
	}
	candidates := idx.tree.SearchIntersect(rect)
	if len(candidates) == 0 {
		return "", false
	}
	pt := Coordinates{Lo: lon, La: lat}

	for _, item := range candidates {
		t := item.(*TractNode)
		if ringsContainPoint(t.Rings, pt) {
			return t.GEOID, true
		}
	}
	return "", false
}

func ringsContainPoint(rings [][][]float64, p Coordinates) bool {
	outers := make([][][]float64, 0, len(rings))
	holes := make([][][]float64, 0, len(rings))
	for _, ring := range rings {
		if len(ring) < 3 {
			continue
		}
		if isClockwise(ring) {
			outers = append(outers, ring)
		} else {
			holes = append(holes, ring)
		}
	}

	insideOuter := false
	for _, r := range outers {
		if pointInRing(p, r) {
			insideOuter = true
			break
		}
	}
	if !insideOuter {
		return false
	}
	for _, h := range holes {
		if pointInRing(p, h) {
			return false
		}
	}

	return true
}

func ComputeRectFromRings(rings [][][]float64) (rtreego.Rect, error) {
	minX := math.Inf(1)
	minY := math.Inf(1)
	maxX := math.Inf(-1)
	maxY := math.Inf(-1)
	found := false
	for _, ring := range rings {
		for _, xy := range ring {
			if len(xy) < 2 {
				continue
			}
			x := xy[0]
			y := xy[1]
			found = true
			if x < minX {
				minX = x
			}
			if y < minY {
				minY = y
			}
			if x > maxX {
				maxX = x
			}
			if y > maxY {
				maxY = y
			}
		}
	}
	if !found {
		return rtreego.Rect{}, fmt.Errorf("no points in rings")
	}
	p := rtreego.Point{minX, minY}
	lens := []float64{maxX - minX, maxY - minY}
	const pad = 1e-12
	if lens[0] <= 0 {
		lens[0] = pad
	}
	if lens[1] <= 0 {
		lens[1] = pad
	}
	return rtreego.NewRect(p, lens)
}

func pointInRing(p Coordinates, ring [][]float64) bool {
	n := len(ring)
	if n < 3 {
		return false
	}
	inside := false
	j := n - 1

	for i := range n {
		xi := ring[i][0]
		yi := ring[i][1]
		xj := ring[j][0]
		yj := ring[j][1]
		intersects := ((yi > p.La) != (yj > p.La)) && (p.Lo < (xj-xi)*(p.La-yi)/(yj-yi)+xi)
		if intersects {
			inside = !inside
		}
		j = i
	}

	return inside
}

func isClockwise(ring [][]float64) bool {
	sum := 0.0
	n := len(ring)
	if n < 3 {
		return true
	}
	for i := range n {
		j := (i + 1) % n
		xi := ring[i][0]
		yi := ring[i][1]
		xj := ring[j][0]
		yj := ring[j][1]
		sum += (xj - xi) * (yj + yi)
	}
	return sum > 0
}
