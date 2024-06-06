import { Param, registerSerializer, Select, unRegisterSerializer } from '@sqb/builder';
import { MSSqlSerializer } from '../src/ms-sql-serializer.js';

describe('MSSqlSerializer', function () {
  const mssqlSerializer = new MSSqlSerializer();
  beforeAll(() => registerSerializer(mssqlSerializer));
  afterAll(() => unRegisterSerializer(mssqlSerializer));

  it('should serialize "limit"', function () {
    const query = Select().from('table1').as('t1').limit(10);
    const result = query.generate({ dialect: 'mssql' });
    expect(result.sql).toStrictEqual('select * from table1 FETCH NEXT 10 ROWS ONLY');
  });

  it('should serialize "limit" pretty print', function () {
    const query = Select().from('table1').as('t1').limit(10);
    const result = query.generate({ dialect: 'mssql', prettyPrint: true });
    expect(result.sql).toStrictEqual('select * from table1\n' + 'FETCH NEXT 10 ROWS ONLY');
  });

  it('should serialize "limit/offset"', function () {
    const query = Select().from('table1').offset(4).limit(10);
    const result = query.generate({
      dialect: 'mssql',
      prettyPrint: true,
    });
    expect(result.sql).toStrictEqual('select * from table1\n' + 'OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
  });

  it('should serialize "limit/offset" pretty print', function () {
    const query = Select().from('table1').offset(4).limit(10);
    const result = query.generate({
      dialect: 'mssql',
      prettyPrint: true,
    });
    expect(result.sql).toStrictEqual('select * from table1\n' + 'OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
  });

  it('Should serialize params', function () {
    const query = Select()
      .from('table1')
      .where({ ID: Param('ID') });
    const result = query.generate({
      dialect: 'mssql',
      params: { ID: 5 },
    });
    expect(result.sql).toStrictEqual('select * from table1 where ID = @ID');
    expect(result.params).toStrictEqual({ ID: 5 });
  });
});
