import { RouteType, cplethEls } from './types.js'

export const BASEMAP = 'dark-gray';
export const STLWKID = 4326;
export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
};

// TRACTCS LAYER

export const TRACTS_LAYER_TTL = "Census Tract Population Density";
export const TRACTS_LAYER_URL = "/tracts";

export const COUNTIES_LAYER_TTL = "St. Louis MSA Counties";
export const COUNTIES_LAYER_URL = "/counties";


export const ML_LAYER_TTL = "MetroLink Stops";
export const ML_LAYER_URL = "/stops/ml";

export const BUS_LAYER_TTL = "MetrBus Stops";
export const BUS_LAYER_URL = "/stops/bus";

export const CYCLE_LAYER_TTL = "Bicycle/Walking Paths";
export const CYCLE_LAYER_URL = "/bikes";

export const BUS = 'Bus';
export const ML = 'Light Rail';
export const routeTypes: Record<RouteType, string> = {
    bus: BUS,
    mlr: ML,
    mlb: ML,
    mlc: ML
};
export const STOP_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "id", alias: "ID", type: "string" },
    { name: "name", alias: "Name", type: "string" },
    { name: "typ", alias: "Service Type", type: "string" },
    { name: "type", alias: "Stop Type", type: "string" },
    { name: "routes", alias: "Routes Served", type: "string" },
    { name: "tractGeoid", alias: "Tract GEOID", type: "string" },
    { name: "whlChr", alias: "Wheelchair Accessible", type: "string" },
];

export const TRACTS_FIELDS = [
    { name: "GEOID", alias: "GEOID", type: "string" },
    { name: "TRACT", alias: "Tract", type: "string" },
    { name: "POPL", alias: "Population", type: "double" },
    { name: "POPLSQMI", alias: "Persons/Square Mile", type: "double" },
    { name: "INCOME", alias: "Median Income", type: "double" },
    { name: "AGE", alias: "Median Age", type: "double" },
    { name: "HAS_COMP", alias: "Persons with access to a computer:", type: "double" },
    { name: "PCT_HAS_COMP", alias: "% with access to a computer:", type: "double" },
    { name: "MGRENT", alias: "Median Gross Rent", type: "double" },
    { name: "INC_BELOW_POV", alias: "Persons Below Poverty", type: "double" },
    { name: "PCT_INC_BELOW_POV", alias: "% Persons Below Poverty", type: "string" },
    { name: "STOPS_IN_TRACT", alias: "Transit Stops in Area", type: "double" },
    { name: "BUS_STOPS_IN_TRACT", alias: "Bus Stops in Area", type: "double" },
    { name: "ML_STOPS_IN_TRACT", alias: "Light Rail Stops in Area", type: "double" },
];
export const TRACTS_FIELDINFOS = [
    { fieldName: "POPL", label: "Population:" },
    { fieldName: "POPLSQMI", label: "Persons/Square Mile:" },
    { fieldName: "AGE", label: "Median Age:" },
    { fieldName: "INCOME", label: "Median Income Last 12 Months:" },
    { fieldName: "MGRENT", label: "Median Gross Rent:" },
    { fieldName: "INC_BELOW_POV", label: "Persons Below Poverty Level:" },
    { fieldName: "PCT_INC_BELOW_POV", label: "% Persons Below Poverty:" },
    { fieldName: "HAS_COMP", label: "Persons with access to a computer:" },
    { fieldName: "PCT_HAS_COMP", label: "% with access to a computer:" },
    { fieldName: "STOPS_IN_TRACT", label: "Transit Stops in Area" },
    { fieldName: "BUS_STOPS_IN_TRACT", label: "Bus Stops in Tract" },
    { fieldName: "ML_STOPS_IN_TRACT", label: "Light Rail Stops in Tract" },
];

export const COUNTIES_FIELDS = [
    { name: "NAME", alias: "Name", type: "string" },
    { name: "COUNTY", alias: "County", type: "string" },
    { name: "STOPS_IN_TRACT", alias: "Transit Stops in Area", type: "double" },
    { name: "BUS_STOPS_IN_TRACT", alias: "Bus Stops in Area", type: "double" },
    { name: "ML_STOPS_IN_TRACT", alias: "Light Rail Stops in Area", type: "double" },
];
export const COUNTIES_FIELDINFOS = [
    { fieldName: "COUNTY", label: "County:" },
    { fieldName: "STOPS_IN_TRACT", label: "Transit Stops in County" },
    { fieldName: "BUS_STOPS_IN_TRACT", label: "Bus Stops in County" },
    { fieldName: "ML_STOPS_IN_TRACT", label: "Light Rail Stops in County" },
];

export const CYCLING_FIELDS = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "highway", alias: "Highway", type: "string" },
    { name: "surface", alias: "Surface", type: "string" },
];