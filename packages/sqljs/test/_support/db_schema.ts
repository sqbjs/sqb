export const sql = `

CREATE TABLE continents
(
    code text PRIMARY KEY,
    name text   
);

CREATE TABLE countries
(
    code text PRIMARY KEY,
    name text,
    phone_code text,
    continent_code text,
    FOREIGN KEY (continent_code) REFERENCES continents (code)
);

CREATE TABLE customers
(
    id INTEGER PRIMARY KEY,
    given_name text,
    family_name text,
    birth_date date,
    gender text,
    city text,
    country_code text,
    active INTEGER default 1,
    created_at text,
    updated_at text,
    FOREIGN KEY (country_code) REFERENCES countries (code)
);

CREATE TABLE tags
(
    id INTEGER,
    name text,
    color text,
    active integer,
    PRIMARY KEY (id)
);

CREATE TABLE customer_tags
(
    customer_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (customer_id, tag_id)
);

`
