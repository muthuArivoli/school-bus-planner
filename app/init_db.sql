CREATE TABLE users(
    user_id serial PRIMARY KEY,
    email varchar(255) UNIQUE NOT NULL,
    full_name varchar(50) NOT NULL,
    uaddress varchar(255),
    pswd varchar(50) NOT NULL,
    admin_flag BOOLEAN NOT NULL
);