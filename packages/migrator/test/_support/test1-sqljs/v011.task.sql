CREATE TABLE IF NOT EXISTS $(schema).table2
(
    id integer NOT NULL,
    name varchar(256),
    CONSTRAINT table2_pkey PRIMARY KEY (id)
);
