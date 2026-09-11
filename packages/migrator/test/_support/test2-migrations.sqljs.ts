import { getDirname } from 'cross-dirname';
import { MigrationPackageConfig } from '../../src/index.js';

export const Test2SqljsMigrationPackage: MigrationPackageConfig = {
  name: 'TestSqljs',
  baseDir: getDirname(),
  migrations: ['test2-sqljs/**/*'],
};
