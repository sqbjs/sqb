import path from 'path';
import {MigrationPackage} from '../../src/index.js';

export const Test2MigrationPackage: MigrationPackage = {
  description: 'Test Migration',
  informationTableName: 'info',
  migrations: [path.join(__dirname, 'test2')]
};
