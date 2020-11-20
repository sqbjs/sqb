export const sqls = [

`BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE ${process.env.ORASCHEMA}.airports';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END`,

`BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE ${process.env.ORASCHEMA}.regions';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END`,

`CREATE TABLE ${process.env.ORASCHEMA}.regions(
  id    VARCHAR2(5),
  name  VARCHAR2(16)
)`,

`ALTER TABLE ${process.env.ORASCHEMA}.regions ADD (
  CONSTRAINT regions_PK
  PRIMARY KEY (id)
  ENABLE VALIDATE)`,

`CREATE TABLE ${process.env.ORASCHEMA}.airports
(
  id    VARCHAR2(10),
  shortname  VARCHAR2(10),
  name  VARCHAR2(32),
  region  VARCHAR2(5),
  icao  VARCHAR2(10),
  flags  INTEGER,
  catalog  INTEGER,
  length  INTEGER,
  elevation  INTEGER,
  runway  VARCHAR2(5),
  frequency  number(12,4),
  latitude  VARCHAR2(10),
  longitude  VARCHAR2(10)
)`,

`ALTER TABLE ${process.env.ORASCHEMA}.airports ADD (
  CONSTRAINT airports_PK
  PRIMARY KEY
  (id)
  ENABLE VALIDATE)`,

`ALTER TABLE ${process.env.ORASCHEMA}.AIRPORTS ADD
CONSTRAINT FK_AIRPORTS_REGION
 FOREIGN KEY (REGION)
 REFERENCES ${process.env.ORASCHEMA}.REGIONS (ID)
 ENABLE
 VALIDATE`
 ];
