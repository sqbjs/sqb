/* sqb-connect-oracle
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb-connect-oracle/
 */

/**
 * Expose `TestMetaOperator`.
 */
module.exports = TestMetaOperator;

/**
 * @constructor
 */
function TestMetaOperator() {
}

const proto = TestMetaOperator.prototype = {};
proto.constructor = TestMetaOperator;

proto.invalidate = function() {
};

proto.querySchemas = function(db) {
  return db
      .select()
      .from('schemas');
};

proto.queryTables = function(db) {
  return db
      .select()
      .from('tables');
};

proto.queryColumns = function(db) {
  return db
      .select()
      .from('columns');
};

proto.queryPrimaryKeys = function(db) {
  return db
      .select()
      .from('primary_keys');
};

proto.queryForeignKeys = function(db) {
  return db
      .select()
      .from('foreign_keys');
};

proto.getTableInfo = function(db, schema, tableName, callback) {
  callback(null, {
    columns: {
      ID: {
        column_index: 0,
        column_name: 'ID',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: true
      },
      ShortName: {
        column_index: 1,
        column_name: 'ShortName',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Name: {
        column_index: 2,
        column_name: 'Name',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Region: {
        column_index: 3,
        column_name: 'Region',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: 64,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      ICAO: {
        column_index: 4,
        column_name: 'ICAO',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Flags: {
        column_index: 5,
        column_name: 'Flags',
        data_type: 'INTEGER',
        data_type_mean: 'INTEGER',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Catalog: {
        column_index: 6,
        column_name: 'Catalog',
        data_type: 'INTEGER',
        data_type_mean: 'INTEGER',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Length: {
        column_index: 7,
        column_name: 'Length',
        data_type: 'NUMBER',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Elevation: {
        column_index: 8,
        column_name: 'Elevation',
        data_type: 'INTEGER',
        data_type_mean: 'INTEGER',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Runway: {
        column_index: 9,
        column_name: 'Runway',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Frequency: {
        column_index: 10,
        column_name: 'Frequency',
        data_type: 'NUMBER',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Latitude: {
        column_index: 11,
        column_name: 'Latitude',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      },
      Longitude: {
        column_index: 12,
        column_name: 'Longitude',
        data_type: 'TEXT',
        data_type_mean: 'VARCHAR',
        char_length: null,
        data_size: null,
        default_value: null,
        is_notnull: false,
        pk: false
      }
    },
    primaryKey: {columns: 'ID', constraint_name: 'PK_AIRPORTS_ID'},
    foreignKeys: [{
      constraint_name: 'FK_AIRPORTS_REGION',
      columns: 'REGION',
      foreign_table: 'REGISONS',
      foreign_columns: 'ID'
    }]
  });
};
