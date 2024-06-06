/* eslint-disable camelcase */
import { Adapter, ArrayRowset, ObjectRowset } from '@sqb/connect';
import {
  applyNamingStrategy,
  normalizeRowsToArrayRows,
  normalizeRowsToObjectRows,
  wrapAdapterFields,
} from '../../src/client/helpers.js';

describe('Helpers', function () {
  const arrayRows: ArrayRowset = [
    ['a', 'b', null],
    ['c', 'd', null],
  ];
  const objectRows: ObjectRowset = [
    { field_name1: 'a', field_name2: 'b', field_name3: null },
    { field_name1: 'c', field_name2: 'd', field_name3: null },
  ];

  const adapterFields = [
    { fieldName: 'field_name1' },
    { fieldName: 'field_name2' },
    { fieldName: 'field_name3' },
  ] as Adapter.Field[];

  describe('applyNamingStrategy', function () {
    it('should return given value as lowercase', function () {
      expect(applyNamingStrategy('hello_world', 'lowercase')).toStrictEqual('hello_world');
      // @ts-ignore
      expect(applyNamingStrategy('Hello_World', 'LowerCase')).toStrictEqual('hello_world');
    });

    it('should return given value as uppercase', function () {
      expect(applyNamingStrategy('hello_world', 'uppercase')).toStrictEqual('HELLO_WORLD');
      // @ts-ignore
      expect(applyNamingStrategy('Hello_World', 'UpperCase')).toStrictEqual('HELLO_WORLD');
    });

    it('should return given value as camelcase', function () {
      expect(applyNamingStrategy('helloWorld', 'camelcase')).toStrictEqual('helloWorld');
      expect(applyNamingStrategy('HELLO_WORLD', 'camelcase')).toStrictEqual('helloWorld');
      expect(applyNamingStrategy('hello_world', 'camelcase')).toStrictEqual('helloWorld');
      expect(applyNamingStrategy('Hello_World', 'camelcase')).toStrictEqual('helloWorld');
    });

    it('should return given value as pascalcase', function () {
      expect(applyNamingStrategy('helloWorld', 'pascalcase')).toStrictEqual('HelloWorld');
      expect(applyNamingStrategy('HELLO_WORLD', 'pascalcase')).toStrictEqual('HelloWorld');
      expect(applyNamingStrategy('hello_world', 'pascalcase')).toStrictEqual('HelloWorld');
      expect(applyNamingStrategy('Hello_World', 'pascalcase')).toStrictEqual('HelloWorld');
    });

    it('should use custom function', function () {
      expect(applyNamingStrategy('hello_world', x => x.toUpperCase())).toStrictEqual('HELLO_WORLD');
    });

    it('should do nothing if no strategy given', function () {
      expect(applyNamingStrategy('hello_world', undefined)).toStrictEqual('hello_world');
    });
  });

  describe('normalizeFieldMap', function () {
    it('should convert Adapter.Field[] to FieldInfoMap', function () {
      const fields = wrapAdapterFields(adapterFields);
      expect(!Array.isArray(fields)).toBeTruthy();
      expect(fields.get('field_name1')).toBeDefined();
      expect(fields.get('field_name1').name).toStrictEqual('field_name1');
      expect(fields.get('field_name1').index).toStrictEqual(0);
      expect(fields.get(0).name).toStrictEqual('field_name1');
      expect(fields.get(0).index).toStrictEqual(0);
    });

    it('should apply naming strategy', function () {
      const fields = wrapAdapterFields(adapterFields, 'camelcase');
      expect(!Array.isArray(fields)).toBeTruthy();
      expect(fields.get('fieldName1')).toBeDefined();
      expect(fields.get('fieldName1').fieldName).toStrictEqual('field_name1');
    });
  });

  describe('normalizeRowsToObjectRows', function () {
    it('should convert array rows to object rows', function () {
      const fields = wrapAdapterFields(adapterFields);
      const rows = normalizeRowsToObjectRows(fields, 'array', arrayRows as any);
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows.length).toStrictEqual(arrayRows.length);
      expect(!Array.isArray(rows[0])).toBeTruthy();
      expect(rows[0].field_name1).toBeDefined();
      expect(rows[0].field_name1).toStrictEqual('a');
      expect(rows[0].field_name2).toStrictEqual('b');
      expect(rows[0].field_name3).toStrictEqual(null);
    });

    it('should keep object rows', function () {
      const fields = wrapAdapterFields(adapterFields);
      const rows = normalizeRowsToObjectRows(fields, 'object', objectRows);
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows.length).toStrictEqual(objectRows.length);
      expect(!Array.isArray(rows[0])).toBeTruthy();
      expect(rows[0].field_name1).toBeDefined();
      expect(rows[0].field_name1).toStrictEqual('a');
      expect(rows[0].field_name2).toStrictEqual('b');
      expect(rows[0].field_name3).toStrictEqual(null);
    });

    it('should apply naming strategy to fields in rows (object rows source)', function () {
      const fields = wrapAdapterFields(adapterFields, 'camelcase');
      const rows = normalizeRowsToObjectRows(fields, 'object', objectRows);
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows.length).toStrictEqual(arrayRows.length);
      expect(!Array.isArray(rows[0])).toBeTruthy();
      expect(rows[0].fieldName1).toBeDefined();
      expect(rows[0].fieldName1).toStrictEqual('a');
      expect(rows[0].fieldName2).toStrictEqual('b');
      expect(rows[0].fieldName3).toStrictEqual(null);
    });

    it('should apply naming strategy to fields in rows (array rows source)', function () {
      const fields = wrapAdapterFields(adapterFields, 'camelcase');
      const rows = normalizeRowsToObjectRows(fields, 'array', arrayRows as any);
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows.length).toStrictEqual(arrayRows.length);
      expect(!Array.isArray(rows[0])).toBeTruthy();
      expect(rows[0].fieldName1).toBeDefined();
      expect(rows[0].fieldName1).toStrictEqual('a');
      expect(rows[0].fieldName2).toStrictEqual('b');
      expect(rows[0].fieldName3).toStrictEqual(null);
    });

    it('should remove null field values ignoreNulls == true', function () {
      const fields = wrapAdapterFields(adapterFields, 'camelcase');
      const rows = normalizeRowsToObjectRows(fields, 'object', objectRows, { ignoreNulls: true });
      expect(rows[0].fieldName1).toStrictEqual('a');
      expect(rows[0].fieldName2).toStrictEqual('b');
      expect(rows[0].fieldName3).toStrictEqual(undefined);
    });

    it('should apply value transform ', function () {
      const fields = wrapAdapterFields(adapterFields, 'camelcase');
      const rows = normalizeRowsToObjectRows(fields, 'object', objectRows, {
        transform: x => '$' + x,
      });
      expect(rows[0].fieldName1).toStrictEqual('$a');
      expect(rows[0].fieldName2).toStrictEqual('$b');
    });
  });

  describe('normalizeRowsToArrayRows', function () {
    it('should convert object rows to array rows if objectRows = false', function () {
      const fields = wrapAdapterFields(adapterFields);
      const rows = normalizeRowsToArrayRows(fields, 'object', objectRows);
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows.length).toStrictEqual(objectRows.length);
      expect(Array.isArray(rows[0])).toBeTruthy();
      expect(rows[0][0]).toStrictEqual('a');
      expect(rows[0][1]).toStrictEqual('b');
      expect(rows[0][2]).toStrictEqual(null);
    });

    it('should keep to array rows if objectRows = false', function () {
      const fields = wrapAdapterFields(adapterFields);
      const rows = normalizeRowsToArrayRows(fields, 'array', arrayRows as any);
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows.length).toStrictEqual(arrayRows.length);
      expect(Array.isArray(rows[0])).toBeTruthy();
      expect(rows[0][0]).toStrictEqual('a');
      expect(rows[0][1]).toStrictEqual('b');
      expect(rows[0][2]).toStrictEqual(null);
    });
  });
});
