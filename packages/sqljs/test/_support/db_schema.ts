export const sql = `
CREATE TABLE regions
(
    id text PRIMARY KEY,
    name text
);

CREATE TABLE airports
(
    id text PRIMARY KEY,
    shortname text,
    name text,
    region text,
    icao text,
    flags integer,
    catalog integer,
    length integer,
    elevation integer,
    runway text,
    frequency float,
    latitude text,
    longitude text,
    temp1 integer     
);

CREATE TABLE region_airports
(
    region_id text,
    airport_id text,
    PRIMARY KEY (region_id, airport_id)
);

CREATE TABLE countries
(
    name text,
    region text,
    PRIMARY KEY (name)
);

insert into countries (name, region) values ('United States', 'US');
insert into countries (name, region) values ('Turkey', 'TR');
insert into countries (name, region) values ('Canada', 'CA');
insert into countries (name, region) values ('Germany', 'DE');

CREATE TABLE customers
(
    id INTEGER PRIMARY KEY,
    given_name text,
    family_name text,
    birth_date date,
    city text,
    country text,
    FOREIGN KEY (country) REFERENCES countries (name)
);

`
