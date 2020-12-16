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
    city text,
    country_code text,
    FOREIGN KEY (country_code) REFERENCES countries (code)
);

`
