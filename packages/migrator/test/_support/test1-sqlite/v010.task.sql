CREATE TABLE IF NOT EXISTS $(schema).table1
(
    id integer NOT NULL,
    name varchar(256),
    CONSTRAINT table1_pkey PRIMARY KEY (id)
);
