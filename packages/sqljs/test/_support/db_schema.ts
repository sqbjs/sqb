export const sql = `

CREATE TABLE countries
(
    code text,
    name text,
    phone_code text,
    PRIMARY KEY (name)
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
