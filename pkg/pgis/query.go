package pgis

type Query struct {
	Q      string
	IsGeom bool
}

var QPLACES = &Query{Q: `select osm_id, type, name, operator, bus_near, rail_near, geom from api.places`, IsGeom: true}

var QAMTRAK = &Query{Q: `
select p.osm_id, p.name, p.operator, way,
    ST_AsGeoJSON(ST_Transform(p.way, 4326)) as geom
from public.planet_osm_point p
where p.public_transport is not null
and p.railway is not null
and p.operator = 'Amtrak'
and not exists (
    select 1 from public.planet_osm_point p2
    where p2.osm_id < p.osm_id
    and p2.operator = 'Amtrak'
    and ST_DWithin(p.way, p2.way, 200)
)
`, IsGeom: true}

var QCYCLE = &Query{Q: `
select osm_id,
	coalesce(name, 'Cycle/Foot Path') as name,
	coalesce(surface, '') as surface,
	coalesce(bicycle, '') as bicycle,
	coalesce(foot, '') as foot,
	coalesce(tags->'lit', '') as lit,
	ST_AsGeoJSON(ST_Transform(way, 4326)) AS geom
from public.planet_osm_line
where highway='cycleway'
and way && ST_Transform(
    ST_MakeEnvelope(-92.5, 37, -89.5, 40, 4326),
    3857
)	
`, IsGeom: true}

var QBUS = &Query{Q: `
select a.stop_id, c.stop_name, c.wheelchair_boarding as wheelchair,
	string_agg(distinct d.route_short_name, ', ') as route_ids,
	string_agg(distinct(d.route_short_name || '-' || d.route_long_name), ', ') as route_names,
	ST_AsGeoJSON(c.stop_loc) as geom 
from public.stop_times a
inner join public.trips b on b.trip_id = a.trip_id
inner join public.stops c on c.stop_id = a.stop_id
inner join public.routes d on d.route_id = b.route_id
where d.route_type = '3'
group by a.stop_id, c.stop_name, c.stop_loc, c.wheelchair_boarding
`, IsGeom: true}

var QRAIL = &Query{Q: `
select a.stop_id, c.stop_name, string_agg(distinct d.route_short_name, ', ') as route_ids,
	string_agg(distinct d.route_long_name, ', ') as route_names, c.wheelchair_boarding as wheelchair,
	ST_AsGeoJSON(c.stop_loc) as geom 
from public.stop_times a
inner join public.trips b on b.trip_id = a.trip_id
inner join public.stops c on c.stop_id = a.stop_id
inner join public.routes d on d.route_id = b.route_id
where d.route_type = '2'
group by a.stop_id, c.stop_name, c.stop_loc, c.wheelchair_boarding
`, IsGeom: true}

var QTRACTS = &Query{Q: `
with stopcnt as (
	select a.geoid, count(b.stop_id) as stops
	from tgr.tract a
	join public.stops b on st_coveredby(b.stop_loc::geometry, st_transform(a.geom, 4326))
	group by a.geoid
)
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
	g.b28008002 as has_cmptr, coalesce(z.stops, 0) as stops_in_tract,
	ST_AsGeoJSON(ST_Transform(t.geom, 4326)) as geom
from acs.b01001_moe a
join acs.b01002_moe b on b.geoid = a.geoid
join acs.b02001_moe c on c.geoid = a.geoid
join acs.b06011_moe d on d.geoid = a.geoid
join acs.b17001_moe e on e.geoid = a.geoid
join acs.b25064_moe f on f.geoid = a.geoid
join acs.b28008_moe g on g.geoid = a.geoid
join tgr.tract t on t.geoid = substring(a.geoid, 8)
join tgr.county x on x.geoid = substring(t.geoid, 1, 5)
left join stopcnt z on z.geoid = t.geoid
where ST_Intersects(ST_Transform(t.geom, 4326), ST_MakeEnvelope(-180, -90, 180, 41, 4326))
and (
	(a.geoid like '14000US17%' and t.countyfp in ('163', '119', '133', '117', '083', '013', '027', '005'))
	or (a.geoid like '14000US29%' and t.countyfp in ('189', '510', '183', '099', '071', '219'))
	or round(a.b01001001::numeric * 2589988.0 / nullif(t.aland, 0), 2) >= 1000
)
`, IsGeom: true}

var QCOUNTIES = &Query{Q: `
with stopcnt as (
    select a.countyfp, a.statefp, count(b.stop_id) as stops
    from tgr.county a
    join public.stops b on st_coveredby(b.stop_loc::geometry, st_transform(a.geom, 4326))
    group by a.countyfp, a.statefp
),
acs as (
    select
        substring(a.geoid, 8, 5) as county_geoid,
        sum(a.b01001001)::int as popl,
        sum(a.b01001002)::int as popl_male,
        sum(a.b01001026)::int as popl_female,
        sum(c.b02001002)::int as popl_white,
        sum(c.b02001003)::int as popl_black,
        sum(c.b02001008)::int as popl_mixed,
        sum(c.b02001005)::int as popl_asian,
        sum(c.b02001004)::int as popl_ind_al,
        sum(c.b02001006)::int as popl_haw,
        sum(c.b02001007)::int as popl_other,
        sum(e.b17001002)::int as popl_pov,
        sum(g.b28008002)::int as has_cmptr,
        avg(b.b01002001) as med_age,
        avg(b.b01002002) as med_age_male,
        avg(b.b01002003) as med_age_female,
        avg(d.b06011001) as med_inc,
        avg(f.b25064001::numeric) as med_rent
    from acs.b01001_moe a
    join acs.b01002_moe b on b.geoid = a.geoid
    join acs.b02001_moe c on c.geoid = a.geoid
    join acs.b06011_moe d on d.geoid = a.geoid
    join acs.b17001_moe e on e.geoid = a.geoid
    join acs.b25064_moe f on f.geoid = a.geoid
    join acs.b28008_moe g on g.geoid = a.geoid
    group by substring(a.geoid, 8, 5)
)
select
    x.geoid, x.countyfp, x.namelsad as county_name,
    x.aland, a.popl,
    round(a.popl::numeric * 2589988.0 / nullif(x.aland, 0), 2) as popl_dens,
    round(a.med_age::numeric, 1) as med_age,
    round(a.med_inc::numeric, 0) as med_inc,
    round(a.med_rent, 0) as med_rent,
    a.popl_male, a.popl_female,
    round(a.med_age_male::numeric, 1) as med_age_male,
    round(a.med_age_female::numeric, 1) as med_age_female,
    a.popl_pov,
    round(a.popl_pov::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as popl_pov_pct,
    a.popl_white, round(a.popl_white::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_white,
    a.popl_black, round(a.popl_black::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_black,
    a.popl_mixed, round(a.popl_mixed::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_mixed,
    a.popl_asian, round(a.popl_asian::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_asian,
    a.popl_ind_al, a.popl_haw,
    round((a.popl_ind_al + a.popl_haw)::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_ind_al_haw,
    a.popl_other, round(a.popl_other::numeric / nullif(a.popl::numeric, 0) * 100, 2)::varchar(10) || '%' as pct_other,
    a.has_cmptr,
    coalesce(z.stops, 0) as stops_in_county,
    ST_AsGeoJSON(ST_Transform(x.geom, 4326)) as geom
from tgr.county x
join acs a on a.county_geoid = x.geoid
left join stopcnt z on z.countyfp = x.countyfp and z.statefp = x.statefp
where x.statefp in ('29', '17')
`, IsGeom: true}

var QROUTES = &Query{Q: `select * from api.routes where route_type = '3'`, IsGeom: false}
