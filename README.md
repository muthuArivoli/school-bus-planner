# school-bus-planner

Instructions for Deployment:

TO BUILD AND RUN --> RUN 'docker-compose -f docker-compose-prod.yml up --build -d' 
TO CLEAN AND REFRESH DATABASE --> RUN 'docker-compose exec app python manage.py create_db'
TO ADD VALUE TO DATABASE --> RUN 'docker-compose exec app python manage.py seed_db'