import { Delete, Eq, Raw, SerializationType } from '../../src/index.js';

describe('Serialize delete query', function () {

  const options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize DeleteQuery', function () {
    const q = Delete('table1');
    expect(q && q._type).toStrictEqual(SerializationType.DELETE_QUERY);
  });

  it('should serialize delete', function () {
    const query = Delete('table1')
        .where(Eq('id', 1));
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('delete from table1 where id = 1');
  });

  it('should pass raw as table name', function () {
    const query = Delete(Raw('table1'));
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('delete from table1');
  });

  it('should validate first (tableName) argument', function () {
    expect(
        // @ts-ignore
        () => Delete(null)
    ).toThrow('required as first argument');
  });

});
