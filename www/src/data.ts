export const BASEMAP = 'dark-gray';
export const STLWKID = 4326;
export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};

export const TRACTS_LAYER_TTL = "Census Tract Population Density";
export const TRACTS_LAYER_URL = "/tracts";

export const COUNTIES_LAYER_TTL = "St. Louis MSA Counties";
export const COUNTIES_LAYER_URL = "/counties";

export const ML_LAYER_TTL = "MetroLink Stops";
export const ML_LAYER_URL = "/rail";

export const BUS_LAYER_TTL = "MetroBus Stops";
export const BUS_LAYER_URL = "/bus";

export const CYCLE_LAYER_TTL = "Bicycle/Walking Paths";
export const CYCLE_LAYER_URL = "/bikes";

export const STOP_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "stop_id", alias: "ID", type: "string" },
    { name: "stop_name", alias: "Name", type: "string" },
    { name: "wheelchair", alias: "Wheelchair Accessible", type: "string" },
    { name: "route_names", alias: "Route Names", type: "string" },
    { name: "route_ids", alias: "Route Nums", type: "string" },
];

export const STOP_FIELDINFOS = [
    { fieldName: "ObjectID", label: "ObjectID" },
    { fieldName: "stop_id", label: "ID" },
    { fieldName: "stop_name", label: "Name" },
    { fieldName: "wheelchair", label: "Wheelchair Accessible" },
    { fieldName: "route_names", label: "Route Names" },
    { fieldName: "route_ids", label: "Route Nums" },
];

export const TRACTS_FIELDS = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "geoid", alias: "geoid", type: "string" },
    { name: "tract", alias: "Tract", type: "string" },
    { name: "tract_name", alias: "Tract Name", type: "string" },
    { name: "countyfp", alias: "County FP", type: "string" },
    { name: "county_name", alias: "County", type: "string" },
    { name: "popl", alias: "Population", type: "integer" },
    { name: "popl_dens", alias: "Population Density", type: "double" },
    { name: "med_age", alias: "Median Age", type: "double" },
    { name: "med_inc", alias: "Median Income", type: "double" },
    { name: "popl_pov", alias: "Population in Poverty", type: "integer" },
    { name: "popl_pov_pct", alias: "Percent in Poverty", type: "string" },
    { name: "stops_in_tract", alias: "Transit Stops in Tract", type: "string" },
];

export const TRACTS_FIELDINFOS = [
    { fieldName: "ObjectID", label: "ObjectID" },
    { fieldName: "geoid", label: "geoid" },
    { fieldName: "tract", label: "Tract" },
    { fieldName: "tract_name", label: "Tract Name" },
    { fieldName: "countyfp", label: "County FP" },
    { fieldName: "county_name", label: "County" },
    { fieldName: "popl", label: "Population" },
    { fieldName: "popl_dens", label: "Population Density" },
    { fieldName: "med_age", label: "Median Age" },
    { fieldName: "med_inc", label: "Median Income" },
    { fieldName: "popl_pov", label: "Population in Poverty" },
    { fieldName: "popl_pov_pct", label: "Percent in Poverty" },
    { fieldName: "stops_in_tract", label: "Transit Stops in Tract" },
];

export const COUNTIES_FIELDS = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "geoid", alias: "geoid", type: "string" },
    { name: "countyfp", alias: "County FP", type: "string" },
    { name: "county_name", alias: "County", type: "string" },
    { name: "popl", alias: "Population", type: "integer" },
    { name: "popl_dens", alias: "Population Density", type: "double" },
    { name: "med_age", alias: "Median Age", type: "double" },
    { name: "med_inc", alias: "Median Income", type: "double" },
    { name: "popl_pov", alias: "Population in Poverty", type: "integer" },
    { name: "popl_pov_pct", alias: "Percent in Poverty", type: "string" },
    { name: "stops_in_county", alias: "Transit Stops in County", type: "string" },
];

export const COUNTIES_FIELDINFOS = [
    { fieldName: "ObjectID", label: "ObjectID" },
    { fieldName: "geoid", label: "geoid" },
    { fieldName: "countyfp", label: "County FP" },
    { fieldName: "county_names", label: "County" },
    { fieldName: "popl", label: "Population" },
    { fieldName: "popl_dens", label: "Population Density" },
    { fieldName: "med_age", label: "Median Age" },
    { fieldName: "med_inc", label: "Median Income" },
    { fieldName: "popl_pov", label: "Population in Poverty" },
    { fieldName: "popl_pov_pct", label: "Percent in Poverty" },
    { fieldName: "stops_in_county", label: "Transit Stops in County" },
];

export const CYCLING_FIELDS = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "highway", alias: "Highway", type: "string" },
    { name: "surface", alias: "Surface", type: "string" },
];