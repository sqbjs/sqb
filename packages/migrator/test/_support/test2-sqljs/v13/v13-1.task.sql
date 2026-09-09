CREATE TABLE IF NOT EXISTS $(schema).table3
(
    id integer NOT NULL,
    name varchar(256),
    active smallint,
    CONSTRAINT table3_pkey PRIMARY KEY (id)
);

DROP TRIGGER IF EXISTS $(schema).table3_bi;

CREATE TRIGGER $(schema).table3_bi
AFTER INSERT ON $(schema).table3
FOR EACH ROW
WHEN NEW.active IS NULL
BEGIN
  UPDATE table3 SET active = 1 WHERE id = NEW.id;
END;
