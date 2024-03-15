import { Field, Select, SerializationType, Upper } from '../../src/index.js';

describe('serialize "Upper"', function () {

  const options = {
    dialect: 'test',
    prettyPrint: false
  };

  it('should initialize Upper', function () {
    expect(Upper('A')._type,).toStrictEqual(SerializationType.UPPER_STATEMENT);
  });

  it('should serialize values', function () {
    const query = Select(
        Upper('ABC')
    ).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select upper('ABC') from table1`);
  });

  it('should serialize Field names', function () {
    const query = Select(
        Upper(Field('a'))
    ).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select upper(a) from table1`);
  });

  it('should serialize sub query', function () {
    const query = Select(
        Upper(Select().from('table2'))
    ).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select upper((select * from table2)) from table1`);
  });

  it('should serialize alias', function () {
    const query = Select(
        Upper(1).as('col1')
    ).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual('select upper(1) col1 from table1');
  });

});
