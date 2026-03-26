import { newHighlightSetting } from "./arcgis";
import { calciteActionProps } from "./calcite";

export const BASEMAP = 'dark-gray';
export const PROJID = 4326;
export const STLCOORDS = {
    xmin: -90.32,
    ymin: 38.53,
    xmax: -90.15,
    ymax: 38.75,
    spatialReference: {wkid: PROJID},
} as __esri.Extent;

export const TRACTS_LAYER_TTL = "US Census Tracts";
export const TRACTS_LAYER_URL = "/layers/tracts";

export const COUNTIES_LAYER_TTL = "US Counties";
export const COUNTIES_LAYER_URL = "/layers/counties";

export const ML_LAYER_TTL = "MetroLink Stops";
export const ML_LAYER_URL = "/layers/metrolink";

export const BUS_LAYER_TTL = "MetroBus Stops";
export const BUS_LAYER_URL = "/layers/metrobus";

export const CYCLE_LAYER_TTL = "Bicycle/Walking Paths";
export const CYCLE_LAYER_URL = "/layers/cycle";

// CUSTOM HIGHLIGHT SETTINGS
const HL_PARKS = newHighlightSetting("parks", "mediumseagreen");
const HL_SCHOOLS = newHighlightSetting("schools", "khaki");
const HL_CHURCH = newHighlightSetting("church", "violet");
const HL_MED = newHighlightSetting("med", "mediumvioletred");
const HL_GROCERY = newHighlightSetting("grocery", "white");
export const HIGHLIGHTS: __esri.CollectionProperties<__esri.HighlightOptionsProperties> = [
    newHighlightSetting("default", "cyan"),
    HL_PARKS,
    HL_SCHOOLS,
    HL_CHURCH, 
    HL_MED,
    HL_GROCERY,
];

// CALCITE OBJECTS
// ACTION CONFIGS FOR THE TOGGLE BAR. EACH RENDERS INTO A BUTTON WITH A BUTTON TO HIGHLIGHT FEATURES
// RETURNED FROM THE WHERE STRING
export const TOGGLE_ACTIONS: calciteActionProps[] = [
    {
        id: "parks", icon: "tree", text: "Highlight Parks",
        where: `type = 'park'`, highlightName: HL_PARKS.name!,
    }, {
        id: "medical", icon: "medical", text: "Highlight Hospitals",
        where: `type = 'medical'`, highlightName: HL_MED.name!,
    }, {
        id: "university", icon: "mooc", text: "Highlight Universities",
        where: `type = 'university'`, highlightName: HL_SCHOOLS.name!,
    }, {
        id: "school", icon: "education", text: "Highlight Schools",
        where: `type = 'school'`, highlightName: HL_SCHOOLS.name!,
    }, {
        id: "grocery", icon: "shopping-cart", text: "Highlight Grocery Stores",
        where: `type = 'grocery'`, highlightName: HL_GROCERY.name!,
    }, {
        id: "church", icon: "organization", text: "Highlight Places of Worship",
        where: `type = 'church'`, highlightName: HL_CHURCH.name!,
    }, {
        id: "social_facility", icon: "home", text: "Highlight Community Centers",
        where: `type = 'social_facility'`, highlightName: HL_MED.name!,
    },
];

// TOGGLE BUTTONS FOR CLEARING HIGHLIGHTED PLACES/BUS STOPS
export const CLEAR_PLACES = { id: "reset", icon: "reset", text: "Clear Highlighted Places" };
export const CLEAR_BUSES = { id: "bus_reset", icon: "bus", text: "Clear Highlighted Transit Stops" };

// ACTION BAR WITH PANELS/UTILITIES
export const MAIN_ACTIONS: calciteActionProps[] = [
    { id: "legend", icon: "legend", text: "Legend" },
    { id: "sliders", icon: "sliders", text: "Appearance Sliders" },
    { id: "layers", icon: "layers", text: "Toggle Layers" },
    { id: "basemaps", icon: "basemap", text: "Basemaps" },
    { id: "print", icon: "print", text: "Export" },
];
// REQUEST FULL SCREEN
export const FULLSCREEN = { id: "fs", icon: "extent", text: "Fullscreen" };

export const fieldInfos = (fields: __esri.FieldProperties[], exclude: string[]): __esri.FieldInfo[] => {
    return [...fields].filter((f) => !exclude.includes(f.name!)).map(({ name, alias }) => ({
        fieldName: name,
        label: alias,
    })) as __esri.FieldInfo[];
}

export const PLACE_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "type", alias: "Type", type: "string" },
    { name: "operator", alias: "Operator", type: "string" },
    { name: "bus_near", alias: "Bus Routes within 1/2Mi.", type: "string" },
    { name: "rail_near", alias: "Rail Routes within 1Mi.", type: "string" },
];
export const PLACE_FIELDINFOS = fieldInfos(PLACE_FIELDS, ['ObjectID', 'type']);

export const LINES_FIELDS: __esri.FieldProperties[] = [
    {name: "ObjectID", alias: "ObjectID", type: "oid"},
    {name: "route_desc", alias: "route_desc", type: "string"},
    {name: "route_type", alias: "route_type", type: "string"},
    {name: "stops_total", alias: "Total Stops", type: "integer"},
    {name: "freq_wk", alias: "Weekday Frequency (minutes)", type: "integer"},
    {name: "freq_sa", alias: "Saturday Frequency (minutes)", type: "integer"},
    {name: "freq_su", alias: "Sunday Frequency (minutes)", type: "integer"},
];

export const LINES_FIELDINFOS = fieldInfos(
    LINES_FIELDS, ['ObjectID', 'route_desc', 'route_type']
)

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

export const STOP_FIELDINFOS = fieldInfos(
    STOP_FIELDS, ['ObjectID', 'stop_id', 'stop_name', 'route_ids', 'route_count']
)

export const TRACTS_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "geoid", alias: "geoid", type: "string" },
    { name: "tract", alias: "Tract", type: "string" },
    { name: "tract_name", alias: "Tract Name", type: "string" },
    { name: "countyfp", alias: "County FP", type: "string" },
    { name: "county_name", alias: "County", type: "string" },
    { name: "popl", alias: "Population", type: "integer" },
    { name: "popl_dens", alias: "Persons/Sq.Mi", type: "double" },
    { name: "med_age", alias: "Median Age", type: "double" },
    { name: "med_inc", alias: "Median Income", type: "double" },
    { name: "med_rent", alias: "Median Rent", type: "double" },
    { name: "popl_pov", alias: "Population in Poverty", type: "integer" },
    { name: "pov_dens", alias: "Persons/Sq.Mi in Poverty", type: "double" },
    { name: "popl_pov_pct", alias: "% Population in Poverty", type: "string" },
    { name: "stops_in_tract", alias: "Transit Stops in Tract", type: "string" },
];

export const TRACTS_FIELDINFOS = fieldInfos(
    TRACTS_FIELDS, ['ObjectID', 'geoid', 'tract', 'tract_name', 'countyfp']);

export const COUNTIES_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
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
export const COUNTIES_FIELDINFOS = fieldInfos(COUNTIES_FIELDS, ['ObjectID', 'countyfp']);

export const CYCLING_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "highway", alias: "Highway", type: "string" },
    { name: "surface", alias: "Surface", type: "string" },
];
export const CYCLING_FIELDINFOS = fieldInfos(CYCLING_FIELDS, ['ObjectID', 'name', 'highway']);

export const AMTRAK_FIELDS: __esri.FieldProperties[] = [
    { name: "ObjectID", alias: "ObjectID", type: "oid" },
    { name: "name", alias: "Name", type: "string" },
    { name: "operator", alias: "Operator", type: "string" },
];
export const AMTRAK_FIELDINFOS = fieldInfos(AMTRAK_FIELDS, ['ObjectID']);