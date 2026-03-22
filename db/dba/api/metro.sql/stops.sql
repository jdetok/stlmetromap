drop table if exists api.stops;
create table if not exists api.stops (
	id bigserial primary key,
	stop_id text,
	stop_name text,
	route_type text,
	route_ids text,
	route_names text,
	wheelchair_access boolean,
	amenity_access boolean,
	grocery_access boolean,
	school_access boolean,
	college_access boolean,
	park_access boolean,
	facility_access boolean,
	medical_access boolean,
	church_access boolean,
	entertainment_access boolean,
	geom text
--	way geometry(point, 4326)
);
truncate table api.stops restart identity;
with mtr as (
    select 805 as meters
), bus_stops as (
	select a.stop_id, c.stop_name, d.route_type, 
		string_agg(distinct d.route_short_name, ', ') as route_ids,
		string_agg(distinct(d.route_short_name || '-' || d.route_long_name), ', ') as route_names, 
		c.stop_loc, ST_AsGeoJSON(c.stop_loc) as geom 
	from public.stop_times a
	inner join public.trips b on b.trip_id = a.trip_id
	inner join public.stops c on c.stop_id = a.stop_id
	inner join public.routes d on d.route_id = b.route_id
	group by a.stop_id, c.stop_name, d.route_type, c.stop_loc, c.wheelchair_boarding
), nearby as (
    select
        c.stop_id,
        case when c.wheelchair_boarding = 'accessible' then true else false end as wheelchair_access,
        bool_or(d.id is not null) as amenity_access,
        bool_or(d.id is not null and d.type = 'grocery') as grocery_access,
        bool_or(d.id is not null and d.type = 'school') as school_access,
        bool_or(d.id is not null and d.type = 'university') as college_access,
        bool_or(d.id is not null and d.type = 'park') as park_access,
        bool_or(d.id is not null and d.type = 'social_facility') as facility_access,
        bool_or(d.id is not null and d.type = 'church') as church_access,
        bool_or(d.id is not null and d.type = 'medical') as medical_access,
        bool_or(d.id is not null and d.type = 'entertainment') as entertainment_access
    from stops c
    cross join mtr m
    left join api.places d
        on ST_DWithin(
            ST_Transform(c.stop_loc::geometry, 3857),
            ST_Transform(d.way::geometry, 3857),
            m.meters
        )
    group by c.stop_id, c.stop_loc   
)
insert into api.stops (stop_id, stop_name, route_type, route_ids, route_names,
	wheelchair_access, amenity_access, grocery_access, school_access, college_access, park_access,
	facility_access, medical_access, church_access, entertainment_access, geom) 
select a.stop_id, stop_name, route_type, route_ids, route_names,
	wheelchair_access, amenity_access, grocery_access, school_access, college_access, park_access,
	facility_access, medical_access, church_access, entertainment_access,
	ST_AsGeoJSON(stop_loc)-- , stop_loc::geometry
from bus_stops a 
join nearby b on b.stop_id = a.stop_id;

select * from api.stops;