import { getDirname } from 'cross-dirname';
import { MigrationPackageConfig } from '../../src/index.js';

export const Test2MysqlMigrationPackage: MigrationPackageConfig = {
  name: 'TestMysql',
  baseDir: getDirname(),
  migrations: ['test2-mysql/**/*'],
};
