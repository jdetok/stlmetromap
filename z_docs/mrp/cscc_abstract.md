Justin DeKock
April 7, 2026

Abstract: Consortium for Computing Sciences in Colleges | Central Plains Region

My project utilizes open source technologies including Postgres, PostGIS, Docker, Nginx, and more to self host and serve spatial data to an interactive map created with the ESRI ArcGIS Maps SDK for JavaScript. The purpose of the project is to provide an interactive way for researchers, policy makers, and people generally interested to explore geospatial and demographic data as it pertains to the access to transit in the St. Louis Metropolitan Area. While some of the project's features may be useful for transit riders, the primary intent of the project is not to provide accurate and up to date information to riders about the St. Louis Metro Transit system. Riders should visit the Metro Transit website for updated information on frequencies, alerts, etc. 

Free and open source datasets provide the data for this project. All transit data is sourced from Metro Transit in the open standard GTFS (General Transit Feed Specification) format. Geographic boundary data is obtained from the US Census Bureau's 2024 TIGER (Topologically Integrated Geographic Encoding and Referencing) dataset. Demographic data is provided by the US Census Bureau's 2024 ACS (American Community Survey) dataset. All other miscellaneous spatial data is sourced from OSM (Open Street Map). 

The map is displayed via a comprehensive and responsive webpage, which I intend on expanding to include sections with additional route/demographic information, charts/graphs regarding coverage/ridership statistics, and more. The ArcGIS Maps SDK for JavaScript enables extensive customizations; every visual element of the map can be be adjusted/interacted with to expand the interactive experience and allow users to create more meaningful visualizations.

The project showcases strategies and techniques for building a full-stack web application with a Postgres database and Go REST API backend serving the frontend built with the ArcGIS Maps SDK for JavaScript. Skills in a diverse set of programming languages (TypeScript/JavaScript, Go, Bash Scripting, PL/pgSQL), system design/architecture, database/systems administration, and more are displayed throughout.

Publicly available early release: https://jdeko.me/mrp/
Github Repo: https://github.com/jdetok/stl-transit
