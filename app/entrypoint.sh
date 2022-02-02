#!/bin/sh


echo "Waiting for postgres..."

while ! nc -z $SQL_HOST $SQL_PORT; do
    sleep 0.1
done

echo "PostgreSQL started"

# python3 -m flask run --host=0.0.0.0
exec gunicorn -w 2 --threads 2 -b 0.0.0.0:5000 app:app