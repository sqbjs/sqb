
const assert = require('assert'),
    sqb = require('../');

describe('Select statement', function () {

    it('should "type" member must be "select"', function (done) {
        let obj = sqb.select().where().groupBy().orderBy();
        assert.equal(obj.type, 'select');
        assert.equal(obj.isSelect, true);
        done();
    });

    it('should define columns with string', function (done) {
        let obj = sqb.select('col1', 'col2 c2', 'tbl.col3 c3');
        assert.equal(obj._columns.length, 3);
        assert.equal(obj._columns[0].isColumn, true);
        assert.equal(obj._columns[0].field, 'col1');
        assert.equal(obj._columns[1].field, 'col2');
        assert.equal(obj._columns[1].alias, 'c2');
        assert.equal(obj._columns[2].table, 'tbl');
        assert.equal(obj._columns[2].field, 'col3');
        assert.equal(obj._columns[2].alias, 'c3');
        done();
    });
    
    it('should define table in "from"', function (done) {
        let obj = sqb.select().from('table1', 'table2');
        assert.equal(obj._tables.length, 2);
        assert.equal(obj._tables[0].table, 'table1');
        assert.equal(obj._tables[1].table, 'table2');

        obj = sqb.select().from('sch.table1 t1');
        assert.equal(obj._tables[0].schema, 'sch');
        assert.equal(obj._tables[0].table, 'table1');
        assert.equal(obj._tables[0].alias, 't1');
        done();
    });

    it('should define "join"', function (done) {
        let obj = sqb.select().join(sqb.join('table1'));
        assert.equal(obj._joins.length, 1);
        assert.ok(obj._joins[0] instanceof sqb.Join);
        assert.equal(obj._joins[0].table, 'table1');
        done();
    });

    it('should define "where"', function (done) {
        let obj = sqb.select().where(sqb.and('ID', 1));
        assert.equal(obj._where.length, 1);
        assert.ok(obj._where.item(0) instanceof sqb.Condition);
        assert.equal(obj._where.item(0).field, 'ID');
        done();
    });

    it('should validate arguments in "where"', function (done) {
        let ok;
        try {
            sqb.select().where(1)
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should validate arguments in "joing"', function (done) {
        let ok;
        try {
            sqb.select().join(1)
        } catch (e) {
            ok = true;
        }
        assert.ok(ok);
        done();
    });

    it('should define "order by"', function (done) {
        let obj = sqb.select('ID').orderBy('t1.field1', 'field2 desc');
        assert.equal(obj._orderby.length, 2);
        assert.equal(obj._orderby[0].table, 't1');
        assert.equal(obj._orderby[0].field, 'field1');
        assert.equal(obj._orderby[1].field, 'field2');
        assert.equal(obj._orderby[1].descending, true);
        done();
    });

    it('should define "alias"', function (done) {
        let obj = sqb.select().alias('t1');
        assert.equal(obj._alias, 't1');
        done();
    });

    it('should define "limit"', function (done) {
        let obj = sqb.select().limit(5);
        assert.equal(obj._limit, 5);
        done();
    });

    it('should define "offset"', function (done) {
        let obj = sqb.select().offset(10);
        assert.equal(obj._offset, 10);
        done();
    });


});