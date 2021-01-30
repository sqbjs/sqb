const schema = process.env.PGSCHEMA || 'test';
export const sql = `
DROP SCHEMA IF EXISTS ${schema} CASCADE;
CREATE SCHEMA ${schema} AUTHORIZATION postgres;

CREATE TABLE ${schema}.photos
(
    id SERIAL NOT NULL,
    name character varying(32),
    description character varying(32),
    views int4,
    CONSTRAINT photos_pkey PRIMARY KEY (id)
);
`
