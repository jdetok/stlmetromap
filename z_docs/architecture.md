# High level architecture

## Required backend components:
- fetch and store spatial transit data from STL Metro
- fetch and store geographic & demographic data from various APIs or files
- use an r-tree for indexing the spatial data
    - must be able to query geographic points within a given spatial area
- build and store master structs with all necessary gis data for the frontend to build map layers
- expose these as api endpoints via http server

