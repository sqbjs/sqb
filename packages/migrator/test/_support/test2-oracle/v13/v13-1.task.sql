CREATE TABLE table3
(
    id integer NOT NULL,
    name varchar2(256),
    active smallint DEFAULT 1,
    CONSTRAINT table3_pkey PRIMARY KEY (id)
) TABLESPACE $(tablespace);

CREATE SEQUENCE table3_seq START WITH 1;

CREATE OR REPLACE TRIGGER table3_bi
BEFORE INSERT ON table3
FOR EACH ROW
BEGIN
  IF :new.id IS NULL THEN
    SELECT table3_seq.NEXTVAL INTO :new.id FROM dual;
  END IF;
END;
/
