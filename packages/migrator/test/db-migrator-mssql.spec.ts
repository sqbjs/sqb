import type { ClientConfiguration } from '@sqb/connect';
import assert from 'assert';
import sql from 'mssql';
import { DbMigrator, type DbMigratorOptions } from '../src/index.js';
import { Test1MssqlMigrationPackage } from './_support/test1-migrations.mssql.js';
import { Test2MssqlMigrationPackage } from './_support/test2-migrations.mssql.js';

describe('migrator:DbMigrator (mssql)', () => {
  const schema = 'migrator_test';
  const infoSchema = '__migration_test';
  const connectionConfig: ClientConfiguration = {
    dialect: 'mssql',
    host: process.env.MSSQL_HOST || 'localhost',
    port: process.env.MSSQL_PORT
      ? parseInt(process.env.MSSQL_PORT, 10)
      : undefined,
    user: process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || 'Sqb_Test_2024!',
    database: schema,
    driverOptions: {
      options: { encrypt: false, trustServerCertificate: true },
    },
  };
  const defaultOptions: Omit<DbMigratorOptions, 'migrationPackage'> = {
    connection: connectionConfig,
    infoSchema,
  };
  let pool: sql.ConnectionPool;

  before(async function () {
    this.timeout(30000);
    pool = new sql.ConnectionPool({
      server: connectionConfig.host as string,
      port: connectionConfig.port,
      user: connectionConfig.user,
      password: connectionConfig.password,
      options: { encrypt: false, trustServerCertificate: true },
    });
    await pool.connect();
    // Fresh, dedicated database for this test run - kept separate from
    // whatever database @sqb/mssql's own adapter tests use, since those
    // recreate their own database from scratch too.
    await pool.request().query(`
      IF DB_ID('${schema}') IS NOT NULL
      BEGIN
        ALTER DATABASE [${schema}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${schema}];
      END
    `);
    await pool.request().query(`CREATE DATABASE [${schema}]`);
  });

  after(async () => {
    await pool.close();
  });

  async function tableExists(name: string): Promise<boolean> {
    const r = await pool
      .request()
      .input('schema', sql.VarChar, schema)
      .input('name', sql.VarChar, name).query<any>(`
        USE [${schema}];
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @name
      `);
    return !!r.recordset.length;
  }

  it('should apply migrations', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1MssqlMigrationPackage,
      targetVersion: 10,
    });

    assert.strictEqual(await tableExists('table1'), true);
    assert.strictEqual(await tableExists('table2'), false);
  });

  it('should migrate to next version', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1MssqlMigrationPackage,
      targetVersion: 11,
    });

    assert.strictEqual(await tableExists('table1'), true);
    assert.strictEqual(await tableExists('table2'), true);
  });

  it('should insert data', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1MssqlMigrationPackage,
      targetVersion: 12,
    });

    const r = await pool
      .request()
      .query<any>(`SELECT id, name FROM [${schema}].dbo.table1 ORDER BY id`);
    assert.strictEqual(r.recordset.length, 2);
    assert.strictEqual(r.recordset[0].id, 1);
    assert.strictEqual(r.recordset[0].name, 'name1');
  });

  it('should apply migrations (migration file search, GO-separated batches with a trigger)', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test2MssqlMigrationPackage,
    });

    assert.strictEqual(await tableExists('table3'), true);
    assert.strictEqual(await tableExists('table4'), true);

    const r = await pool
      .request()
      .query<any>(
        `SELECT id, name, active FROM [${schema}].dbo.table3 ORDER BY id`,
      );
    assert.strictEqual(r.recordset.length, 4);
    // active isn't provided by the insert-data task - the trigger's
    // NULL-check sets it to 1 after insert.
    assert.strictEqual(r.recordset[0].active, 1);
  });

  it('should check target version is not lower than package min version', async () => {
    const migrator = new DbMigrator();
    await assert.rejects(
      () =>
        migrator.execute({
          ...defaultOptions,
          migrationPackage: Test1MssqlMigrationPackage,
          targetVersion: 1,
        }),
      /Version mismatch/,
    );
  });
});
