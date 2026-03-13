select * from agency;
select * from stops;
select * from routes;
select * from trips;
select * from stop_times;


-- working query:
select
	d.stop_id, d.stop_name, d.stop_desc, d.wheelchair_boarding as wheelchair,	
	string_agg(distinct c.route_id, ', ') as route_ids,
	string_agg(distinct c.route_short_name, ', ') as routes,
	string_agg(distinct c.route_long_name, ', ') as route_names,
	string_agg(distinct case
		when c.route_type = '2' then c.route_long_name
		when c.route_type = '3' then c.route_short_name || '-' || c.route_long_name
	end, ', ') as route_desc,
	d.stop_loc as geom
from stop_times a
join trips b on b.trip_id = a.trip_id
join routes c on c.route_id = b.route_id
join stops d on d.stop_id = a.stop_id
group by d.stop_id, d.stop_name, d.stop_loc;

with mtr as (
	select 805 as meters, 'm' as unit, '1/2mi' as str
), rts as (
	select 
		max(a.route_id) as route_id, 
		a.route_short_name as route,
		a.route_type,
		a.route_long_name as route_name,
		case
			when a.route_type = '2' then a.route_long_name
			when a.route_type = '3' then a.route_short_name || '-' || a.route_long_name
		end as route_desc 
	from routes a
	group by a.route_long_name, a.route_short_name, a.route_type
), stops_near as (
	select distinct c.stop_id
	    from stops c
	    cross join mtr m
	    where exists (
	        select 1 from api.places d
	where ST_DWithin(ST_Transform(c.stop_loc::geometry, 3857), ST_Transform(d.way::geometry, 3857), m.meters))
), num_stops as (
	select a.route_id, string_agg(distinct a.trip_headsign, ', ') as trip,
		count(distinct b.stop_id) as stops_total,
		count(distinct case when c.wheelchair_boarding = 'accessible' then b.stop_id end) as stops_accessible,
		count(distinct case when c.wheelchair_boarding = 'not_accessible' then b.stop_id end) as stops_not_accessible,
		count(distinct case when d.stop_id is not null then b.stop_id end) as stops_access_amenities
	from trips a 
	join stop_times b on b.trip_id = a.trip_id
	join stops c on c.stop_id = b.stop_id
	left join stops_near d on d.stop_id = b.stop_id
	group by a.route_id
)
select distinct route, route_type, route_name, trip, stops_total, stops_accessible, stops_not_accessible, stops_access_amenities
from rts a join num_stops b on b.route_id = a.route_id order by b.stops_total desc;

select trip_id, count(distinct stop_id) from stop_times group by trip_id