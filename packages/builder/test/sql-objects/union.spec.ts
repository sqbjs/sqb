import { Select, SerializationType, Union, UnionAll } from '../../src/index.js';

describe('serialize "Union"', function () {

  const options = {
    dialect: 'test',
    prettyPrint: false
  };
  const query1 = Select('id', 'name').from('table1');
  const query2 = Select('id', 'name').from('table2');

  it('should initialize Union', function () {
    expect(Union(query1, query2)._type).toStrictEqual(SerializationType.UNION_QUERY);
  });

  it('should serialize UNION query', function () {
    const query = Union(query1, query2);
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(
        `select id, name from table1 UNION select id, name from table2`);
  });

  it('should serialize UNION ALL query', function () {
    const query = UnionAll(query1, query2);
    const result = query.generate(options);
    expect(result.sql).toStrictEqual(
        `select id, name from table1 UNION ALL select id, name from table2`);
  });

});
