import path from 'path';
import {MigrationPackage} from '../../src';

export const Test2MigrationPackage: MigrationPackage = {
  description: 'Test Migration',
  informationTableName: 'info',
  migrations: [path.join(__dirname, 'test2')]
};
