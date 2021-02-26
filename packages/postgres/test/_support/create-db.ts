import {Connection, stringifyValueForSQL} from 'postgresql-client';
// noinspection ES6PreferShortImport
import {getInsertSQLsForTestData} from '../../../connect/test/_shared/adapter-tests';

const schema = process.env.PGSCHEMA || 'test';
let schemaCreated = false;

const schemaSql = `
DROP SCHEMA IF EXISTS ${schema} CASCADE;
CREATE SCHEMA ${schema} AUTHORIZATION postgres;

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE ${schema}.continents
(
    code character varying(5),
    name character varying(16),   
    CONSTRAINT continents_pkey PRIMARY KEY (code)
);

CREATE TABLE ${schema}.countries
(
    code character varying(5),
    name character varying(16),
    phone_code character varying(8),
    continent_code character varying(2),
    CONSTRAINT countries_pkey PRIMARY KEY (code),
    CONSTRAINT fk_countries_continent_code FOREIGN KEY (continent_code)
        REFERENCES ${schema}.continents (code) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE ${schema}.customers
(
    id SERIAL,
    given_name character varying(64),
    family_name character varying(64),
    gender char(1),
    birth_date date,
    city character varying(32),
    country_code character varying(5),
    created_at timestamp default NOW(),
    updated_at timestamp,
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT fk_customers_country_code FOREIGN KEY (country_code)
        REFERENCES ${schema}.countries (code) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

ALTER SEQUENCE ${schema}.customers_id_seq RESTART WITH 10000;

CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON ${schema}.customers
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_updated_at();


CREATE TABLE ${schema}.customer_tags
(
    customer_id int4,
    tag character varying(16),
    color character varying(8),
    active boolean,
    CONSTRAINT customer_tags_pkey PRIMARY KEY (customer_id, tag),
    CONSTRAINT fk_customer_tags_customer_id FOREIGN KEY (customer_id)
        REFERENCES ${schema}.customers (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

CREATE TABLE ${schema}.data_types
(
    id SERIAL NOT NULL,
    f_bool bool,
    f_int2 int2,
    f_int4 int4,
    f_int8 int8,
    f_float4 float4,
    f_float8 float8,
    f_char char,
    f_varchar character varying(255),
    f_text text,
    f_bpchar bpchar,
    f_json json,
    f_xml xml,
    f_date date,
    f_timestamp timestamp,
    f_timestamptz timestamptz,
    f_bytea bytea,
    f_point point,
    f_circle circle,
    f_lseg lseg,
    f_box box,
    CONSTRAINT data_types_pkey PRIMARY KEY (id)
);

insert into ${schema}.data_types
  (id, f_bool, f_int2, f_int4, f_int8, f_float4, f_float8, f_char, f_varchar,
   f_text, f_bpchar, f_json, f_xml, f_date, f_timestamp, f_timestamptz,
   f_bytea, f_point, f_circle, f_lseg, f_box)
values
  (1, true, 1, 12345, 9007199254740995, 1.2, 5.12345, 'a', 'abcd', 'abcde', 'abcdef',
   '{"a": 1}', '<tag1>123</tag1>', '2010-03-22', '2020-01-10 15:45:12.123',
    '2005-07-01 01:21:11.123+03:00', 'ABCDE', '(-1.2, 3.5)', '<(-1.2, 3.5), 4.6>',
    '[(1.2, 3.5), (4.6, 5.2)]', '((-1.6, 3.0), (4.6, 0.1))');
`

export async function createTestSchema() {
    if (schemaCreated)
        return;
    const connection = new Connection();
    await connection.connect();
    try {
        await connection.execute(schemaSql);
        const dataFiles = getInsertSQLsForTestData({
            schema,
            stringifyValueForSQL
        });
        for (const table of dataFiles)
            await connection.execute(table.scripts.join(';\n'));
        schemaCreated = true;
    } finally {
        await connection.close(0);
    }
}
