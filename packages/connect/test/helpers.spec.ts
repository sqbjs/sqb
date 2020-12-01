/* eslint-disable */
import assert from 'assert';
import {applyNamingStrategy, wrapAdapterFields, normalizeRows} from '../src/helpers';
import {Adapter, ArrayRowset, ObjectRowset} from '../src';

describe('Helpers', function () {

    const arrayRows: ArrayRowset = [['a', 'b', null], ['c', 'd', null]];
    const objectRows: ObjectRowset = [{field_name1: 'a', field_name2: 'b', field_name3: null},
        {field_name1: 'c', field_name2: 'd', field_name3: null}];

    const adapterFields = [
        {fieldName: 'field_name1'},
        {fieldName: 'field_name2'},
        {fieldName: 'field_name3'},
    ] as Adapter.Field[];

    describe('applyNamingStrategy', function () {

        it('should return given value as lowercase', function () {
            assert.strictEqual(applyNamingStrategy('hello_world', 'lowercase'), 'hello_world');
            // @ts-ignore
            assert.strictEqual(applyNamingStrategy('Hello_World', 'LowerCase'), 'hello_world');
        });

        it('should return given value as uppercase', function () {
            assert.strictEqual(applyNamingStrategy('hello_world', 'uppercase'), 'HELLO_WORLD');
            // @ts-ignore
            assert.strictEqual(applyNamingStrategy('Hello_World', 'UpperCase'), 'HELLO_WORLD');
        });

        it('should return given value as camelcase', function () {
            assert.strictEqual(applyNamingStrategy('helloWorld', 'camelcase'), 'helloWorld');
            assert.strictEqual(applyNamingStrategy('HELLO_WORLD', 'camelcase'), 'helloWorld');
            assert.strictEqual(applyNamingStrategy('hello_world', 'camelcase'), 'helloWorld');
            assert.strictEqual(applyNamingStrategy('Hello_World', 'camelcase'), 'helloWorld');
        });

        it('should return given value as pascalcase', function () {
            assert.strictEqual(applyNamingStrategy('helloWorld', 'pascalcase'), 'HelloWorld');
            assert.strictEqual(applyNamingStrategy('HELLO_WORLD', 'pascalcase'), 'HelloWorld');
            assert.strictEqual(applyNamingStrategy('hello_world', 'pascalcase'), 'HelloWorld');
            assert.strictEqual(applyNamingStrategy('Hello_World', 'pascalcase'), 'HelloWorld');
        });

        it('should use custom function', function () {
            assert.strictEqual(applyNamingStrategy('hello_world', (x) => x.toUpperCase()), 'HELLO_WORLD');
        });

        it('should do nothing if no strategy given', function () {
            assert.strictEqual(applyNamingStrategy('hello_world', undefined), 'hello_world');
        });

    });

    describe('normalizeFieldMap', function () {

        it('should convert Adapter.Field[] to FieldInfoMap', function () {
            const fields = wrapAdapterFields(adapterFields);
            assert(!Array.isArray(fields));
            assert(fields.get('field_name1'));
            assert.strictEqual(fields.get('field_name1').name, 'field_name1');
            assert.strictEqual(fields.get('field_name1').index, 0);
            assert.strictEqual(fields.get(0).name, 'field_name1');
            assert.strictEqual(fields.get(0).index, 0);
        });

        it('should apply naming strategy', function () {
            const fields = wrapAdapterFields(adapterFields, 'camelcase');
            assert(!Array.isArray(fields));
            assert(fields.get('fieldName1'));
            assert.strictEqual(fields.get('fieldName1').fieldName, 'field_name1');
        });

    });


    describe('normalizeRows', function () {

        it('should convert array rows to object rows if objectRows = true', function () {
            const fields = wrapAdapterFields(adapterFields);
            const rows = normalizeRows(fields, 'array', arrayRows as any, {objectRows: true});
            assert(Array.isArray(rows));
            assert.strictEqual(rows.length, arrayRows.length);
            assert(!Array.isArray(rows[0]));
            assert(rows[0].field_name1);
            assert.strictEqual(rows[0].field_name1, 'a');
            assert.strictEqual(rows[0].field_name2, 'b');
            assert.strictEqual(rows[0].field_name3, null);
        });

        it('should keep object rows if objectRows = true', function () {
            const fields = wrapAdapterFields(adapterFields);
            const rows = normalizeRows(fields, 'object', objectRows, {objectRows: true});
            assert(Array.isArray(rows));
            assert.strictEqual(rows.length, objectRows.length);
            assert(!Array.isArray(rows[0]));
            assert(rows[0].field_name1);
            assert.strictEqual(rows[0].field_name1, 'a');
            assert.strictEqual(rows[0].field_name2, 'b');
            assert.strictEqual(rows[0].field_name3, null);
        });

        it('should convert object rows to array rows if objectRows = false', function () {
            const fields = wrapAdapterFields(adapterFields);
            const rows = normalizeRows(fields, 'object', objectRows, {objectRows: false});
            assert(Array.isArray(rows));
            assert.strictEqual(rows.length, objectRows.length);
            assert(Array.isArray(rows[0]));
            assert.strictEqual(rows[0][0], 'a');
            assert.strictEqual(rows[0][1], 'b');
            assert.strictEqual(rows[0][2], null);
        });

        it('should keep to array rows if objectRows = false', function () {
            const fields = wrapAdapterFields(adapterFields);
            const rows = normalizeRows(fields, 'array', arrayRows as any, {objectRows: false});
            assert(Array.isArray(rows));
            assert.strictEqual(rows.length, arrayRows.length);
            assert(Array.isArray(rows[0]));
            assert.strictEqual(rows[0][0], 'a');
            assert.strictEqual(rows[0][1], 'b');
            assert.strictEqual(rows[0][2], null);
        });

        it('should apply naming strategy to fields in rows (object rows source)', function () {
            const fields = wrapAdapterFields(adapterFields, 'camelcase');
            const rows = normalizeRows(fields, 'object', objectRows, {objectRows: true});
            assert(Array.isArray(rows));
            assert.strictEqual(rows.length, arrayRows.length);
            assert(!Array.isArray(rows[0]));
            assert(rows[0].fieldName1);
            assert.strictEqual(rows[0].fieldName1, 'a');
            assert.strictEqual(rows[0].fieldName2, 'b');
            assert.strictEqual(rows[0].fieldName3, null);
        });

        it('should apply naming strategy to fields in rows (array rows source)', function () {
            const fields = wrapAdapterFields(adapterFields, 'camelcase');
            const rows = normalizeRows(fields, 'array', arrayRows as any, {objectRows: true});
            assert(Array.isArray(rows));
            assert.strictEqual(rows.length, arrayRows.length);
            assert(!Array.isArray(rows[0]));
            assert(rows[0].fieldName1);
            assert.strictEqual(rows[0].fieldName1, 'a');
            assert.strictEqual(rows[0].fieldName2, 'b');
            assert.strictEqual(rows[0].fieldName3, null);
        });

        it('should remove null field values ignoreNulls == true', function () {
            const fields = wrapAdapterFields(adapterFields, 'camelcase');
            const rows = normalizeRows(fields, 'object', objectRows, {
                objectRows: true,
                ignoreNulls: true
            });
            assert.strictEqual(rows[0].fieldName1, 'a');
            assert.strictEqual(rows[0].fieldName2, 'b');
            assert.strictEqual(rows[0].fieldName3, undefined);
        });

        it('should apply coercion ', function () {
            const fields = wrapAdapterFields(adapterFields, 'camelcase');
            const rows = normalizeRows(fields, 'object', objectRows, {
                objectRows: true, coercion: x => '$' + x
            });
            assert.strictEqual(rows[0].fieldName1, '$a');
            assert.strictEqual(rows[0].fieldName2, '$b');
        });

    });

});
