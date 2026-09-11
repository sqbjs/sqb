import type { ClientConfiguration } from '@sqb/connect';
import assert from 'assert';
import mysql from 'mysql2/promise';
import { DbMigrator, type DbMigratorOptions } from '../src/index.js';
import { Test1MysqlMigrationPackage } from './_support/test1-migrations.mysql.js';
import { Test2MysqlMigrationPackage } from './_support/test2-migrations.mysql.js';

describe('migrator:DbMigrator (mysql)', () => {
  const schema = 'migrator_test';
  const infoSchema = '__migration_test';
  const connectionConfig: ClientConfiguration = {
    dialect: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT
      ? parseInt(process.env.MYSQL_PORT, 10)
      : undefined,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: schema,
  };
  const defaultOptions: Omit<DbMigratorOptions, 'migrationPackage'> = {
    connection: connectionConfig,
    infoSchema,
  };
  let connection: mysql.Connection;

  before(async function () {
    this.timeout(30000);
    connection = await mysql.createConnection({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      password: connectionConfig.password,
    });
    // Fresh, dedicated databases for this test run - kept separate from
    // whatever database @sqb/mysql's own adapter tests use, since those
    // recreate their own database from scratch too.
    await connection.query(`DROP DATABASE IF EXISTS \`${schema}\``);
    await connection.query(`CREATE DATABASE \`${schema}\``);
    await connection.query(`DROP DATABASE IF EXISTS \`${infoSchema}\``);
  });

  after(async () => {
    await connection.end();
  });

  async function tableExists(name: string): Promise<boolean> {
    const [rows] = await connection.query<any>(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [schema, name],
    );
    return !!rows.length;
  }

  it('should apply migrations', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1MysqlMigrationPackage,
      targetVersion: 10,
    });

    assert.strictEqual(await tableExists('table1'), true);
    assert.strictEqual(await tableExists('table2'), false);
  });

  it('should migrate to next version', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1MysqlMigrationPackage,
      targetVersion: 11,
    });

    assert.strictEqual(await tableExists('table1'), true);
    assert.strictEqual(await tableExists('table2'), true);
  });

  it('should insert data', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1MysqlMigrationPackage,
      targetVersion: 12,
    });

    const [rows] = await connection.query<any>(
      `SELECT id, name FROM \`${schema}\`.table1 ORDER BY id`,
    );
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].id, 1);
    assert.strictEqual(rows[0].name, 'name1');
  });

  it('should apply migrations (migration file search, multi-statement script with a trigger)', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test2MysqlMigrationPackage,
    });

    assert.strictEqual(await tableExists('table3'), true);
    assert.strictEqual(await tableExists('table4'), true);

    const [rows] = await connection.query<any>(
      `SELECT id, name, active FROM \`${schema}\`.table3 ORDER BY id`,
    );
    assert.strictEqual(rows.length, 4);
    // active isn't provided by the insert-data task - either the column's
    // own DEFAULT or the trigger's NULL-check sets it to 1.
    assert.strictEqual(rows[0].active, 1);
  });

  it('should check target version is not lower than package min version', async () => {
    const migrator = new DbMigrator();
    await assert.rejects(
      () =>
        migrator.execute({
          ...defaultOptions,
          migrationPackage: Test1MysqlMigrationPackage,
          targetVersion: 1,
        }),
      /Version mismatch/,
    );
  });
});
