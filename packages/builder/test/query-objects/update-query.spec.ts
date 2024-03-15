import { Eq, Param, Raw, Select, SerializationType, Update } from '../../src/index.js';

describe('Serialize update query', function () {

  const options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize UpdateQuery', function () {
    const q = Update('table1', {id: 1});
    expect(q && q._type).toStrictEqual(SerializationType.UPDATE_QUERY);
  });

  it('should serialize update', function () {
    const query = Update('table1', {id: 2, name: 'aaa'})
        .where(Eq('id', 1));
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('update table1 set id = 2, name = \'aaa\' where id = 1');
  });

  it('should pass raw as table name', function () {
    const query = Update(Raw('table1'), {id: 2, name: 'aaa'})
        .where(Eq('id', 1));
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('update table1 set id = 2, name = \'aaa\' where id = 1');
  });

  it('should use select query as value', function () {
    const query = Update('table1', {id: 2, name: Select('name').from('table2')})
        .where(Eq('id', 1));
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('update table1 set id = 2, name = (select name from table2) where id = 1');
  });

  it('should validate first (tableName) argument', function () {
    expect(() =>
        // @ts-ignore
        Update(null, {id: 1, name: 'aaa'})
    ).toThrow('required as first argument');
  });

  it('should validate second (values) argument', function () {
    expect(() =>
        Update('table1', [1, 'aaa'])
    ).toThrow('instance required as second argument');
    expect(() =>
        Update('table1', 'sdfds')
    ).toThrow('instance required as second argument');
  });

  it('should serialize params with "values" argument: COLON', function () {
    const query = Update('table1', {id: Param('id'), name: Param('name')});
    const result = query.generate(Object.assign({
      params: {
        id: 1,
        name: 'Abc'
      }, ...options
    }, options));
    expect(result.sql).toStrictEqual('update table1 set id = :id, name = :name');
    expect(result.params).toStrictEqual({
      id: 1,
      name: 'Abc'
    });
  });

  it('should serialize params with query.params', function () {
    const query = Update('table1', {id: Param('id'), name: Param('name')})
        .values({
          id: 1,
          name: 'Abc'
        });
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('update table1 set id = :id, name = :name');
    expect(result.params).toStrictEqual({
      id: 1,
      name: 'Abc'
    });
  });

  it('should validate query.params', function () {
    expect(() =>
        Update('table1', {id: Param('id'), name: /name/})
            .values([1, 'Abc'])
    ).toThrow('Invalid argument');
  });

  it('should serialize update with returning', function () {
    const query = Update('table1', {id: 1, name: 'aaa'})
        .returning('id', 'name as n');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(
        'update table1 set id = 1, name = \'aaa\' returning id, name as n');
  });

});
