import { MigrationPackageConfig } from '../../src/index.js';

export const Test2MigrationPackage: MigrationPackageConfig = {
  name: 'Test',
  baseDir: __dirname,
  migrations: ['test2/**/*']
};
