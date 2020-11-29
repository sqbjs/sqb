import './env';
import {Connection} from 'postgresql-client';

let created = false;

export async function createSchema(): Promise<void> {
    if (created)
        return;
    const connection = new Connection();
    await connection.connect();
    created = true;
    try {
        await connection.execute((await import('./db_schema')).sql);
    } finally {
        await connection.close(0);
    }
}
