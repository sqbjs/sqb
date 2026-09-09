import { DatabaseSync } from 'node:sqlite';
import type { ClientConfiguration } from '@sqb/connect';
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DbMigrator, type DbMigratorOptions } from '../src/index.js';
import { Test1SqljsMigrationPackage } from './_support/test1-migrations.sqljs.js';
import { Test2SqljsMigrationPackage } from './_support/test2-migrations.sqljs.js';

describe('migrator:DbMigrator (sqljs)', () => {
  const infoSchema = '__migration_test';
  const dbFile = path.join(os.tmpdir(), 'sqb-migrator-test.sqljs');
  const connectionConfig: ClientConfiguration = {
    dialect: 'sqlite',
    driver: 'sqljs',
    database: dbFile,
  };
  const defaultOptions: Omit<DbMigratorOptions, 'migrationPackage'> = {
    connection: connectionConfig,
    infoSchema,
  };

  before(() => {
    fs.rmSync(dbFile, { force: true });
    // sql.js loads the whole file into memory at connect time and throws if
    // it doesn't already exist yet (unlike node:sqlite, which creates one) -
    // an empty, valid SQLite file has to be there up front.
    new DatabaseSync(dbFile).close();
  });

  after(() => {
    fs.rmSync(dbFile, { force: true });
  });

  // Re-opens the file fresh each time (rather than keeping one connection
  // open across the whole suite, like the sqlite spec does) specifically to
  // exercise SqljsMigrationAdapter's own persistence: sql.js never writes
  // back to disk on its own, so this is what proves close() actually
  // exported and saved the result of each migration run.
  function readTable(sql: string): any[] {
    const db = new DatabaseSync(dbFile);
    try {
      return db.prepare(sql).all();
    } finally {
      db.close();
    }
  }

  function tableExists(name: string): boolean {
    return (
      readTable(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`,
      ).length > 0
    );
  }

  it('should apply migrations', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1SqljsMigrationPackage,
      targetVersion: 10,
    });

    assert.strictEqual(tableExists('table1'), true);
    assert.strictEqual(tableExists('table2'), false);
  });

  it('should migrate to next version', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1SqljsMigrationPackage,
      targetVersion: 11,
    });

    assert.strictEqual(tableExists('table1'), true);
    assert.strictEqual(tableExists('table2'), true);
  });

  it('should insert data', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test1SqljsMigrationPackage,
      targetVersion: 12,
    });

    const rows = readTable(`SELECT id, name FROM table1 ORDER BY id`);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].id, 1);
    assert.strictEqual(rows[0].name, 'name1');
  });

  it('should apply migrations (migration file search, multi-statement script with a trigger)', async () => {
    const migrator = new DbMigrator();
    await migrator.execute({
      ...defaultOptions,
      migrationPackage: Test2SqljsMigrationPackage,
    });

    assert.strictEqual(tableExists('table3'), true);
    assert.strictEqual(tableExists('table4'), true);

    const rows = readTable(`SELECT id, name, active FROM table3 ORDER BY id`);
    assert.strictEqual(rows.length, 4);
    // active isn't provided by the insert-data task - the trigger's
    // NULL-check sets it to 1 after insert.
    assert.strictEqual(rows[0].active, 1);
  });

  it('should check target version is not lower than package min version', async () => {
    const migrator = new DbMigrator();
    await assert.rejects(
      () =>
        migrator.execute({
          ...defaultOptions,
          migrationPackage: Test1SqljsMigrationPackage,
          targetVersion: 1,
        }),
      /Version mismatch/,
    );
  });
});
