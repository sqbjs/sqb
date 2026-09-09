<p style="text-align:center">
  <img src="https://user-images.githubusercontent.com/3836517/32965280-1a2b63ce-cbe7-11e7-8ee1-ba47313503c5.png" width="500px" alt="SQB Logo"/>
</p>

<br>

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![CI Tests][ci-test-image]][ci-test-url]
[![Test Coverage][coveralls-image]][coveralls-url]

## About SQB

SQB is an extensible, multi-dialect SQL query builder and Database connection wrapper for NodeJS.

## About @sqb/migrator

`@sqb/migrator` is a schema/data migration runner for SQB. A `MigrationPackage` describes an
ordered set of versioned migrations, each made up of one or more tasks:

- a raw SQL script (a `.sql` file, or an inline string/function),
- a data-insert task (`{ tableName, rows }`), or
- a custom function that runs arbitrary code against the connection.

Migrations and tasks can be declared inline or discovered from disk via glob patterns (e.g.
`v*/migration.json` + `*.task.sql`). `DbMigrator.execute()` loads the package, compares its
migrations against the target database's tracked version, and applies everything up to an
optional `targetVersion` in order — recording progress (and per-task success/error events) in a
`migration_summary` / `migration_events` table pair it creates automatically. Migration scripts
can reference `$(schema)`, `$(tablespace)` and other variables that get substituted per-run.

```ts
import { DbMigrator } from '@sqb/migrator';

const migrator = new DbMigrator();
await migrator.execute({
  connection: { dialect: 'postgres', database: 'mydb' },
  migrationPackage: {
    name: 'my-app',
    migrations: ['migrations/v*/migration.json'],
  },
});
```

PostgreSQL, Oracle, and MySQL are supported today, via the bundled `PgMigrationAdapter`,
`OracleMigrationAdapter`, and `MysqlMigrationAdapter`. The Oracle and MySQL adapters have a few
dialect-driven differences worth knowing:

- **No schema auto-creation on Oracle.** An Oracle "schema" *is* a user, and provisioning one is a
  DBA-level operation this adapter deliberately doesn't attempt. `infoSchema` (if given) is only
  used as a table-name prefix for the bookkeeping tables — that schema/user must already exist.
  MySQL has no such restriction — `CREATE SCHEMA IF NOT EXISTS` is just `CREATE DATABASE`, so the
  MySQL adapter auto-creates `infoSchema` the same way the PostgreSQL adapter does.
- **Multi-statement `.sql` scripts follow the standard SQL\*Plus convention on Oracle**: a PL/SQL
  block (a trigger, procedure, function, package body, or a bare `BEGIN`/`DECLARE` block) is
  terminated by a lone `/` on its own line; everything else is plain DDL/DML, `;`-separated — this
  is required because `oracledb` runs exactly one statement per call, unlike `postgrejs`, which
  runs a whole multi-statement script at once. MySQL scripts need no such splitting — the
  connection is opened with `multipleStatements` enabled, and the server's own parser correctly
  treats a trigger/procedure body's internal `;`s as part of one statement.
- **Locking is best-effort on Oracle, native on MySQL.** Both Oracle and MySQL DDL always
  implicitly commits, which would release a transaction-held lock the instant a migration's first
  `CREATE`/`ALTER` ran. The Oracle adapter uses `DBMS_LOCK` instead (unaffected by that), and falls
  back to running unprotected if it isn't grantable in your environment. The MySQL adapter uses
  the native, session-scoped `GET_LOCK`/`RELEASE_LOCK` functions, which need no special grant.

## Main goals

- Single code base for any sql based database
- Powerful and simplified query coding scheme
- Fast applications with low memory requirements
- Let applications work with large data tables efficiently
- Support latest JavaScript language standards
- Lightweight and extensible framework.

You can report bugs and discuss features on the [GitHub issues](https://github.com/sqbjs/sqb/issues) page

Thanks to all of the great [contributions](https://github.com/sqbjs/sqb/graphs/contributors) to the project.

You may want to check detailed [DOCUMENTATION](https://sqbjs.github.io/sqb/)

## Installation

```bash
$ npm install @sqb/migrator --save
```

## Node Compatibility

- node >= 20.x

### License

SQB is available under [MIT](LICENSE) license.

[npm-image]: https://img.shields.io/npm/v/@sqb/migrator.svg
[npm-url]: https://npmjs.org/package/@sqb/migrator
[downloads-image]: https://img.shields.io/npm/dm/@sqb/migrator.svg
[downloads-url]: https://npmjs.org/package/@sqb/migrator
[ci-test-image]: https://github.com/panates/sqb/actions/workflows/test.yml/badge.svg
[ci-test-url]: https://github.com/panates/sqb/actions/workflows/test.yml
[coveralls-image]: https://coveralls.io/repos/github/sqbjs/sqb/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/sqbjs/sqb?branch=master
