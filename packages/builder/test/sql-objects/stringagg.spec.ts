import { Field, Select, SerializationType, StringAGG } from '../../src/index.js';

describe('serialize "StringAGG"', function () {
  const options = {
    dialect: 'test',
    prettyPrint: false,
  };

  it('should initialize StringAGG', function () {
    expect(StringAGG('A')._type).toStrictEqual(SerializationType.STRINGAGG_STATEMENT);
  });

  it('should serialize values', function () {
    const query = Select(StringAGG('ABC')).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select string_agg(ABC,',') from table1`);
  });

  it('should serialize Field names', function () {
    const query = Select(StringAGG(Field('a'))).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select string_agg(a,',') from table1`);
  });

  it('should serialize sub query', function () {
    const query = Select(StringAGG(Select().from('table2'))).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select string_agg((select * from table2),',') from table1`);
  });

  it('should serialize alias', function () {
    const query = Select(StringAGG(Field('a')).as('col1')).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select string_agg(a,',') col1 from table1`);
  });

  it('should serialize delimiter', function () {
    const query = Select(StringAGG(Field('a')).delimiter('&')).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select string_agg(a,'&') from table1`);
  });

  it('should serialize order by', function () {
    const query = Select(StringAGG(Field('a')).delimiter('&').orderBy('a', 'b')).from('table1');
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(`select string_agg(a,'&' order by a, b) from table1`);
  });
});
