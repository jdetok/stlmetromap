export const BASEMAP = 'dark-gray';
export const STLWKID = 4326;
export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};

export const TRACTS_LAYER_TTL = "Census Tract Population Density";
export const TRACTS_LAYER_URL = "/layers/tracts";

export const COUNTIES_LAYER_TTL = "St. Louis MSA Counties";
export const COUNTIES_LAYER_URL = "/layers/counties";

export const ML_LAYER_TTL = "MetroLink Stops";
export const ML_LAYER_URL = "/layers/metrolink";

export const BUS_LAYER_TTL = "MetroBus Stops";
export const BUS_LAYER_URL = "/layers/metrobus";

export const CYCLE_LAYER_TTL = "Bicycle/Walking Paths";
export const CYCLE_LAYER_URL = "/layers/cycle";

export const PLACE_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "type", alias: "Type", type: "string" },
    { name: "operator", alias: "Operator", type: "string" },
    { name: "bus_near", alias: "Bus Routes within 1/2Mi.", type: "string" },
    { name: "rail_near", alias: "Rail Routes within 1Mi.", type: "string" },
];

export const PLACE_FIELDINFOS = [
    { fieldName: "name", label: "Name" },
    { fieldName: "operator", label: "Operator" },
    { fieldName: "bus_near", label: "Bus Routes within 1/2Mi." },
    { fieldName: "rail_near", label: "Rail Routes within 1Mi." },
];

export const STOP_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "stop_id", alias: "Stop ID", type: "string" },
    { name: "stop_name", alias: "Name", type: "string" },
    { name: "wheelchair_access", alias: "Wheelchair Accessible", type: "string" },
    { name: "route_count", alias: "Route Count", type: "integer" },
    { name: "route_names", alias: "Route Names", type: "string" },
    { name: "route_ids", alias: "Route Nums", type: "string" },
    { name: "amenity_access", alias: "Amenity Access", type: "string" },
    { name: "grocery_access", alias: "Grocery Store Access", type: "string" },
    { name: "school_access", alias: "School/Kindergarten Access", type: "string" },
    { name: "college_access", alias: "College/University Access", type: "string" },
    { name: "park_access", alias: "Park Access", type: "string" },
    { name: "facility_access", alias: "Social Facility Access", type: "string" },
    { name: "medical_access", alias: "Medical Facility Access", type: "string" },
    { name: "church_access", alias: "Place of Worship Access", type: "string" },
    { name: "entertainment_access", alias: "Entertainment Access", type: "string" },
];

export const STOP_FIELDINFOS = [
    // { fieldName: "stop_name", label: "Name" },
    { fieldName: "route_names", label: "Route Names" },
    { fieldName: "wheelchair_access", label: "Wheelchair Accessible" },
    { fieldName: "amenity_access", label: "Amenity Access" },
    { fieldName: "grocery_access", label: "Grocery Store Access" },
    { fieldName: "school_access", label: "School/Kindergarten Access" },
    { fieldName: "college_access", label: "College/University Access" },
    { fieldName: "park_access", label: "Park Access" },
    { fieldName: "facility_access", label: "Social Facility Access" },
    { fieldName: "medical_access", label: "Medical Facility Access" },
    { fieldName: "church_access", label: "Place of Worship Access" },
    { fieldName: "entertainment_access", label: "Entertainment Access" },
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
    { fieldName: "county_name", label: "County" },
    { fieldName: "popl", label: "Population" },
    { fieldName: "popl_dens", label: "Persons/Sq.Mi." },
    { fieldName: "stops_in_tract", label: "Transit Stops in Tract" },
    { fieldName: "med_age", label: "Median Age" },
    { fieldName: "med_inc", label: "Median Income" },
    { fieldName: "popl_pov", label: "Population in Poverty" },
    { fieldName: "popl_pov_pct", label: "Percent in Poverty" },
];

export const COUNTIES_FIELDS = [
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

export const AMTRAK_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "operator", alias: "Operator", type: "string" },
];

export const AMTRAK_FIELDINFOS = [
    { fieldName: "name", label: "Name" },
    { fieldName: "operator", label: "Operator" },
];


export const SOCIAL_FIELDS = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "amenity", alias: "Amenity", type: "string" },
    { name: "operator", alias: "Operator", type: "string" },
    { name: "brand", alias: "Brand", type: "string" },
];