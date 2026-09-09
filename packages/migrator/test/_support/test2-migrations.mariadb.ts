import { getDirname } from 'cross-dirname';
import { MigrationPackageConfig } from '../../src/index.js';

export const Test2MariadbMigrationPackage: MigrationPackageConfig = {
  name: 'TestMariadb',
  baseDir: getDirname(),
  migrations: ['test2-mariadb/**/*'],
};
