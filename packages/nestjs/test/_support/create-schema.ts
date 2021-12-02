import './env';
import {Connection} from 'postgresql-client';
import '@sqb/postgres';

let created = false;
export const DBSCHEMA = require('./photo-app/config.json').schema;

export const SCHEMA_SQL = `
CREATE SCHEMA IF NOT EXISTS ${DBSCHEMA} AUTHORIZATION postgres;
DROP TABLE IF EXISTS ${DBSCHEMA}.photos CASCADE;

CREATE TABLE ${DBSCHEMA}.photos
(
    id SERIAL NOT NULL,
    name character varying(32),
    description character varying(32),
    views int4,
    CONSTRAINT photos_pkey PRIMARY KEY (id)
);
`

export async function createSchema(): Promise<void> {
    if (created)
        return;
    const connection = new Connection({schema: DBSCHEMA});
    await connection.connect();
    created = true;
    try {
        await connection.execute(SCHEMA_SQL);
    } finally {
        await connection.close(0);
    }
}
