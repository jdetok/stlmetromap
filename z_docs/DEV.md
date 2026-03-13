# Developmenet documentation

## Adding Feature Layers to the map
This section provides a general walk through for adding a new feature layer to the map. This assumes the feature layer's data exists in the database already; see the [adding a data source section](#add-a-data-source) if the feature layer requires sourcing data from a new source
1. Write SQL query
    - Should include a geometry column in GeoJSON format
        - convert postgis geometry/geography field with `ST_AsGeoJSON`
1. Create an additional pointer to a `FeatureColl` struct and add it to the `DataLayers` type in `pkg/gis/layers.go`
1. Add HTTP handler to serve new layer as REST endpoint in `pkg/srv/srv.go`
1. Create a new `FeatureLayerMeta` object in `www/src/layers.ts`
    - if no matching Fields/FieldInfos exist in `www/src/data.ts`, add them
1. Add the layer to the `layers` array in `www/src/cmp/map-window.ts`

## Add a Data Source
This section describes the process for sourcing and importing a new data source into the database
1. Any data used in the project must be able to be easily imported into postgres. External tools exist for OSM, ACS, TIGER, and GTFS data
1. Once an external tool is found, write a new script in `/scr` to be run in the postgres container to use the tool