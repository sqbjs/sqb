IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'$(schema).table4') AND type = 'U')
BEGIN
  CREATE TABLE $(schema).table4
  (
      id integer NOT NULL,
      name varchar(256),
      CONSTRAINT table4_pkey PRIMARY KEY (id)
  );
END
