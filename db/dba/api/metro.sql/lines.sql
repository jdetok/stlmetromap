drop table if exists api.lines;
create table if not exists api.lines (
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
	stops_access_entertainment integer,
    geom text
);

select a.shape_id, c.route_desc,
	ST_MakeLine(a.shape_pt_loc::geometry order by shape_pt_sequence) as geom
from shapes a
left join (select distinct route_id, shape_id from trips) b on b.shape_id = a.shape_id
left join api.routes c on c.route_id = b.route_id
where c.route_desc like '58-%'
group by a.shape_id, c.route_desc
;
truncate api.lines restart identity;
with lines as (
    select
    	c.route_id,
        c.route_desc,
        st_makeline(a.shape_pt_loc::geometry order by a.shape_pt_sequence) as geom
    from shapes a
    join (select distinct route_id, shape_id from trips) b on b.shape_id = a.shape_id
    join api.routes c on c.route_id = b.route_id
    group by a.shape_id, c.route_id, c.route_desc
)
insert into api.lines (
	route_id, route_type, route, route_name, 
	route_desc, freq_wk, freq_sa, freq_su,
	stops_total, stops_access_wheelchair,
    stops_access_amenities, stops_access_grocery,
    stops_access_schools, stops_access_colleges, stops_access_parks,
    stops_access_social_facilities, stops_access_churches, 
    stops_access_medical, stops_access_entertainment, geom
)
select
    b.route_id, b.route_type, b.route, b.route_name, 
    b.route_desc, b.freq_wk, b.freq_sa, b.freq_su,
    stops_total, stops_access_wheelchair,
    stops_access_amenities, stops_access_grocery,
    stops_access_schools, stops_access_colleges, stops_access_parks,
    stops_access_social_facilities, stops_access_churches, 
    stops_access_medical, stops_access_entertainment,
    ST_AsGeoJSON(st_collect(geom)) as geom
from lines a
join api.routes b on b.route_id = a.route_id 
group by 
	b.route_id, b.route_type, b.route, b.route_name, 
	b.route_desc, b.freq_wk, b.freq_sa, b.freq_su,
	stops_total, stops_access_wheelchair,
    stops_access_amenities, stops_access_grocery,
    stops_access_schools, stops_access_colleges, stops_access_parks,
    stops_access_social_facilities, stops_access_churches, 
    stops_access_medical, stops_access_entertainment
;

select *, ST_GeomFromGEOJSON(geom) from api.lines;