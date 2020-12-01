import fs from "fs";
import path from "path";
import assert from "assert";
import {Insert, Select, Update} from '@sqb/builder';
import {
    Adapter, ClientConfiguration, Client,
    registerAdapter, unRegisterAdapter
} from '@sqb/connect';

export function getInsertSQLsForTestData(opts?: {
    schema?: string,
    stringifyValueForSQL?: (v: any) => string;
}) {
    const result: { table: string, scripts: string[] }[] = [];
    const repositoryRoot = path.resolve(__dirname, '../../../..');

    const dataFiles: any[] = [
        JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'support/test-data', 'regions.json'), 'utf8')),
        JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'support/test-data', 'airports.json'), 'utf8'))
    ];

    const stringify = opts?.stringifyValueForSQL || stringifyValueForSQL;
    const schema = opts?.schema ? opts?.schema + '.' : '';

    for (const table of dataFiles) {
        const file = {table, scripts: []};

        const keys = Object.keys(table.rows[0]);
        const fields = keys.map(f => f.toLowerCase());

        for (const row of table.rows) {
            const values = keys.map(x => stringify(row[x]));
            const insertSql = 'insert into ' + schema + table.name +
                ' (' + fields.join(',') + ') values (' + values.join(',') + ')';
            file.scripts.push(insertSql);
        }
        result.push(file);
    }

    return result;
}

export function stringifyValueForSQL(v: any): string {
    if (typeof v === 'string')
        return "'" + v.replace(/'/g, "\\'") + "'";
    return '' + v;
}

export function initAdapterTests(adapter: Adapter, config?: Partial<ClientConfiguration>) {

    let client: Client;
    before(() => registerAdapter(adapter));
    after(async () => {
        if (client)
            await client.close(0);
    });
    after(() => unRegisterAdapter(adapter));

    it('should create connection instance with ' + adapter.driver + ' driver', function () {
        const cfg: ClientConfiguration = {
            ...config,
            driver: adapter.driver,
            driverOptions: {
                ssl: false,
            },
            pool: {
                validation: true,
                max: 1
            },
            defaults: {
                objectRows: true,
                autoCommit: false,
                fieldNaming: 'lowercase'
            }
        }
        client = new Client(cfg);
        assert(client.dialect, adapter.dialect);
    });

    it('should test connection', function () {
        // noinspection JSPotentiallyInvalidUsageOfThis
        this.timeout(30000);
        return client.test();
    });

    it('should execute a raw select query', async function () {
        const result = await client.execute('select * from airports order by id');
        assert(result && result.rows && result.rows.length);
        assert(result.rows[0].id === 'AIGRE');
    });

    it('should execute a SQB query', async function () {
        const result = await client.execute(
            Select().from('airports').limit(10).orderBy('id'));
        const rows = result.rows;
        assert(rows);
        assert.strictEqual(rows[0].id, 'AIGRE');
    });

    it('should return rows and field info (array rows)', async function () {
        const result = await client.execute(
            Select().from('airports').limit(10).orderBy('id'),
            {objectRows: false});
        assert(result.fields);
        assert(result.fields.get('id'));
        assert(result.fields.get('id').fieldName, 'ID');
        const rows = result.rows;
        assert(rows);
        assert.strictEqual(rows.length, 10);
        assert.strictEqual(rows[0][0], 'AIGRE');
    });

    it('should return rows and field info (object rows)', async function () {
        const result = await client.execute(
            Select().from('airports').limit(10).orderBy('id'),
            {objectRows: true});
        assert(result.fields);
        assert(result.fields.get('id'));
        assert(result.fields.get('id').fieldName, 'ID');
        const rows = result.rows;
        assert(rows);
        assert.strictEqual(rows.length, 10);
        assert.strictEqual(rows[0].id, 'AIGRE');
    });

    it('should return cursor and field info', async function () {
        const result = await client.execute(
            Select().from('airports').orderBy('id'),
            {cursor: true, fetchRows: 100, objectRows: true});
        assert(result.fields);
        assert(result.fields.get('id'));
        assert(result.fields.get('id').fieldName, 'ID');
        const cursor = result.cursor;
        assert(cursor);
        const r = await cursor.next();
        assert.strictEqual(r.id, 'AIGRE');
        await cursor.close();
    });

    it('should fetchRows option limit row count', async function () {
        const result = await client.execute(
            Select().from('airports'),
            {fetchRows: 5}
        );
        const rows = result.rows;
        assert(rows);
        assert.strictEqual(rows.length, 5);
    });


    it('should return error if sql is invalid', async function () {
        await assert.rejects(() => client.execute('invalid sql'));
    });

    it('should insert record with returning', async function () {
        const id = 'X' + Math.floor(Math.random() * 10000);
        const result = await client.execute(
            Insert('airports', {
                'ID': id,
                'ShortName': 'TEST',
                'Name': 'Test1'
            }).returning('id::string')
        );
        assert(result);
        assert(result.rows);
        assert.strictEqual(result.rows[0].id, id);
        assert.strictEqual(result.rowsAffected, 1);
    });

    it('should update record with returning', async function () {
        const catalog = Math.floor(Math.random() * 10000);
        const result = await client.execute(
            Update('airports', {
                Catalog: catalog
            }).where({id: 'LFOI'})
                .returning('id::string', 'catalog::number')
        );
        assert(result);
        assert(result.rows);
        assert.strictEqual(result.rows[0].id, 'LFOI');
        assert.strictEqual(result.rows[0].catalog, catalog);
        assert.strictEqual(result.rowsAffected, 1);
    });

    it('should return updated record count', async function () {
        const result = await client.execute(
            Update('airports', {temp: 1})
        );
        assert(result);
        assert(result.rowsAffected > 1000);
    });

    it('should commit a transaction', async function () {
        let r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        const oldCatalog = r.rows[0].catalog;
        let newCatalog = null;

        await client.acquire(async (connection) => {
            await connection.startTransaction();
            newCatalog = Math.floor(Math.random() * 10000);
            await connection.execute(
                Update('airports', {
                    Catalog: newCatalog
                }).where({id: 'LFBA'})
            );
            const result = await connection.execute(
                Select().from('airports').where({id: 'LFBA'})
            );
            assert(result);
            assert(result.rows);
            assert.strictEqual(result.rows[0].id, 'LFBA');
            assert.strictEqual(result.rows[0].catalog, newCatalog);
            assert.notStrictEqual(result.rows[0].catalog, oldCatalog);
            await connection.commit();
        });

        r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        assert.notStrictEqual(r.rows[0].catalog, oldCatalog);
        assert.strictEqual(r.rows[0].catalog, newCatalog);
    });

    it('should rollback a transaction', async function () {
        let r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        const oldCatalog = r.rows[0].catalog;

        await client.acquire(async (connection) => {
            await connection.startTransaction();
            const catalog = Math.floor(Math.random() * 10000);
            await connection.execute(
                Update('airports', {
                    Catalog: catalog
                }).where({id: 'LFBA'})
            );
            const result = await connection.execute(
                Select().from('airports').where({id: 'LFBA'})
            );
            assert(result);
            assert(result.rows);
            assert.strictEqual(result.rows[0].id, 'LFBA');
            assert.strictEqual(result.rows[0].catalog, catalog);
            assert.notStrictEqual(result.rows[0].catalog, oldCatalog);
            await connection.rollback();
        });

        r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        assert.strictEqual(r.rows[0].catalog, oldCatalog);
    });

    it('should start transaction when autoCommit is off', async function () {
        let r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        const oldCatalog = r.rows[0].catalog;

        await client.acquire(async (connection) => {
            const catalog = Math.floor(Math.random() * 10000);
            await connection.execute(
                Update('airports', {
                    Catalog: catalog
                }).where({id: 'LFBA'}),
                {autoCommit: false}
            );
            const result = await connection.execute(
                Select().from('airports').where({id: 'LFBA'})
            );
            assert(result);
            assert(result.rows);
            assert.strictEqual(result.rows[0].id, 'LFBA');
            assert.strictEqual(result.rows[0].catalog, catalog);
            assert.notStrictEqual(result.rows[0].catalog, oldCatalog);
            await connection.rollback();
        });

        r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        assert.strictEqual(r.rows[0].catalog, oldCatalog);
    });

    it('should commit a transaction when autoCommit is on', async function () {
        let r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        const oldCatalog = r.rows[0].catalog;
        let newCatalog = null;

        await client.acquire(async (connection) => {
            newCatalog = Math.floor(Math.random() * 10000);
            await connection.execute(
                Update('airports', {
                    Catalog: newCatalog
                }).where({id: 'LFBA'}),
                {autoCommit: true}
            );
            const result = await connection.execute(
                Select().from('airports').where({id: 'LFBA'})
            );
            assert(result);
            assert(result.rows);
            assert.strictEqual(result.rows[0].id, 'LFBA');
            assert.strictEqual(result.rows[0].catalog, newCatalog);
            assert.notStrictEqual(result.rows[0].catalog, oldCatalog);
            await connection.rollback();
        });

        r = await client.execute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert(r);
        assert(r.rows);
        assert.strictEqual(r.rows[0].id, 'LFBA');
        assert.notStrictEqual(r.rows[0].catalog, oldCatalog);
        assert.strictEqual(r.rows[0].catalog, newCatalog);
    });

    it('should call startTransaction() more than one', async function () {
        await client.acquire(async (connection) => {
            await connection.startTransaction();
            await connection.startTransaction();
        });
    });

    it('should call commit() more than one', async function () {
        await client.acquire(async (connection) => {
            await connection.startTransaction();
            await connection.commit();
            await connection.commit();
        });
    });

    it('should call rollback() more than one', async function () {
        await client.acquire(async (connection) => {
            await connection.startTransaction();
            await connection.rollback();
            await connection.rollback();
        });
    });

}
