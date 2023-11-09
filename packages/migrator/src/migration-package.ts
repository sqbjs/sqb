import glob from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import { StrictOmit } from 'ts-gems';
import type { MigrationAdapter } from './migration-adapter.js';
import { getCallingFilename } from './utils/get-calling-filename.js';

export interface MigrationPackage {
  name: string;
  description?: string;
  migrations: Migration[];
  informationTableName?: string;
}

export interface Migration {
  version: number;
  tasks: MigrationTask[];
  dirname?: string;
  backup?: boolean;
}

export type MigrationTask = SqlScriptMigrationTask | CustomMigrationTask | InsertDataMigrationTask;

export interface BaseMigrationTask {
  title: string;
  filename?: string;
}

export interface SqlScriptMigrationTask extends BaseMigrationTask {
  title: string;
  script: string;
}

export interface InsertDataMigrationTask extends BaseMigrationTask {
  title: string;
  tableName: string;
  rows: Record<string, any>[];
}

export interface CustomMigrationTask extends BaseMigrationTask {
  title: string;
  fn: (connection: any, adapter: MigrationAdapter) => void | Promise<void>;
}

export function isSqlScriptMigrationTask(x: any): x is SqlScriptMigrationTask {
  return typeof x === 'object' && typeof x.script === 'string';
}

export function isInsertDataMigrationTask(x: any): x is InsertDataMigrationTask {
  return typeof x === 'object' &&
      typeof x.tableName === 'string' &&
      Array.isArray(x.rows);
}

export function isCustomMigrationTask(x: any): x is CustomMigrationTask {
  return typeof x === 'object' &&
      typeof x.fn === 'function';
}

export interface MigrationPackageAsync extends StrictOmit<MigrationPackage, 'migrations'> {
  migrations: (
      string |
      MigrationAsync |
      (() => MigrationAsync) |
      (() => Promise<MigrationAsync>)
      )[];
}

export interface MigrationAsync extends StrictOmit<Migration, 'tasks'> {
  tasks: (
      string |
      MigrationTask |
      (() => MigrationTask) |
      (() => Promise<MigrationTask>)
      )[];
}


export namespace MigrationPackage {

  export async function load(asyncConfig: MigrationPackageAsync): Promise<MigrationPackage> {
    const out: MigrationPackage = {
      ...asyncConfig,
      migrations: []
    }

    if (!Array.isArray(asyncConfig.migrations))
      throw new TypeError('You must provide array of MigrationConfig in "migrations" property');

    const baseDir = path.dirname(getCallingFilename(1));

    if (asyncConfig.migrations?.length) {
      const srcMigrations: MigrationAsync[] = [];
      const trgMigrations: Migration[] = [];
      out.migrations = trgMigrations;
      let x: any;
      for (x of asyncConfig.migrations) {
        x = typeof x === 'function' ? await x() : x;
        if (typeof x === 'object' && x.tasks)
          srcMigrations.push(x);
        else if (typeof x === 'string') {
          srcMigrations.push(...await loadMigrations(path.resolve(baseDir, x.replace(/\\/g, '/'))));
        }
      }

      srcMigrations.sort((a, b) => a.version - b.version);

      for (const migration of srcMigrations) {
        const trgMigration: Migration = {...migration, tasks: []};
        trgMigrations.push(trgMigration);
        const srcTasks = migration.tasks;
        trgMigration.tasks = [];
        for (const t of srcTasks) {
          if (typeof t === 'object') {
            trgMigration.tasks.push(t);
          } else if (typeof t === 'string') {
            let pattern = t.replace(/\\/g, '/');
            pattern = path.resolve(migration.dirname || baseDir, pattern);
            const files = await glob(pattern, {
              absolute: true,
              onlyFiles: true
            });
            files.sort();
            for (const filename of files) {
              const ext = path.extname(filename).toLowerCase();
              if (!path.basename(filename, ext).endsWith('.task'))
                continue;
              if (ext === '.sql') {
                const script = await fs.readFile(filename, 'utf-8');
                trgMigration.tasks.push({
                  title: path.basename(filename),
                  filename,
                  script
                } satisfies SqlScriptMigrationTask);
              } else if (ext === '.json') {
                try {
                  const json: any = JSON.parse(await fs.readFile(filename, 'utf-8'));
                  if (typeof json !== 'object')
                    continue;
                  if (json.script) {
                    json.title = json.title || 'Run sql script';
                    json.filename = filename;
                    trgMigration.tasks.push(json satisfies SqlScriptMigrationTask);
                    continue;
                  }
                  if (json.tableName && json.rows) {
                    json.title = json.title || 'Migrate data into ' + json.tableName;
                    json.filename = filename;
                    trgMigration.tasks.push(json satisfies InsertDataMigrationTask);
                    continue;
                  }
                  if (typeof json.fn === 'function') {
                    json.title = json.title || 'Run custom function';
                    json.filename = filename;
                    trgMigration.tasks.push(json satisfies CustomMigrationTask);
                  }
                } catch (e: any) {
                  e.message = `Error in ${filename}\n` + e.message;
                  throw e;
                }
              }
            }
          }
        }
      }
    }

    return out;
  }

  async function loadMigrations(pattern: string): Promise<Migration[]> {
    const out: Migration[] = [];
    const files = await glob(pattern, {absolute: true, onlyFiles: true});
    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase();
      if (path.basename(filename, ext) !== 'migration')
        continue;
      let json: any;
      if (['.js', '.ts', '.cjs', '.mjs'].includes(ext)) {
        json = await import(filename);
        if (json.__esModule)
          json = json.default;
      } else if (ext === '.json') {
        try {
          json = JSON.parse(await fs.readFile(filename, 'utf-8'));
        } catch (e: any) {
          e.message = `Error in ${filename}\n` + e.message;
          throw e;
        }
      }
      if (json && typeof json === 'object' && json.version && Array.isArray(json.tasks)) {
        json.dirname = path.dirname(filename);
        out.push(json);
      }
    }
    return out;
  }

}

