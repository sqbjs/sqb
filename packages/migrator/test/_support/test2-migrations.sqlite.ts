import { getDirname } from 'cross-dirname';
import { MigrationPackageConfig } from '../../src/index.js';

export const Test2SqliteMigrationPackage: MigrationPackageConfig = {
  name: 'TestSqlite',
  baseDir: getDirname(),
  migrations: ['test2-sqlite/**/*'],
};
