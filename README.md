# school-bus-planner

Instructions for Deployment:

Install Docker --> sudo apt install docker-ce

Install docker-compose --> sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

Make docker-compose executable --> sudo chmod +x /usr/local/bin/docker-compose

Start up docker engine --> sudo systemctl status docker

GENERATE SSL --> sudo certbot certonly --standalone --email cac146@duke.edu --agree-tos --no-eff-email -d https://htfive.colab.duke.edu/

This will place SSL keys in /etc/letsencrypt folder

Set up SSH key and clone GITHUB repo

CD into school-bus-planner folder

TO BUILD AND RUN --> RUN 'docker-compose -f docker-compose-prod.yml up --build -d' 

TO CLEAN AND REFRESH DATABASE --> RUN 'docker-compose exec app python manage.py create_db'

TO ADD VALUE TO DATABASE --> RUN 'docker-compose exec app python manage.py seed_db'

To run in development environment:
RUN 'docker-compose up --build'
TO CLEAN AND REFRESH DATABASE --> RUN 'docker-compose exec app python manage.py create_db'
TO ADD VALUE TO DATABASE --> RUN 'docker-compose exec app python manage.py seed_db'

## Running

To run the service, run
```
docker-compose up --build
```

(the `--build` flag is only necessary when making dependency changes)

You may then navigate to `localhost:3000` for the React frontend. You can navigate to `localhost:5000` for the Flask server. You can navigate to `localhost:8080` to access adminer, to see the status and values in the database (username is postgres, password is bus, database is db, and make sure to select postgresql as system).

To stop the app, press Ctrl+c, then run 
```
docker-compose down
```

to shut down and remove the docker containers. To refresh the containers when an update is made to the client, run

```
docker-compose restart
```

## Adding dependencies

To add a dependency to the Flask container, with the container running (`docker-compose up --build` running in a separate terminal), run
```
docker exec app sh -c "pip3 install <package_name> && pip3 freeze > requirements.txt" 
```
where `<package_name>` is the package you would like to install. After this, stop the app (press Ctrl+c in the docker-compose terminal), and run the docker-compose command again.

To add a dependency to the React container, with the container running (`docker-compose up --build` running in a separate terminal), run

```
docker exec client npm install <package_name>
```

where `<pacakge_name>` is the package you would like to install. After this, stop the app (press Ctrl+c in the docker-compose terminal), and run the docker-compose command again.
