IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'$(schema).table1') AND type = 'U')
BEGIN
  CREATE TABLE $(schema).table1
  (
      id integer NOT NULL,
      name varchar(256),
      CONSTRAINT table1_pkey PRIMARY KEY (id)
  );
END
