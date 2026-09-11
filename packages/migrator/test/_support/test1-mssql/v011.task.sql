IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'$(schema).table2') AND type = 'U')
BEGIN
  CREATE TABLE $(schema).table2
  (
      id integer NOT NULL,
      name varchar(256),
      CONSTRAINT table2_pkey PRIMARY KEY (id)
  );
END
