import { getDirname } from 'cross-dirname';
import { MigrationPackageConfig } from '../../src/index.js';

export const Test2OracleMigrationPackage: MigrationPackageConfig = {
  name: 'TestOracle',
  baseDir: getDirname(),
  migrations: ['test2-oracle/**/*'],
};
