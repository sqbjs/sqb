/* eslint-disable camelcase */
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
    let lastInsertId;
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
        const q = query.generate({dialect: adapter.dialect, params: opts?.params});
        const result: any = await connection.execute({
            ...opts,
            sql: q.sql,
            params: q.params,
            returningFields: q.returningFields,
            autoCommit: !(opts?.autoCommit === false)
        });
        if (result.rows) {
            result.objRows = result.rows.reduce((target, row) => {
                const r: any = {};
                for (const [i, f] of result.fields.entries()) {
                    r[f.fieldName.toLowerCase()] = result.rowType === 'array' ?
                        row[i] : row[f.fieldName];
                }
                target.push(r);
                return target;
            }, []);
        }

        return result;
    }

    it('should create connection instance with ' + adapter.driver + ' driver', async function () {
        this.timeout(10000);
        this.slow(2000);
        connection = await adapter.connect(clientConfig);
        assert.ok(connection);
    });

    it('should execute a select query and return fields and rows (objectRows=false)', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('customers').orderBy('id');
        const result = await adapterExecute(query, {objectRows: false});
        assert.ok(result);
        assert.ok(result.rows && result.rows.length);
        assert.ok(result.rowType);
        assert.ok(result.fields);
        assert.strictEqual(result.objRows[0].id, 1);
    });

    it('should execute a select query and return fields and rows (objectRows=true)', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('customers').orderBy('id');
        const result = await adapterExecute(query, {objectRows: true});
        assert.ok(result);
        assert.ok(result.rows && result.rows.length);
        assert.ok(result.rowType);
        assert.ok(result.fields);
        assert.strictEqual(result.objRows[0].id, 1);
    });

    it('should return cursor', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('customers').orderBy('id');
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
            assert.strictEqual(rows[0][0], 1);
        else
            assert.strictEqual(rows[0][result.fields[0].fieldName], 1);
    });

    it('should fetchRows option limit row count', async function () {
        connection = await adapter.connect(clientConfig);
        const query = Select('id').from('customers').orderBy('id');
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
        const givenName = 'X' + Math.floor(Math.random() * 1000000);
        const familyName = 'X' + Math.floor(Math.random() * 1000000);
        const query = Insert('customers', {
            given_name: givenName,
            family_name: familyName
        }).returning('id');
        const result = await adapterExecute(query, {
            autoCommit: true,
            objectRows: false
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rowsAffected, 1);
        assert.ok(result.objRows[0].id > 0);
        lastInsertId = result.objRows[0].id;
    });

    it('should execute script with parameters', async function () {
        connection = await adapter.connect(clientConfig);
        const givenName = 'X' + Math.floor(Math.random() * 1000000);
        const familyName = 'X' + Math.floor(Math.random() * 1000000);
        const query = Insert('customers', {
            given_name: Param('givenName'),
            family_name: Param('familyName')
        }).returning('id', 'given_name', 'family_name');
        const result = await adapterExecute(query, {
            autoCommit: true,
            params: {givenName, familyName}
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rowsAffected, 1);
        assert.ok(result.objRows[0].id > 0);
        assert.strictEqual(result.objRows[0].given_name, givenName);
        assert.strictEqual(result.objRows[0].family_name, familyName);
    });

    it('should update record with returning', async function () {
        connection = await adapter.connect(clientConfig);
        const city = 'X' + Math.floor(Math.random() * 10000);
        const query = Update('customers', {city})
            .where({id: lastInsertId})
            .returning('city');
        const result = await adapterExecute(query, {
            autoCommit: true,
            objectRows: false
        });
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.rowsAffected, 1);
        assert.strictEqual(result.objRows[0].city, city);
    });

    it('should commit a transaction', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        const oldCity = r.objRows[0].city;

        await connection.startTransaction();

        const newCity = 'X' + Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('customers', {city: newCity}).where({id: lastInsertId}),
            {autoCommit: false}
        );
        const result = await adapterExecute(
            Select().from('customers').where({id: lastInsertId}),
            {autoCommit: false}
        );
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.objRows[0].id, lastInsertId);
        assert.strictEqual(result.objRows[0].city, newCity);
        assert.notStrictEqual(result.objRows[0].city, oldCity);
        await connection.commit();

        r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        assert.notStrictEqual(r.objRows[0].city, oldCity);
        assert.strictEqual(r.objRows[0].city, newCity);
    });

    it('should rollback a transaction', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.objRows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        const oldCity = r.objRows[0].city;


        await connection.startTransaction();
        const city = 'X' + Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('customers', {city}).where({id: lastInsertId}),
            {autoCommit: false}
        );
        const result = await adapterExecute(
            Select().from('customers').where({id: lastInsertId}),
            {autoCommit: false}
        );
        assert.ok(result);
        assert.ok(result.objRows);
        assert.strictEqual(result.objRows[0].id, lastInsertId);
        assert.strictEqual(result.objRows[0].city, city);
        assert.notStrictEqual(result.objRows[0].city, oldCity);
        await connection.rollback();

        r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        assert.strictEqual(r.objRows[0].city, oldCity);
    });

    it('should start transaction when autoCommit is off', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        const oldCity = r.objRows[0].city;

        const city = 'X' + Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('customers', {city}).where({id: lastInsertId}),
            {autoCommit: false}
        );
        const result = await adapterExecute(
            Select().from('customers').where({id: lastInsertId}),
            {autoCommit: false}
        );
        assert.ok(result);
        assert.ok(result.rows);
        assert.strictEqual(result.objRows[0].id, lastInsertId);
        assert.strictEqual(result.objRows[0].city, city);
        assert.notStrictEqual(result.objRows[0].city, oldCity);
        await connection.rollback();

        r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.rows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        assert.strictEqual(r.objRows[0].city, oldCity);
    });

    it('should commit a transaction when autoCommit is on', async function () {
        connection = await adapter.connect(clientConfig);
        let r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.objRows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        const oldCity = r.objRows[0].city;
        const newCity = 'X' + Math.floor(Math.random() * 10000);
        await adapterExecute(
            Update('customers', {city: newCity}).where({id: lastInsertId}),
            {autoCommit: true}
        );
        const result = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(result);
        assert.ok(result.objRows);
        assert.strictEqual(result.objRows[0].id, lastInsertId);
        assert.strictEqual(result.objRows[0].city, newCity);
        assert.notStrictEqual(result.objRows[0].city, oldCity);
        await connection.rollback();

        r = await adapterExecute(
            Select().from('customers').where({id: lastInsertId})
        );
        assert.ok(r);
        assert.ok(r.objRows);
        assert.strictEqual(r.objRows[0].id, lastInsertId);
        assert.notStrictEqual(r.objRows[0].city, oldCity);
        assert.strictEqual(r.objRows[0].city, newCity);
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

    const dataFiles: any[] = ['continents', 'countries', 'customers', 'customer_tags'].map(f =>
        JSON.parse(fs.readFileSync(
            path.join(repositoryRoot, 'support/test-data', f + '.json'), 'utf8')));

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
