import { expect } from 'expect';
import { splitOracleScript } from '../src/utils/split-oracle-script.js';

describe('migrator:splitOracleScript', () => {
  it('should split a plain multi-statement script on ";"', () => {
    const r = splitOracleScript(`
CREATE TABLE foo (id integer);
CREATE SEQUENCE foo_seq;
`);
    expect(r).toStrictEqual([
      'CREATE TABLE foo (id integer)',
      'CREATE SEQUENCE foo_seq',
    ]);
  });

  it('should treat a "/"-terminated PL/SQL block as one statement', () => {
    const r = splitOracleScript(`
CREATE OR REPLACE TRIGGER foo_bi
BEFORE INSERT ON foo
FOR EACH ROW
BEGIN
  IF :new.id IS NULL THEN
    SELECT foo_seq.NEXTVAL INTO :new.id FROM dual;
  END IF;
END;
/
`);
    expect(r).toStrictEqual([
      r[0], // sanity: exactly one statement produced
    ]);
    expect(r.length).toStrictEqual(1);
    expect(r[0]).toContain('CREATE OR REPLACE TRIGGER foo_bi');
    expect(r[0]).toContain('SELECT foo_seq.NEXTVAL INTO :new.id FROM dual;');
    // the trailing ";" terminating END is part of the block's own syntax
    expect(r[0].endsWith('END;')).toStrictEqual(true);
  });

  it('should handle a mixed script: plain statements, then a PL/SQL block, then more plain statements', () => {
    const r = splitOracleScript(`
CREATE TABLE foo (id integer);
CREATE SEQUENCE foo_seq;
CREATE OR REPLACE TRIGGER foo_bi
BEFORE INSERT ON foo
FOR EACH ROW
BEGIN
  IF :new.id IS NULL THEN
    SELECT foo_seq.NEXTVAL INTO :new.id FROM dual;
  END IF;
END;
/
CREATE TABLE bar (id integer);
`);
    expect(r.length).toStrictEqual(4);
    expect(r[0]).toStrictEqual('CREATE TABLE foo (id integer)');
    expect(r[1]).toStrictEqual('CREATE SEQUENCE foo_seq');
    expect(r[2]).toContain('CREATE OR REPLACE TRIGGER foo_bi');
    expect(r[3]).toStrictEqual('CREATE TABLE bar (id integer)');
  });

  it('should handle a bare anonymous BEGIN...END block with no CREATE prefix', () => {
    const r = splitOracleScript(`
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE foo';
EXCEPTION
  WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/
`);
    expect(r.length).toStrictEqual(1);
    expect(r[0]).toContain('EXECUTE IMMEDIATE');
  });

  it('should not split on ";" inside a string literal', () => {
    const r = splitOracleScript(
      `INSERT INTO foo (name) VALUES ('a; b'); INSERT INTO foo (name) VALUES ('c');`,
    );
    expect(r).toStrictEqual([
      "INSERT INTO foo (name) VALUES ('a; b')",
      "INSERT INTO foo (name) VALUES ('c')",
    ]);
  });

  it('should handle an escaped quote inside a string literal', () => {
    const r = splitOracleScript(
      `INSERT INTO foo (name) VALUES ('it''s; fine');`,
    );
    expect(r).toStrictEqual(["INSERT INTO foo (name) VALUES ('it''s; fine')"]);
  });

  it('should treat a PL/SQL block with no closing "/" as one statement (best effort)', () => {
    const r = splitOracleScript(`
BEGIN
  NULL;
END;
`);
    expect(r.length).toStrictEqual(1);
    expect(r[0]).toContain('BEGIN');
  });

  it('should return an empty array for an empty or whitespace-only script', () => {
    expect(splitOracleScript('')).toStrictEqual([]);
    expect(splitOracleScript('   \n  \n')).toStrictEqual([]);
  });
});
