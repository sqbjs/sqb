export const sqls = [

    /* Drop*/


    `BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE ${process.env.ORASCHEMA}.CUSTOMER_TAGS';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN 
        RAISE; 
      END IF;
END;`,

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

    //  Create continents table

    `CREATE TABLE ${process.env.ORASCHEMA}.continents (
  code    VARCHAR2(5),
  name  VARCHAR2(16)
)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.continents ADD (
  CONSTRAINT continents_PK PRIMARY KEY (code) ENABLE VALIDATE)`,

    //  Create countries table

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

    //  Create customers table

    `CREATE TABLE ${process.env.ORASCHEMA}.customers
(
  id    INTEGER,
  given_name  VARCHAR2(64),
  family_name  VARCHAR2(64),
  gender  CHAR(1),
  birth_date  DATE,
  city  VARCHAR2(32),
  country_code  VARCHAR2(5),
  active boolean default true,
  created_at timestamp default CURRENT_TIMESTAMP,
  updated_at timestamp
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

//  Create tags table

    `CREATE TABLE ${process.env.ORASCHEMA}.tags
(
  id    INTEGER,
  name  VARCHAR2(16),
  color  VARCHAR2(16),
  active boolean default true
)`,


    `ALTER TABLE ${process.env.ORASCHEMA}.tags ADD (
  CONSTRAINT tags_PK PRIMARY KEY (id) ENABLE VALIDATE)`,

    `CREATE SEQUENCE ${process.env.ORASCHEMA}.tags_id_seq START WITH 100`,

    `CREATE OR REPLACE TRIGGER ${process.env.ORASCHEMA}.tags_bi 
BEFORE INSERT ON ${process.env.ORASCHEMA}.tags 
FOR EACH ROW
BEGIN
  if :new.id is null then
      select ${process.env.ORASCHEMA}.tags_id_seq.nextval into :new.id from dual;
  end if;
END;`,


    //  Create customer_tags table

    `CREATE TABLE ${process.env.ORASCHEMA}.customer_tags (
  customer_id    INTEGER,
  tag_id    INTEGER
)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.customer_tags ADD (
  CONSTRAINT customer_tags_PK PRIMARY KEY (customer_id, tag_id) ENABLE VALIDATE)`,

    `ALTER TABLE ${process.env.ORASCHEMA}.customer_tags ADD
CONSTRAINT FK_customer_tags_customer_id
 FOREIGN KEY (customer_id)
 REFERENCES ${process.env.ORASCHEMA}.customers (id)
 ENABLE
 VALIDATE`,

    `ALTER TABLE ${process.env.ORASCHEMA}.customer_tags ADD
CONSTRAINT FK_customer_tags_tag_id
 FOREIGN KEY (tag_id)
 REFERENCES ${process.env.ORASCHEMA}.tags (id)
 ENABLE
 VALIDATE`,

];
