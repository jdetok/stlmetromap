# Define global scope variables

## Overal objective
- The project aims to create an interactive map to visualize transit coverage/access in the St. Louis Metropolitan Area. Users can explore relationships between transit access and various dependent variables including but not limited to population density, socioeconomic factors, access to food, and access to education. 

## Geographic scope
Coordinates used for data queries throughout the project
| scope        | xmin    | ymin   | xmax    | ymax  | overpass-turbo |
|--------------|---------|--------|---------|-------|----------------|
| Outer scope  | -91     | 38     | -89.5   | 39.2  | (38,-91,39.2,-89.5)
| Inner scope  | -90.32  | 38.53  | -90.15  | 38.75 | (38.53,-90.32,38.75,-90.15)

- ### Outer scope: All St. Louis metropolitan area counties 
    - ("name": "FIPS ID") 
    - MO
        - "St. Louis County": "189",
        - "St. Louis city": "510",
        - "St. Charles County": "183",
        - "Jefferson County": "099",
        - "Franklin County": "071",
        - "Warren County": "219",
        
    - IL
        - "St. Clair County": "163",
        - "Madison County": "119",
        - "Monroe County": "133",
        - "Jersey County": "083",
        - "Calhoun County": "013",
        - "Macoupin County": "117",
        - "Clinton County": "027",
        - "Bond County": "005",
- ### Inner scope: counties served by Metro
    - MO
        - "St. Louis County": "189",
        - "St. Louis city": "510",
    - IL
        - "St. Clair County": "163",
        - "Madison County": "119",

## Data scope
- ### Transit data
    - GTFS from Metro
    - look into getting madison county transit data
- ### Borders/areas
    - counties
    - census tracts
- ### Dependent variables
    - population density
        - area from tiger api, population from cencus api
    - socioecnomic 
        - median income within 1 mi ?
        - employment within tract ? 
    - development
        - businesses within tract ?
    - access to food
        - grocery stores within tract ?
        - figure out within 1 mi
    - access to education
        - ? tiger maybe
