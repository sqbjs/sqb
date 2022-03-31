import path from 'path';
import {MigrationPackage} from '../../src';

export const Test1MigrationPackage: MigrationPackage = {
  description: 'Test Migration',
  informationTableName: 'info',
  migrations: [{
    version: 10,
    tasks: [path.join(__dirname, 'test1', 'v010.sql')]
  },
    {
      version: 11,
      tasks: [path.join(__dirname, 'test1', 'v011.sql')]
    },
    {
      version: 12,
      tasks: [{
        title: 'Insert data to table1',
        tableName: 'table1',
        rows: [{id: 1, name: 'name1'}, {id: 2, name: 'name2'}]
      }]
    }
  ]
};
