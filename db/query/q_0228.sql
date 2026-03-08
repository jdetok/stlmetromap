-- QUERIES TO OSM DATABASE

-- all grocery stores
select * from public.planet_osm_polygon
where shop in ('greengrocer', 'grocery', 'supermarket', 'deli', 'farm', 'butcher', 'seafood', 'bakery', 'convenience')
AND way && ST_Transform(
    ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326),
    3857
);

-- schools
select * from public.planet_osm_polygon
where amenity in ('school', 'college', 'university', 'kindergarten')
and way && ST_Transform(
    ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326),
    3857
);
-- social facilities
select * from public.planet_osm_polygon
where amenity in ('social_facility', 'social_facility', 'social_center', 'social_centre')
and way && ST_Transform(
    ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326),
    3857
);
 
 -- entertainment etc
select * from public.planet_osm_polygon
where amenity in ('theatre', 'stadium', 'stage', 
 	'ampitheatre', 'stripclub', 'banquet_hall', 'batting_cage',
 	'bicycle_rental', 'biergarten', 'casino', 'cinema', 'clubhouse',
 	'driving_range', 'dojo', 'events_venue', 'hookah_lounge', 'nightclub',
 	'planetarium', 'pub', 'bar', 'arts_centre')
and way && ST_Transform(
    ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326),
    3857
);

-- bus stops
select * from public.planet_osm_point
where public_transport is not null
and railway is null
and operator is not null
and way && ST_Transform(
    ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326),
    3857
);
 
-- rail stops
select * from public.planet_osm_point
where public_transport is not null
and railway is not null
and operator is not null
and way && ST_Transform(
    ST_MakeEnvelope(-91, 38, -89.5, 39.2, 4326),
    3857
);

-- include chicago
select osm_id, name, operator, public_transport, covered, highway, way  
from public.planet_osm_point
where public_transport is not null
and railway is null
and operator is not null
and way && ST_Transform(
    ST_MakeEnvelope(-99.11,31.77,-75.54,45.87, 4326),
    3857
);
 

select osm_id, name, operator, public_transport, covered, highway, way   
from public.planet_osm_point
where public_transport is not null
and railway is not null
and operator is not null
and way && ST_Transform(
    ST_MakeEnvelope(-99.11,31.77,-75.54,45.87, 4326),
    3857
);
select 
	a.geoid, t.geoid as tiger_geoid, t.tractce as tract, t.namelsad as tract_name, t.countyfp, x.namelsad as county_name,
	t.aland, a.b01001001 as popl, round(a.b01001001::numeric * 2589988.0 / nullif(t.aland, 0), 2) as popl_dens, 
	b.b01002001 as med_age, d.b06011001 as med_inc, nullif(f.b25064001, '-666666700') as med_rent, 
	a.b01001002 as popl_male, a.b01001026 as popl_female,
	b.b01002002 as med_age_male, b.b01002003 as med_age_female,
	e.b17001002 as popl_pov, round(e.b17001002::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as popl_pov_pct,
	c.b02001002 as popl_white, round(c.b02001002::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_white,
	c.b02001003 as popl_black, round(c.b02001003::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_black,
	c.b02001008 as popl_mixed, round(c.b02001008::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_mixed,
	c.b02001005 as popl_asian, round(c.b02001005::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_asian,
	c.b02001004 as popl_ind_al, c.b02001006 as popl_haw,  
	round((c.b02001004 + c.b02001006)::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_ind_al_haw,
	c.b02001007 as popl_other, round(c.b02001007::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_other,
	g.b28008002 as has_cmptr,
	t.geom
from acs2024_5yr.b01001_moe a
join acs2024_5yr.b01002_moe b on b.geoid = a.geoid
join acs2024_5yr.b02001_moe c on c.geoid = a.geoid
join acs2024_5yr.b06011_moe d on d.geoid = a.geoid
join acs2024_5yr.b17001_moe e on e.geoid = a.geoid
join acs2024_5yr.b25064_moe f on f.geoid = a.geoid
join acs2024_5yr.b28008_moe g on g.geoid = a.geoid
join tgr24.tract t on t.geoid = substring(a.geoid, 8)
join tgr24.county x on x.geoid = substring(t.geoid, 1, 5)
where a.geoid like any (array['14000US29%', '14000US17%']);

select 
	a.geoid, t.geoid as tiger_geoid, t.tractce as tract, t.namelsad as tract_name, t.countyfp, x.namelsad as county_name,
	t.aland, a.b01001001 as popl, round(a.b01001001::numeric * 2589988.0 / nullif(t.aland, 0), 2) as popl_dens, 
	b.b01002001 as med_age, d.b06011001 as med_inc, nullif(f.b25064001, '-666666700') as med_rent, 
	a.b01001002 as popl_male, a.b01001026 as popl_female,
	b.b01002002 as med_age_male, b.b01002003 as med_age_female,
	e.b17001002 as popl_pov, round(e.b17001002::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as popl_pov_pct,
	c.b02001002 as popl_white, round(c.b02001002::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_white,
	c.b02001003 as popl_black, round(c.b02001003::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_black,
	c.b02001008 as popl_mixed, round(c.b02001008::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_mixed,
	c.b02001005 as popl_asian, round(c.b02001005::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_asian,
	c.b02001004 as popl_ind_al, c.b02001006 as popl_haw,  
	round((c.b02001004 + c.b02001006)::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_ind_al_haw,
	c.b02001007 as popl_other, round(c.b02001007::numeric / nullif(a.b01001001::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_other,
	g.b28008002 as has_cmptr,
	t.geom
from acs.b01001_moe a
join acs.b01002_moe b on b.geoid = a.geoid
join acs.b02001_moe c on c.geoid = a.geoid
join acs.b06011_moe d on d.geoid = a.geoid
join acs.b17001_moe e on e.geoid = a.geoid
join acs.b25064_moe f on f.geoid = a.geoid
join acs.b28008_moe g on g.geoid = a.geoid
join tgr.tract t on t.geoid = substring(a.geoid, 8)
join tgr.county x on x.geoid = substring(t.geoid, 1, 5)
where a.geoid like any (array['14000US29%', '14000US17%']);