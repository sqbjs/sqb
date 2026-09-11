CREATE TABLE table1
(
    id integer NOT NULL,
    name varchar2(256),
    CONSTRAINT table1_pkey PRIMARY KEY (id)
) TABLESPACE $(tablespace);
