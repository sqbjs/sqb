export const sqls = [

    `BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE ${process.env.ORASCHEMA}.CUSTOMERS';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN 
        RAISE; 
      END IF;
END;`,

    `BEGIN
   EXECUTE IMMEDIATE 'DROP SEQUENCE ${process.env.ORASCHEMA}.customers_id_seq';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -2289 THEN RAISE; END IF;
END;`,

    `BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE ${process.env.ORASCHEMA}.COUNTRIES';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN RAISE; END IF;
END;`,

    `BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE ${process.env.ORASCHEMA}.continents';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN RAISE; END IF;
END;`,


    `CREATE TABLE ${process.env.ORASCHEMA}.continents (
  code    VARCHAR2(5),
  name  VARCHAR2(16)
)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.continents ADD (
  CONSTRAINT continents_PK PRIMARY KEY (code) ENABLE VALIDATE)`,


    `CREATE TABLE ${process.env.ORASCHEMA}.countries (
  code    VARCHAR2(5),
  name  VARCHAR2(16),
  phone_code VARCHAR2(8),
  continent_code VARCHAR2(2)
)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.countries ADD (
  CONSTRAINT countries_PK PRIMARY KEY (code) ENABLE VALIDATE)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.countries ADD
CONSTRAINT FK_countries_continent_CODE
 FOREIGN KEY (continent_code)
 REFERENCES ${process.env.ORASCHEMA}.continents (code)
 ENABLE
 VALIDATE`,


    `CREATE TABLE ${process.env.ORASCHEMA}.customers
(
  id    INTEGER,
  given_name  VARCHAR2(64),
  family_name  VARCHAR2(64),
  birth_date  DATE,
  city  VARCHAR2(32),
  country_code  VARCHAR2(5)
)`,


    `ALTER TABLE ${process.env.ORASCHEMA}.customers ADD (
  CONSTRAINT customers_PK PRIMARY KEY (id) ENABLE VALIDATE)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.customers ADD
CONSTRAINT FK_CUSTOMERS_COUNTRY_CODE
 FOREIGN KEY (country_code)
 REFERENCES ${process.env.ORASCHEMA}.COUNTRIES (code)
 ENABLE
 VALIDATE`,


    `CREATE SEQUENCE ${process.env.ORASCHEMA}.customers_id_seq START WITH 10000`,

    `CREATE OR REPLACE TRIGGER ${process.env.ORASCHEMA}.customers_bi 
BEFORE INSERT ON ${process.env.ORASCHEMA}.customers 
FOR EACH ROW
BEGIN
  if :new.id is null then
      select ${process.env.ORASCHEMA}.customers_id_seq.nextval into :new.id from dual;
  end if;
END;`,
];
