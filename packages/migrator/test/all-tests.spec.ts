import assert from 'assert';
import {Connection} from 'postgresql-client';
import {DbMigrator} from '../src';
import {Test1MigrationPackage} from './_support/test1-migrations';
import {Test2MigrationPackage} from './_support/test2-migrations';

describe('DbMigrator', () => {
    let connection: Connection;
    const databaseName = 'emr_test';
    const schemaName = 'migration_test';

    before(async () => {
        connection = new Connection({database: 'postgres'});
        await connection.connect();
        const r = await connection.query('SELECT oid FROM pg_database WHERE datname = $1', {params: [databaseName]});
        if (!(r.rows && r.rows.length)) {
            await connection.execute('CREATE DATABASE ' + databaseName, {autoCommit: true});
        }
        await connection.close(0);
        connection = new Connection({database: databaseName});
        await connection.connect();
        await connection.execute(`drop schema if exists ${schemaName} cascade;`);
    });

    after(async () => {
        await connection.close(0);
    });

    it('should apply migrations', async () => {
        const migrator = new DbMigrator();
        await migrator.execute({
            connection,
            migrationPackage: Test1MigrationPackage,
            schema: schemaName,
            targetVersion: 10
        });

        let r = await connection.query('SELECT oid FROM pg_database WHERE datname = $1', {params: [databaseName]});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);

        r = await connection.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
            {params: [schemaName]});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], schemaName);

        r = await connection.query('SELECT table_name FROM information_schema.tables WHERE  table_schema = $1 AND table_name = $2',
            {params: [schemaName, 'table1']});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], 'table1');

        r = await connection.query('SELECT table_name FROM information_schema.tables WHERE  table_schema = $1 AND table_name = $2',
            {params: [schemaName, 'table2']});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 0);
    });

    it('should migrate to next version', async () => {
        const migrator = new DbMigrator();
        await migrator.execute({
            connection,
            migrationPackage: Test1MigrationPackage,
            schema: schemaName,
            targetVersion: 11
        });

        let r = await connection.query('SELECT oid FROM pg_database WHERE datname = $1', {params: [databaseName]});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);

        r = await connection.query('SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
            {params: [schemaName]});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], schemaName);

        r = await connection.query('SELECT table_name FROM information_schema.tables WHERE  table_schema = $1 AND table_name = $2',
            {params: [schemaName, 'table1']});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], 'table1');

        r = await connection.query('SELECT table_name FROM information_schema.tables WHERE  table_schema = $1 AND table_name = $2',
            {params: [schemaName, 'table2']});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], 'table2');
    });

    it('should insert data', async () => {
        const migrator = new DbMigrator();
        await migrator.execute({
            connection,
            migrationPackage: Test1MigrationPackage,
            schema: schemaName,
            targetVersion: 12
        });

        const r = await connection.query(`SELECT id, name FROM ${schemaName}.table1`);
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 2);
        assert.strictEqual(r.rows[0][0], 1);
        assert.strictEqual(r.rows[0][1], 'name1');
    });

    it('should apply migrations (migration file search)', async () => {
        const migrator = new DbMigrator();
        await migrator.execute({
            connection,
            migrationPackage: Test2MigrationPackage,
            schema: schemaName
        });

        let r = await connection.query('SELECT table_name FROM information_schema.tables WHERE  table_schema = $1 AND table_name = $2',
            {params: [schemaName, 'table3']});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], 'table3');

        r = await connection.query('SELECT table_name FROM information_schema.tables WHERE  table_schema = $1 AND table_name = $2',
            {params: [schemaName, 'table4']});
        assert.ok(r.rows);
        assert.strictEqual(r.rows?.length, 1);
        // @ts-ignore
        assert.strictEqual(r.rows[0][0], 'table4');

        r = await connection.query(`SELECT id, name FROM ${schemaName}.table3`);
        assert.ok(r.rows);
        assert.strictEqual(r.rows.length, 4);
    });

    it('should check target version is not lower than package min version', async () => {
        const migrator = new DbMigrator();
        await assert.rejects(() => migrator.execute({
            connection,
            migrationPackage: Test1MigrationPackage,
            schema: schemaName,
            targetVersion: 1
        }), /Version mismatch/);
    });

});
