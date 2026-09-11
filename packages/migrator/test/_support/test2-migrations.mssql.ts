import { getDirname } from 'cross-dirname';
import { MigrationPackageConfig } from '../../src/index.js';

export const Test2MssqlMigrationPackage: MigrationPackageConfig = {
  name: 'TestMssql',
  baseDir: getDirname(),
  migrations: ['test2-mssql/**/*'],
};
