# school-bus-planner

Instructions for Deployment:

SSH into VM --> ssh vcm@vcm-25134.vm.duke.edu and enter password va8dtLekyk

Install Docker --> sudo apt install docker-ce

Install docker-compose --> sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

Make docker-compose executable --> sudo chmod +x /usr/local/bin/docker-compose

Start up docker engine --> sudo systemctl status docker

GENERATE SSL --> sudo certbot certonly --standalone --email cac146@duke.edu --agree-tos --no-eff-email -d https://hypotheticaltransportfive.colab.duke.edu/

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

