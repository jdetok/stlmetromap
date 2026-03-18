create schema if not exists api;

drop table if exists api.routes;
create table if not exists api.routes (
	id bigserial primary key,
	route_id varchar(20) not null,
	route_type varchar(20) not null,
	route varchar(20) not null,
	route_name varchar(255) not null,
	route_desc varchar(255) not null,
	freq_wk integer,
	freq_sa integer,
	freq_su integer,
	stops_total integer,
	stops_access_wheelchair integer,
	stops_access_amenities integer,
	stops_access_grocery integer,
	stops_access_schools integer,
	stops_access_colleges integer,
	stops_access_parks integer,
	stops_access_social_facilities integer,
	stops_access_churches integer,
	stops_access_medical integer,
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
		bool_or(d.type = 'church') as has_church,
		bool_or(d.type = 'medical') as has_medical,
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
        count(distinct case when c.wheelchair_boarding = 'accessible' then b.stop_id end) as stops_access_wheelchair,
        count(distinct case when sn.has_any then b.stop_id end) as stops_access_amenities,
        count(distinct case when sn.has_grocery then b.stop_id end) as stops_access_grocery,
        count(distinct case when sn.has_school then b.stop_id end) as stops_access_schools,
        count(distinct case when sn.has_uni then b.stop_id end) as stops_access_colleges,
        count(distinct case when sn.has_park then b.stop_id end) as stops_access_parks,
        count(distinct case when sn.has_social then b.stop_id end) as stops_access_social_facilities,
        count(distinct case when sn.has_medical then b.stop_id end) as stops_access_medical,
		count(distinct case when sn.has_church then b.stop_id end) as stops_access_churches,
        count(distinct case when sn.has_fun then b.stop_id end) as stops_access_entertainment
    from trips a
    join stop_times b on b.trip_id = a.trip_id
    join stops c on c.stop_id = b.stop_id
    left join stops_near sn on sn.stop_id = b.stop_id
    group by a.route_id
), tripagg as (
	select a.service_id, a.route_id, a.trip_id, a.trip_headsign, a.direction_id,
		case 
			when b.saturday = 'available' then 'SA'
			when b.sunday = 'available' then 'SU'
			else 'WK'
		end as day_type,
		c.trip_start_time,
		max(c.arrival_time) as last_stop_arrival_time,
		max(c.stop_sequence_consec) as num_stops
	from trips a
	join calendar b on b.service_id = a.service_id
	join stop_times c on c.trip_id = a.trip_id
	join routes d on d.route_id = a.route_id
	group by a.service_id, a.route_id, a.trip_id, a.trip_headsign, a.direction_id, c.trip_start_time, b.saturday, b.sunday
), freqs as (
	select 
		route_id, day_type, direction_id, trip_start_time, 
		trip_start_time - lag(trip_start_time) over (
			partition by route_id, day_type, direction_id order by trip_start_time
		) as freq
	from tripagg
), freqs_by_route as (
	select route_id, day_type,
		mode() within group (order by ceil(extract(epoch from freq) / 60 / 5) * 5) as freq
	from freqs
	where freq is not null
	group by route_id, day_type
)
insert into api.routes (route_id, route_type, route, route_name, route_desc, freq_wk, freq_sa, freq_su, stops_total, stops_access_wheelchair, 
	stops_access_amenities, stops_access_grocery, stops_access_schools, stops_access_colleges, stops_access_parks, 
	stops_access_social_facilities, stops_access_medical, stops_access_churches, stops_access_entertainment
)
select
    a.route_id, route_type, route, route_name, route_desc,
    wk.freq as freq_wk, sa.freq as freq_sa, coalesce(su.freq, sa.freq) as freq_su,
    stops_total, stops_access_wheelchair,
    stops_access_amenities, stops_access_grocery,
    stops_access_schools, stops_access_colleges, stops_access_parks,
    stops_access_social_facilities, stops_access_medical, stops_access_churches, stops_access_entertainment
from rts a
join num_stops b on b.route_id = a.route_id
join freqs_by_route wk on wk.route_id = a.route_id and wk.day_type = 'WK'
left join freqs_by_route sa on sa.route_id = a.route_id and sa.day_type = 'SA'
left join freqs_by_route su on su.route_id = a.route_id and su.day_type = 'SU'
order by stops_total desc;

select * from api.routes;
select 
    route, route_type, route_name, route_desc,
    stops_total, stops_access_wheelchair,
    stops_access_amenities, stops_access_grocery,
    stops_access_schools, stops_access_colleges, stops_access_parks,
    stops_access_social_facilities, stops_access_entertainment
from api.routes;