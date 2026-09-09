CREATE TABLE IF NOT EXISTS $(schema).table3
(
    id integer NOT NULL,
    name varchar(256),
    active smallint DEFAULT 1,
    CONSTRAINT table3_pkey PRIMARY KEY (id)
);

DROP TRIGGER IF EXISTS $(schema).table3_bi;

CREATE TRIGGER $(schema).table3_bi
BEFORE INSERT ON $(schema).table3
FOR EACH ROW
BEGIN
  IF NEW.active IS NULL THEN
    SET NEW.active = 1;
  END IF;
END;
