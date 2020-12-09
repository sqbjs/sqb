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
`
