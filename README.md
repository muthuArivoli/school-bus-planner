# school-bus-planner

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
