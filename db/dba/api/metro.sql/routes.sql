create schema if not exists api;

drop table if exists api.routes;
create table if not exists api.routes (
	id bigserial primary key,
	route varchar(50),
	route_type varchar(50),
	route_name text,
	route_desc text,
	trips text,
	stops_total integer,
	stops_accessible integer,
	stops_access_amenities integer,
	stops_access_grocery integer,
	stops_access_schools integer,
	stops_access_colleges integer,
	stops_access_parks integer,
	stops_access_social_facilities integer,
	stops_access_entertainment integer
);

truncate table api.routes restart identity;

with mtr as (
    select 805 as meters
), rts as (
    select
        max(a.route_id) as route_id,
        a.route_type,
        a.route_short_name as route,
        a.route_long_name as route_name,
        case
            when a.route_type = '2' then a.route_long_name
            when a.route_type = '3' then a.route_short_name || '-' || a.route_long_name
        end as route_desc
    from routes a
    group by a.route_long_name, a.route_short_name, a.route_type
), stops_near as (
    select
        c.stop_id,
        bool_or(true) as has_any,
        bool_or(d.type = 'grocery') as has_grocery,
        bool_or(d.type = 'school') as has_school,
        bool_or(d.type = 'university') as has_uni,
        bool_or(d.type = 'park') as has_park,
        bool_or(d.type = 'social_facility') as has_social,
        bool_or(d.type = 'entertainment') as has_fun
    from stops c
    cross join mtr m
    join api.places d
        on ST_DWithin(
            ST_Transform(c.stop_loc::geometry, 3857),
            ST_Transform(d.way::geometry, 3857),
            m.meters
        )
    group by c.stop_id
), num_stops as (
    select
        a.route_id,
        string_agg(distinct a.trip_headsign, ', ') as trips,
        count(distinct b.stop_id) as stops_total,
        count(distinct case when c.wheelchair_boarding = 'accessible' then b.stop_id end) as stops_accessible,
        count(distinct case when sn.has_any then b.stop_id end) as stops_access_amenities,
        count(distinct case when sn.has_grocery then b.stop_id end) as stops_access_grocery,
        count(distinct case when sn.has_school then b.stop_id end) as stops_access_schools,
        count(distinct case when sn.has_uni then b.stop_id end) as stops_access_colleges,
        count(distinct case when sn.has_park then b.stop_id end) as stops_access_parks,
        count(distinct case when sn.has_social then b.stop_id end) as stops_access_social_facilities,
        count(distinct case when sn.has_fun then b.stop_id end) as stops_access_entertainment
    from trips a
    join stop_times b on b.trip_id = a.trip_id
    join stops c on c.stop_id = b.stop_id
    left join stops_near sn on sn.stop_id = b.stop_id
    group by a.route_id
)
--insert into api.routes (route, route_type, route_name, route_desc, trips, stops_total, stops_accessible, 
--	stops_access_amenities, stops_access_grocery, stops_access_schools, stops_access_colleges, stops_access_parks, 
--	stops_access_social_facilities, stops_access_entertainment
--)
select
    route, route_type, route_name, route_desc, trips,
    stops_total, stops_accessible,
    stops_access_amenities, stops_access_grocery,
    stops_access_schools, stops_access_colleges, stops_access_parks,
    stops_access_social_facilities, stops_access_entertainment
from rts a
join num_stops b on b.route_id = a.route_id
order by stops_total desc;

select * from api.routes;
