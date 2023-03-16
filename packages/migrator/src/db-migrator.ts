import fs from 'node:fs';
import path from 'node:path';
import {Connection, stringifyValueForSQL} from 'postgresql-client';
import {loadTaskFiles} from './load-task-files.js';
import {InsertDataMigrationTask, Migration, MigrationPackage} from './types.js';

export interface MigrationExecuteOptions {
    connection: Connection;
    migrationPackage: MigrationPackage;
    schema: string;
    owner?: string;
    tablespace?: string;
    targetVersion?: number;
    eventListener?: (event: string, ...args: any[]) => void;
}

interface LoadedMigrationPackage {
    minVersion: number;
    maxVersion: number;
    migrations: Migration[];
}

const ignoreEventListener = () => 0;

export class DbMigrator {

    async execute(options: MigrationExecuteOptions): Promise<boolean> {

        const {connection, schema} = options;
        const migrationPackage = await DbMigrator.loadMigrationPackage(options.migrationPackage);

        const targetVersion: number = Math.min(options.targetVersion || Number.MAX_SAFE_INTEGER, migrationPackage.maxVersion);

        if (targetVersion && targetVersion < migrationPackage.minVersion)
            throw new Error(`Version mismatch. Target schema version (${targetVersion}) is lower than ` +
                `migration package min version (${migrationPackage.minVersion})`);

        const emit = options.eventListener || ignoreEventListener;

        const schemaInfo = await this._getSchemaInfo(options);

        if (schemaInfo.version && schemaInfo.version < migrationPackage.minVersion - 1)
            throw new Error(`This package can migrate starting from ${migrationPackage.minVersion - 1} but current version is ${schemaInfo.version}`);

        const {migrations} = migrationPackage;
        // calculate total scripts;
        const total = migrations
            .reduce((i, x) => i + x.tasks.length, 0);
        const needBackup = !!migrations.find(x => !!x.backup);

        emit('start');
        let task;
        try {
            await this._lockSchema();
            if (needBackup) {
                emit('backup');
                await this._backup();
            }

            await connection.execute(`update ${schema}.${schemaInfo.infTable} set status = 'migration'`);

            // Execute migration tasks
            for (const migration of migrations) {
                if (migration.version > targetVersion || schemaInfo.version >= migration.version)
                    continue;
                for (let index = 0; index < migration.tasks.length; index++) {
                    task = migration.tasks[index];
                    emit('processing', {task: task.title, total, index});
                    if ('fn' in task && typeof task.fn === 'function') {
                        await task.fn(connection);
                    } else if (task.script) {
                        const script = task.script.replace(/(\${(\w+)})/gi, (s, ...args: string[]): string => {
                            switch (args[1].toLowerCase()) {
                                case 'schema':
                                    return schema;
                                case 'owner':
                                    return schemaInfo.owner;
                                case 'tablespace':
                                    return schemaInfo.tablespace;
                            }
                            return s;
                        });
                        try {
                            await connection.execute(script);
                        } catch (e: any) {
                            e.message += `\n${task.title}`;
                            if (e.lineNr)
                                e.message += ` (${e.lineNr},${e.colNr}):\n` + e.line;
                            if (e.colNr)
                                e.message += '\n' + ' '.repeat(e.colNr - 1) + '^';
                            // noinspection ExceptionCaughtLocallyJS
                            throw e;
                        }
                    } else if ('tableName' in task) {
                        const script = DbMigrator.objectDataToSql({...task, schema});
                        await connection.execute(script);
                    }
                    emit('process', {task: task.title, total, index});
                }
            }

            await connection.query(`update ${schema}.${schemaInfo.infTable} set status = $1, schema_version = $2, ` +
                'updated_at = current_timestamp',
                {params: ['ready', targetVersion]});
        } catch (e) {
            if (needBackup) {
                emit('backup');
                await this._restore();
            }
            throw e;
        } finally {
            await this._unlockSchema();
        }
        emit('finish');
        return true;
    }

    static async loadMigrationPackage(pkg: MigrationPackage): Promise<LoadedMigrationPackage> {
        const migarr: (string | Migration)[] =
            typeof pkg.migrations === 'function' ? await pkg.migrations() : pkg.migrations;

        const migrations: Migration[] = [];
        for (const x of migarr) {
            if (typeof x === 'string')
                await locateMigrations(migrations, x);
            else
                migrations.push(x);
        }

        let minVersion = 0;
        let maxVersion = 0;
        migrations.sort((a, b) => a.version - b.version);
        for (const m of migrations) {
            minVersion = !minVersion ? m.version : Math.min(minVersion, m.version);
            maxVersion = Math.max(minVersion, m.version);
            for (const t of m.tasks) {
                if (typeof t === 'string') {
                    m.tasks = loadTaskFiles(t);
                }
            }
        }

        return {
            minVersion,
            maxVersion,
            migrations
        };
    }

    private async _lockSchema(): Promise<void> {
        // todo
    }

    private async _unlockSchema(): Promise<void> {
        // todo
    }

    private async _backup(): Promise<void> {
        // todo
    }

    private async _restore(): Promise<void> {
        // todo
    }

    private async _getSchemaInfo(options: MigrationExecuteOptions): Promise<{
        owner: string;
        tablespace: string;
        status: string;
        version: number;
        infTable: string;
    }> {
        const {connection, schema} = options;
        let owner: string = options.owner || 'postgres';
        let tablespace: string = options.tablespace || 'pg_default';
        let version = 0;
        let status = '';

        let r = await connection.query(
            'select schema_owner FROM information_schema.schemata WHERE schema_name = $1',
            {params: [schema], objectRows: true});
        if (r.rows && r.rows[0]) {
            owner = r.rows[0].schema_owner;
        } else {
            await connection.execute(`CREATE SCHEMA ${schema} AUTHORIZATION ${owner};`);
        }

        // Determine tablespace of schema
        const infTable = options.migrationPackage.informationTableName || '__schema_info';

        r = await connection.query('SELECT tablespace FROM pg_tables WHERE schemaname = $1 AND tablename = $2',
            {params: [schema, infTable], objectRows: true});
        if (r.rows && r.rows[0]) {
            tablespace = r.rows[0].tablespace || tablespace;
            r = await connection.query(`SELECT schema_version, status FROM ${schema}.${infTable}`, {objectRows: true});
            if (r.rows && r.rows[0]) {
                version = r.rows[0].schema_version;
                status = r.rows[0].status;
            }
        } else {
            // Create if not exists
            await connection.execute(`
CREATE TABLE ${schema}.${infTable}
(
    status varchar(16) not null,
    schema_version integer not null default 0,
    created_at timestamp without time zone not null default current_timestamp,
    updated_at timestamp without time zone
) TABLESPACE ${tablespace};
insert into ${schema}.${infTable} (status) values ('init');
      `);
            status = 'init';
        }

        return {
            infTable,
            tablespace,
            owner,
            version,
            status
        };
    }

    static objectDataToSql(task: InsertDataMigrationTask & { schema: string }): string {
        let sql = '';
        for (const rows of task.rows) {
            const keys = Object.keys(rows);
            sql += `insert into ${task.schema}.${task.tableName} (${keys}) values (`;
            for (let i = 0; i < keys.length; i++) {
                sql += (i ? ', ' : '') + stringifyValueForSQL(rows[keys[i]]);
            }
            sql += ');\n';
        }
        return sql;
    }

}

async function locateMigrations(trg: Migration[], dir: string): Promise<void> {

    for (const f of ['migration.ts', 'migration.js', 'migration.json']) {
        const filename = path.join(dir, f);
        if (fs.existsSync(filename)) {
            const x = await import(filename);
            const fileDir = path.dirname(filename);
            const obj = x.default || x;
            if (obj.version && obj.tasks) {
                const migration = {...obj};
                migration.tasks = obj.tasks.map(
                    k => (typeof k === 'string' ? path.resolve(fileDir, k) : k));
                trg.push(migration);
            }
            return;
        }
    }

    const files = fs.readdirSync(dir);
    for (const f of files) {
        const dirname = path.join(dir, f);
        if (fs.statSync(dirname).isDirectory()) {
            await locateMigrations(trg, dirname);
        }
    }
}
