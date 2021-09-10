import '../_support/env';
import assert from 'assert';
import {
    SerializationType, OperatorType, Select, And, Or,
    Raw, Eq, Ne, Gt, Lt, Gte, Lte, Between, NotBetween, Like,
    NotLike, Ilike, NotILike, In, NotIn, Is, IsNot, Exists,
    NotExists, Param
} from '@sqb/builder';

describe('serialize "Operators"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    /*
     *
     */
    describe('and operator', function () {
        it('should initialize', function () {
            const op = And();
            assert.strictEqual(op._type, SerializationType.LOGICAL_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.and);
        });

        it('should skip empty items', function () {
            const query = Select()
                .from('table1')
                .where(And(null,
                    undefined,
                    // @ts-ignore
                    0, Eq('id', 1)));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id = 1)');
        });

        it('should validate items are Operator', function () {
            assert.throws(() =>
                    // @ts-ignore
                    And(new Date()),
                /type required/);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(And(Eq('id', 1), Eq('id', 2)));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id = 1 and id = 2)');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({and: [{'id': 1}, {'id': 2}]}, {and: {'id': 3}});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id = 1 and id = 2) and (id = 3)');
        });

    });

    /*
     *
     */
    describe('or operator', function () {
        it('should initialize', function () {
            const op = Or();
            assert.strictEqual(op._type, SerializationType.LOGICAL_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.or);
        });

        it('should skip empty items', function () {

            const query = Select()
                .from('table1')
                .where(Or(null, undefined,
                    // @ts-ignore
                    0, Eq('id', 1)));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id = 1)');
        });

        it('should validate items are Operator', function () {
            assert.throws(() =>
                    // @ts-ignore
                    Or(new Date()),
                /type required/);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Or(And(Eq('id', 1), Eq('id', 2)), Eq('id', 3)));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where ((id = 1 and id = 2) or id = 3)');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({OR: [{'id': 1}, {'id': 2}]});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id = 1 or id = 2)');
        });

    });

    /*
     *
     */
    describe('eq (=) operator', function () {
        it('should initialize', function () {
            const op = Eq('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.eq);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Eq('id', 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id = 1');
        });

        it('should use Serializable as first arg', function () {
            const query = Select()
                .from('table1')
                .where(Eq(Raw('id'), 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id = 1');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(Eq('id', Param('id')));
            const result = query.generate(Object.assign({params: {id: 1}}, options));
            assert.strictEqual(result.sql, 'select * from table1 where id = :id');
            assert.strictEqual(result.params.id, 1);
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a': 1, 'b=': 2, 'c =': 3});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a = 1 and b = 2 and c = 3');
        });
    });

    /*
     *
     */
    describe('ne (!=) operator', function () {
        it('should initialize', function () {
            const op = Ne('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.ne);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Ne('id', 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id != 1');
        });

        it('should use Serializable as first arg', function () {
            const query = Select()
                .from('table1')
                .where(Ne(Raw('id'), 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id != 1');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(Ne('id', Param('id')));
            const result = query.generate(Object.assign({params: {id: 1}}, options));
            assert.strictEqual(result.sql, 'select * from table1 where id != :id');
            assert.strictEqual(result.params.id, 1);
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a!=': 1, 'b !=': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a != 1 and b != 2');
        });
    });

    /*
     *
     */
    describe('gt (>) operator', function () {
        it('should initialize', function () {
            const op = Gt('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.gt);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Gt('id', 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id > 1');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a>': 1, 'b >': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a > 1 and b > 2');
        });

    });

    /*
     *
     */
    describe('lt (<) operator', function () {
        it('should initialize', function () {
            const op = Lt('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.lt);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Lt('id', 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id < 1');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a<': 1, 'b <': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a < 1 and b < 2');
        });
    });

    /*
     *
     */
    describe('gte (>=) operator', function () {
        it('should initialize', function () {
            const op = Gte('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.gte);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Gte('id', 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id >= 1');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a>=': 1, 'b >=': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a >= 1 and b >= 2');
        });

    });

    /*
     *
     */
    describe('lte (<=) operator', function () {
        it('should initialize', function () {
            const op = Lte('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.lte);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Lte('id', 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id <= 1');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a<=': 1, 'b <=': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a <= 1 and b <= 2');
        });

    });

    /*
     *
     */
    describe('between operator', function () {
        it('should initialize', function () {
            const op = Between('id', 1, 3);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.between);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Between('id', 10, 20));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id between 10 and 20');
        });

        it('should serialize with one arg', function () {
            const query = Select()
                .from('table1')
                .where(Between('id', [10]));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id between 10 and 10');
        });

        it('should serialize with one array arg', function () {
            const query = Select()
                .from('table1')
                .where(Between('id', [10, 20]));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id between 10 and 20');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(Between('id', Param('id1'), Param('id2')));
            const result = query.generate(Object.assign({
                params: {
                    id1: 1,
                    id2: 5
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where id between :id1 and :id2');
            assert.strictEqual(result.params.id1, 1);
            assert.strictEqual(result.params.id2, 5);
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a btw': [1, 2], 'b between': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a between 1 and 2 and b between 2 and 2');
        });

    });

    /*
     *
     */
    describe('notBetween operator', function () {
        it('should initialize', function () {
            const op = NotBetween('id', 1, 3);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.notBetween);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(NotBetween('id', 10, 20));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id not between 10 and 20');
        });

        it('should serialize with one arg', function () {
            const query = Select()
                .from('table1')
                .where(NotBetween('id', [10]));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id not between 10 and 10');
        });

        it('should serialize with one array arg', function () {
            const query = Select()
                .from('table1')
                .where(NotBetween('id', [10, 20]));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id not between 10 and 20');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(NotBetween('id', Param('id1'), Param('id2')));
            const result = query.generate(Object.assign({
                params: {
                    id1: 1,
                    id2: 5
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where id not between :id1 and :id2');
            assert.strictEqual(result.params.id1, 1);
            assert.strictEqual(result.params.id2, 5);
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a nbtw': [1, 2], 'b notBetween': 2});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a not between 1 and 2 and b not between 2 and 2');
        });

    });

    /*
     *
     */
    describe('like operator', function () {
        it('should initialize', function () {
            const op = Like('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.like);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Like('name', 'John\'s'), Like('id', '10'));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where name like \'John\'\'s\'' +
                ' and id like \'10\'');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(Like('name', Param('name')));
            const result = query.generate(Object.assign({
                params: {
                    name: 'John'
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where name like :name');
            assert.strictEqual(result.params.name, 'John');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a like': '1'});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a like \'1\'');
        });

    });

    /*
     *
     */
    describe('notLike operator', function () {
        it('should initialize', function () {
            const op = NotLike('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.notLike);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(NotLike('name', 'John\'s'), NotLike('id', '10'));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where name not like \'John\'\'s\'' +
                ' and id not like \'10\'');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(NotLike('name', Param('name')));
            const result = query.generate(Object.assign({
                params: {
                    name: 'John'
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where name not like :name');
            assert.strictEqual(result.params.name, 'John');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a !like': '1'});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a not like \'1\'');
        });

    });

    /*
     *
     */
    describe('ilike operator', function () {
        it('should initialize', function () {
            const op = Ilike('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.iLike);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Ilike('name', 'John\'s'), Ilike('id', '10'));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where name ilike \'John\'\'s\'' +
                ' and id ilike \'10\'');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(Ilike('name', Param('name')));
            const result = query.generate(Object.assign({
                params: {
                    name: 'John'
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where name ilike :name');
            assert.strictEqual(result.params.name, 'John');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a ilike': '1'});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a ilike \'1\'');
        });

    });

    /*
     *
     */
    describe('notILike operator', function () {
        it('should initialize', function () {
            const op = NotILike('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.notILike);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(NotILike('name', 'John\'s'), NotILike('id', '10'));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where name not ilike \'John\'\'s\'' +
                ' and id not ilike \'10\'');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(NotILike('name', Param('name')));
            const result = query.generate(Object.assign({
                params: {
                    name: 'John'
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where name not ilike :name');
            assert.strictEqual(result.params.name, 'John');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a !ilike': '1'});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a not ilike \'1\'');
        });
    });

    /*
     *
     */
    describe('in operator', function () {
        it('should initialize', function () {
            const op = In('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.in);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Or(In('id', 1), In('id', [4, 5, 6])));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id in (1)' +
                ' or id in (4,5,6))');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(In('id', Param('id')));
            const result = query.generate(Object.assign({
                params: {
                    id: [1, 2, 3]
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where id in :id');
            assert.deepStrictEqual(result.params.id, [1, 2, 3]);
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a in': 1, 'b in': [1, 2]});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a in (1) and b in (1,2)');
        });

        it('should ignore if list is empty', function () {
            const query = Select()
                .from('table1')
                .where(Or(In('id', [])));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1');
        });

    });

    /*
     *
     */
    describe('notIn operator', function () {
        it('should initialize', function () {
            const op = NotIn('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.notIn);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Or(NotIn('id', 1), NotIn('id', [4, 5, 6])));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (id not in (1)' +
                ' or id not in (4,5,6))');
        });

        it('should serialize params', function () {
            const query = Select()
                .from('table1')
                .where(NotIn('id', Param('id')));
            const result = query.generate(Object.assign({
                params: {
                    id: [1, 2, 3]
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where id not in :id');
            assert.deepStrictEqual(result.params.id, [1, 2, 3]);
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a !in': 1, 'b !in': [1, 2]});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a not in (1) and b not in (1,2)');
        });

    });

    /*
     *
     */
    describe('is operator', function () {
        it('should initialize', function () {
            const op = Is('id', null);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.is);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Is('id', null));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id is null');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a.a is': null});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a.a is null');
        });

    });

    /*
     *
     */
    describe('not operator', function () {
        it('should initialize', function () {
            const op = IsNot('id', 1);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.isNot);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(IsNot('id', null));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id is not null');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'a !is': null});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where a is not null');
        });

    });

    /*
    *
    */
    describe('exists operator', function () {
        const q = Select().from('table2');

        it('should initialize', function () {
            const op = Exists(q);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.exists);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(Exists(q));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where ' +
                'exists (select * from table2)');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'exists': q});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where ' +
                'exists (select * from table2)');
        });

    });

    /*
   *
   */
    describe('notExists operator', function () {
        const q = Select().from('table2');

        it('should initialize', function () {
            const op = NotExists(q);
            assert.strictEqual(op._type, SerializationType.COMPARISON_EXPRESSION);
            assert.strictEqual(op._operatorType, OperatorType.notExists);
        });

        it('should serialize', function () {
            const query = Select()
                .from('table1')
                .where(NotExists(q));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where ' +
                'not exists (select * from table2)');
        });

        it('should wrap native objects to operators', function () {
            const query = Select()
                .from('table1')
                .where({'!exists': q});
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where ' +
                'not exists (select * from table2)');
        });

    });

    /*
     *
     */
    describe('common', function () {

        it('should use sub-select as expression', function () {
            const query = Select()
                .from('table1')
                .where(Eq(Select('id').from('table'), 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where (select id from table) = 1');
        });

        it('should use raw as expression', function () {
            const query = Select()
                .from('table1')
                .where(Eq(Raw('id'), 1));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id = 1');
        });

        it('should use sub-select as value', function () {
            const query = Select()
                .from('table1')
                .where(Eq('id', Select('id').from('table')));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id = (select id from table)');
        });

        it('should use raw as value', function () {
            const query = Select()
                .from('table1')
                .where(Eq('id', Raw('1')));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where id = 1');
        });

        it('should use Date as value', function () {
            const query = Select()
                .from('table1')
                .where(Eq('dt1', new Date(Date.UTC(2017, 0, 15, 10, 30, 0, 0))),
                    Eq('dt2', new Date(Date.UTC(2017, 10, 1, 8, 5, 50, 0))));
            const result = query.generate(options);
            assert.strictEqual(result.sql, 'select * from table1 where dt1 = \'2017-01-15 10:30:00\'' +
                ' and dt2 = \'2017-11-01 08:05:50\'');
        });

        it('should use null as params', function () {
            const query = Select()
                .from('table1')
                .where(Eq('id', Param('id')));
            const result = query.generate(Object.assign({
                params: {
                    id: null
                }
            }, options));
            assert.strictEqual(result.sql, 'select * from table1 where id = :id');
            assert.strictEqual(result.params.id, null);
        });

        it('should validate when wrapping native objects to operators', function () {
            assert.throws(() =>
                    Select().from('table1').where({'#id=': 3}),
                /is not a valid/);
        });

        it('should validate when wrapping native objects to operators', function () {
            assert.throws(() =>
                    Select().from('table1').where({'id non': 3}),
                /Unknown operator/);
        });

    });

});
