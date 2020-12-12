import fs from "fs";
import path from "path";
import assert from "assert";
import {Query, Insert, Param, Select, Update} from '@sqb/builder';
import {
    Adapter, ClientConfiguration, QueryRequest,
    registerAdapter, unRegisterAdapter
} from '@sqb/connect';

export function initAdapterTests(adapter: Adapter,
                                 config?: Partial<ClientConfiguration>) {

    let connection: Adapter.Connection;
    const clientConfig: ClientConfiguration = {
        ...config,
        driver: adapter.driver,
        pool: {
            validation: true,
            max: 1
        }
    }

    before(() => registerAdapter(adapter));
    after(() => unRegisterAdapter(adapter));
    afterEach(() => connection && connection.close());

    async function adapterExecute(query: Query,
                                  opts?: Partial<QueryRequest>): Promise<Adapter.Response & { objRows: any[] }> {
        const q = query.generate({dialect: adapter.dialect, values: opts?.values});
        const result: any = await connection.execute({
            ...opts,
            sql: q.sql,
            values: q.params,
            returningFields: q.returningFields,
            autoCommit: !(opts?.autoCommit === false)
        });
        if (result.rows) {
            if (result.rowType === 'array') {
                result.objRows = result.rows.reduce((target, row) => {
                    const r: any = {};
                    for (const [i, f] of result.fields.entries()) {
                        r[f.fieldName.toLowerCase()] = row[i];
                    }
                    target.push(r);
                    return target;
                }, []);

            } else
                result.objRows = result.rows;
        }

        return result;
    }

    it('should create connection instance with ' + adapter.driver + ' driver', async function () {
        connection = await adapter.connect(clientConfig);
        assert.ok(connection);
    });

    it('should execute a select query and return fields and rows (objectRows=false)', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('airports').orderBy('id');
        const result = await adapterExecute(query, {objectRows: false});
        assert.ok(result);
        assert.ok(result.rows && result.rows.length);
        assert.ok(result.rowType);
        assert.ok(result.fields);
        assert.strictEqual(result.objRows[0].id, 'AIGRE');
    });

    it('should execute a select query and return fields and rows (objectRows=true)', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('airports').orderBy('id');
        const result = await adapterExecute(query, {objectRows: true});
        assert.ok(result);
        assert.ok(result.rows && result.rows.length);
        assert.ok(result.rowType);
        assert.ok(result.fields);
        assert.strictEqual(result.objRows[0].id, 'AIGRE');
    });

    it('should return cursor', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('airports').orderBy('id');
        const result = await adapterExecute(query, {
            objectRows: false, cursor: true
        });
        assert.ok(result);
        assert.ok(result.rowType);
        assert.ok(result.fields);
        assert.ok(result.cursor);
        const rows = await result.cursor.fetch(1);
        assert.strictEqual(rows.length, 1);
        if (result.rowType === 'array')
            assert.strictEqual(rows[0][0], 'AIGRE');
        else
            assert.strictEqual(rows[0][result.fields[0].fieldName], 'AIGRE');
    });

    it('should fetchRows option limit row count', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('airports').orderBy('id');
        const result = await adapterExecute(query, {
            objectRows: false,
            fetchRows: 5
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rows.length, 5);
    });

    it('should return error if sql is invalid', async function () {
        connection = await adapter.connect(clientConfig);
        await assert.rejects(() => connection.execute({sql: 'invalid sql'}));
    });

    it('should insert record with returning', async function () {
        connection = await adapter.connect(clientConfig);
        const id = 'X' + Math.floor(Math.random() * 10000);
        const query = Insert('airports', {
            id,
            shortname: 'ShortName1',
            name: 'Name1'
        }).returning('id::string');
        const result = await adapterExecute(query, {
            autoCommit: true,
            objectRows: false
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rowsAffected, 1);
        assert.strictEqual(result.objRows[0].id, id);
    });

    it('should execute script with parameters', async function () {
        connection = await adapter.connect(clientConfig);
        const id = 'X' + Math.floor(Math.random() * 10000);
        const query = Insert('airports', {
            id: Param('id'),
            shortname: Param('shortname'),
            name: 'Test1'
        }).returning('id::string');
        const result = await adapterExecute(query, {
            autoCommit: true,
            values: {
                id,
                shortname: 'ShortName1',
                name: 'Name1'
            }
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rowsAffected, 1);
        assert.strictEqual(result.objRows[0].id, id);
    });

    it('should update record with returning', async function () {
        connection = await adapter.connect(clientConfig);
        const catalog = Math.floor(Math.random() * 10000);
        const query = Update('airports', {catalog})
            .where({id: 'LFOI'}).returning('catalog::number');
        const result = await adapterExecute(query, {
            autoCommit: true,
            objectRows: false
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rowsAffected, 1);
        assert.strictEqual(result.objRows[0].catalog, catalog);
    });

    it('should commit a transaction', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        const oldCatalog = r.objRows[0].catalog;
        let newCatalog = null;

        await connection.startTransaction();

        newCatalog = Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('airports', {Catalog: newCatalog}).where({id: 'LFBA'}),
            {autoCommit: false}
        );
        const result = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'}),
            {autoCommit: false}
        );
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.objRows[0].id, 'LFBA');
        assert.strictEqual(result.objRows[0].catalog, newCatalog);
        assert.notStrictEqual(result.objRows[0].catalog, oldCatalog);
        await connection.commit();

        r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        assert.notStrictEqual(r.objRows[0].catalog, oldCatalog);
        assert.strictEqual(r.objRows[0].catalog, newCatalog);
    });

    it('should rollback a transaction', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.objRows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        const oldCatalog = r.objRows[0].catalog;


        await connection.startTransaction();
        const catalog = Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('airports', {Catalog: catalog}).where({id: 'LFBA'}),
            {autoCommit: false}
        );
        const result = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'}),
            {autoCommit: false}
        );
        assert.ok(result);
        assert.ok(result.objRows);
        assert.strictEqual(result.objRows[0].id, 'LFBA');
        assert.strictEqual(result.objRows[0].catalog, catalog);
        assert.notStrictEqual(result.objRows[0].catalog, oldCatalog);
        await connection.rollback();

        r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        assert.strictEqual(r.objRows[0].catalog, oldCatalog);
    });

    it('should start transaction when autoCommit is off', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        const oldCatalog = r.objRows[0].catalog;

        const catalog = Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('airports', {Catalog: catalog}).where({id: 'LFBA'}),
            {autoCommit: false}
        );
        const result = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'}),
            {autoCommit: false}
        );
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.objRows[0].id, 'LFBA');
        assert.strictEqual(result.objRows[0].catalog, catalog);
        assert.notStrictEqual(result.objRows[0].catalog, oldCatalog);
        await connection.rollback();

        r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        assert.strictEqual(r.objRows[0].catalog, oldCatalog);
    });

    it('should commit a transaction when autoCommit is on', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.objRows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        const oldCatalog = r.objRows[0].catalog;
        let newCatalog = null;

        newCatalog = Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('airports', {Catalog: newCatalog}).where({id: 'LFBA'}),
            {autoCommit: true}
        );
        const result = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(result);
        assert.ok(result.objRows);
        assert.strictEqual(result.objRows[0].id, 'LFBA');
        assert.strictEqual(result.objRows[0].catalog, newCatalog);
        assert.notStrictEqual(result.objRows[0].catalog, oldCatalog);
        await connection.rollback();

        r = await adapterExecute(
            Select().from('airports').where({id: 'LFBA'})
        );
        assert.ok(r);
        assert.ok(r.objRows);
        assert.strictEqual(r.objRows[0].id, 'LFBA');
        assert.notStrictEqual(r.objRows[0].catalog, oldCatalog);
        assert.strictEqual(r.objRows[0].catalog, newCatalog);
    });

    it('should call startTransaction() more than one', async function () {
        connection = await adapter.connect(clientConfig);
        await connection.startTransaction();
        await connection.startTransaction();
    });

    it('should call commit() more than one', async function () {
        connection = await adapter.connect(clientConfig);
        await connection.startTransaction();
        await connection.commit();
        await connection.commit();
    });

    it('should call rollback() more than one', async function () {
        connection = await adapter.connect(clientConfig);
        await connection.startTransaction();
        await connection.rollback();
        await connection.rollback();
    });

}

export function getInsertSQLsForTestData(opts?: {
    schema?: string,
    stringifyValueForSQL?: (v: any) => string;
}) {
    const result: { table: string, scripts: string[] }[] = [];
    const repositoryRoot = path.resolve(__dirname, '../../../..');

    const dataFiles: any[] = [
        JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'support/test-data', 'regions.json'), 'utf8')),
        JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'support/test-data', 'airports.json'), 'utf8')),
        JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'support/test-data', 'customers.json'), 'utf8'))
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
