create extension if not exists postgis;
create extension if not exists hstore;

-- osm tables exist in public schema
create schema if not exists acs;
create schema if not exists tgr;

create index gix_tract_geom_4326 on tgr.tract using gist(st_transform(geom, 4326));
create index gix_county_geom_4326 on tgr.county using gist(st_transform(geom, 4326));
create index gix_stops_loc on public.stops using gist(stop_loc);
create index idx_county_statefp on tgr.county(statefp);

-- grouping/joining on county substring of tract geoid
create index idx_b01001_county_geoid on acs.b01001_moe(substring(geoid, 8, 5));
create index idx_county_statefp_countyfp on tgr.county(statefp, countyfp);

create index gix_tract_geom_4326 on tgr.tract using gist(st_transform(geom, 4326));
create index gix_county_geom_4326 on tgr.county using gist(st_transform(geom, 4326));
create index gix_stops_loc on public.stops using gist(stop_loc);
create index idx_county_statefp on tgr.county(statefp);
