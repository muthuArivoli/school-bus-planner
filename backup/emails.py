#!/usr/bin/env python3
import requests
import sys
from datetime import datetime

YOUR_DOMAIN_NAME="mail.hypotheticaltransportfive.email"
API_KEY = open('email_api.key', 'r').read().strip().replace('\n', '')

body = ""

if sys.argv[1] == 'Success':
    body = f"Database backup successful on {datetime.now()}."
else:
    body = "Database backup unsuccessful, please check backup system."

r = requests.post(
    f"https://api.mailgun.net/v3/{YOUR_DOMAIN_NAME}/messages",
    auth=("api", API_KEY),
    data={"from": f"Noreply <noreply@{YOUR_DOMAIN_NAME}>",
        "to": "kurisil00@gmail.com",
        "subject": f"Database Backup {sys.argv[1]}",
        "text": body})
