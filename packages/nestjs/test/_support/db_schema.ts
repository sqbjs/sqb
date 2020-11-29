export const sql = `
DROP SCHEMA IF EXISTS ${process.env.PGSCHEMA} CASCADE;
CREATE SCHEMA ${process.env.PGSCHEMA} AUTHORIZATION postgres;

CREATE TABLE ${process.env.PGSCHEMA}.photos
(
    id SERIAL NOT NULL,
    name character varying(32),
    description character varying(32),
    views int4,
    CONSTRAINT photos_pkey PRIMARY KEY (id)
);
`
