# Track progress
- Started Feb 24 2026

## Initial prototyping
- work done pre the creation of this document is considered prototyping
    - created basic working and expandable system to start real developing

## 2/27/2026
- created docker environment with nginx server
- can run air locally for go dev, or run the compose file
    - access at :9999 if running go app directly, :3333 from docker

## 3/8/2026
- implemented postgis database for all data layers, allowing standardized feature layers format
- added several layers to map, including grocery, schools, amtrak stops, etc
- eliminated all backend etl code, scripts using external tools to import data into postgres replace the need