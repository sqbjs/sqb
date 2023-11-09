import path from 'path';
import { MigrationPackageAsync } from '../../src/index.js';

export const Test2MigrationPackage: MigrationPackageAsync = {
  name: 'Test',
  migrations: [path.join(__dirname, 'test2/**/*')]
};
