-- WORKING ON DETERMINING SCHEDULING/FREQUENCIES
-- NOTE: Trips are scheduled as weekly (available M-F), only Saturday, and only Sunday

select * from stop_times limit 50;
select * from trips;
select * from calendar;

select a.service_id, a.route_id, a.trip_id, a.trip_headsign, a.direction_id,
	case 
		when b.saturday = 'available' then 'SA'
		when b.sunday = 'available' then 'SU'
		else 'WK'
	end as days_avail,
	c.trip_start_time,
	max(c.arrival_time) as last_stop_arrival_time,
	max(c.stop_sequence_consec) as num_stops
from trips a
join calendar b on b.service_id = a.service_id
join stop_times c on c.trip_id = a.trip_id
join routes d on d.route_id = a.route_id

group by a.service_id, a.route_id, a.trip_id, a.trip_headsign, a.direction_id, c.trip_start_time, b.saturday, b.sunday;

-- safe
with tripagg as (
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
)
select a.route_id, day_type, b.route_long_name,
	mode() within group (order by ceil(extract(epoch from freq) / 60 / 5) * 5) as freq
from freqs a
join routes b on b.route_id = a.route_id
where freq is not null
group by a.route_id, day_type, b.route_long_name;
--select * from freqs;
--from tripagg
--order by route_id, day_type, direction_id, trip_start_time;
