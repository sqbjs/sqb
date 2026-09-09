IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'$(schema).table3') AND type = 'U')
BEGIN
  CREATE TABLE $(schema).table3
  (
      id integer NOT NULL,
      name varchar(256),
      active smallint NULL,
      CONSTRAINT table3_pkey PRIMARY KEY (id)
  );
END
GO
DROP TRIGGER IF EXISTS $(schema).table3_bi;
GO
CREATE TRIGGER $(schema).table3_bi ON $(schema).table3
AFTER INSERT
AS
BEGIN
  UPDATE t SET active = 1
  FROM $(schema).table3 t
  INNER JOIN inserted i ON t.id = i.id
  WHERE i.active IS NULL;
END;
GO
