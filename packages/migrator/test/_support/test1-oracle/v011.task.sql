CREATE TABLE table2
(
    id integer NOT NULL,
    name varchar2(256),
    CONSTRAINT table2_pkey PRIMARY KEY (id)
) TABLESPACE $(tablespace);
