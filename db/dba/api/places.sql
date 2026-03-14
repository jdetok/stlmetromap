create schema if not exists api;
drop table api.places;
create table if not exists api.places (
	id bigserial primary key,
	osm_id int8,
	type text not null,
	name text,
	operator text,
	bus_near text,
	rail_near text,
	geom text,
	way geometry(polygon, 4326)
);

with mbus as (
	select 805 as meters, 'm' as unit, '1/2mi' as str
), mrail as (
	select 1610 as meters, 'm' as unit, '1mi' as str
), gstores as (
    select 
    	osm_id::int8 as osm_id, 'grocery' as type, 
    	coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
    	coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way 
    from public.planet_osm_polygon
    where shop in ('greengrocer', 'grocery', 'supermarket', 'deli', 'farm', 'butcher', 'seafood', 'bakery', 'convenience')
), parks as (
	select 
    	osm_id::int8 as osm_id, 'park' as type, 
    	coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
    	coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
    from public.planet_osm_polygon
    where leisure in ('park')
), school as (
	select 
		osm_id::int8 as osm_id, 'school' as type,
		coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
    	coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
	from public.planet_osm_polygon
	where amenity in ('school', 'kindergarten')
), medical as (
	select 
		osm_id::int8 as osm_id, 'medical' as type,
		coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
		coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
	from public.planet_osm_polygon
	where amenity in ('hospital', 'clinic', 'doctors')
), church as (
	select 
		osm_id::int8 as osm_id, 'church' as type,
		coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
		coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
	from public.planet_osm_polygon
	where amenity in ('place_of_worship')
), uni as (
	select 
	
		osm_id::int8 as osm_id, 'university' as type,
		coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
    	coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
	from public.planet_osm_polygon
	where amenity in ('college', 'university')
), social as (
	select 
		osm_id::int8 as osm_id, 'social_facility' as type,
		coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
    	coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
	from public.planet_osm_polygon
	where amenity in ('social_facility', 'social_facility', 'social_center', 'social_centre')
), fun as (
	select 
		osm_id::int8 as osm_id, 'entertainment' as type,
		coalesce(coalesce(coalesce(name, operator), brand), 'NA') as name,
    	coalesce(coalesce(operator, brand), 'NA') as operator, ST_Transform(way, 4326) as way
	from public.planet_osm_polygon
	where amenity in ('theatre', 'stadium', 'stage', 
	 	'ampitheatre', 'stripclub', 'banquet_hall', 'batting_cage',
	 	'bicycle_rental', 'biergarten', 'casino', 'cinema', 'clubhouse',
	 	'driving_range', 'dojo', 'events_venue', 'hookah_lounge', 'nightclub',
	 	'planetarium', 'pub', 'bar', 'arts_centre'
	)
), bus_stops as (
    select a.stop_id, c.stop_name, c.wheelchair_boarding as wheelchair,
    array_agg(distinct(d.route_short_name || '-' || d.route_long_name)) as route_names,
--        string_agg(distinct(d.route_short_name || '-' || d.route_long_name), ', ') as route_names,
        c.stop_loc
    from public.stop_times a
    inner join public.trips b on b.trip_id = a.trip_id
    inner join public.stops c on c.stop_id = a.stop_id
    inner join public.routes d on d.route_id = b.route_id
    where d.route_type = '3'
    group by a.stop_id, c.stop_name, c.stop_loc, c.wheelchair_boarding
), rail_stops as (
    select a.stop_id, c.stop_name, c.wheelchair_boarding as wheelchair,
    	array_agg(distinct(d.route_long_name)) as route_names,
--        string_agg(distinct d.route_long_name, ', ') as route_names,
        c.stop_loc
    from public.stop_times a
    inner join public.trips b on b.trip_id = a.trip_id
    inner join public.stops c on c.stop_id = a.stop_id
    inner join public.routes d on d.route_id = b.route_id
    where d.route_type = '2'
    group by a.stop_id, c.stop_name, c.stop_loc, c.wheelchair_boarding
), polygons as (
	select a.osm_id, a.type, a.name, a.operator, 
		coalesce(nullif(string_agg(distinct b.route_names, ', '), ''), 
			('No bus stops within ' || (select meters || unit || '(~' || str || ')' from mbus))) as bus_near,
		coalesce(nullif(string_agg(distinct c.route_names, ', '), ''), 
			('No rail stops within ' || (select meters || unit || '(~' || str || ')' from mrail))) as rail_near,
		way
	from (
 		select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from gstores union all
	    select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from school union all
	    select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from uni union all
	    select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from social union all
	    select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from parks union all
	    select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from medical union all
		select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from church union all
	    select osm_id, type, name, operator, ST_Centroid(way) as centroid, way from fun
	) a
	left join lateral (
	    select unnest(b.route_names) as route_names
	    from bus_stops b
	    where st_dwithin(b.stop_loc::geography, a.centroid::geography, (select meters from mbus))
	    order by st_distance(b.stop_loc::geography, a.centroid::geography)
	    limit 20
	) b on true
	left join lateral (
	    select unnest(r.route_names) as route_names
	    from rail_stops r
	    where st_dwithin(r.stop_loc::geography, a.centroid::geography, (select meters from mrail))
	    order by st_distance(r.stop_loc::geography, a.centroid::geography)
	    limit 20
	) c on true
	where a.way && ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326)	
	group by a.osm_id, a.type, a.name, a.operator, a.way
)
insert into api.places (osm_id, type, name, operator, bus_near, rail_near, way, geom)
select osm_id, type, name, operator, bus_near, rail_near, way, ST_AsGeoJSON(way) as geom from polygons;
select * from api.places;
truncate table api.places restart identity;

select osm_id, type, name, operator, bus_near, rail_near, geom from api.places;
select * from api.places;
