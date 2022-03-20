FROM postgres

RUN set -x \
	&& apt-get update && apt-get install -y --no-install-recommends ca-certificates python3-pip curl  openssh-client && rm -rf /var/lib/apt/lists/* \
	&& curl -L https://github.com/odise/go-cron/releases/download/v0.0.7/go-cron-linux.gz | zcat > /usr/local/bin/go-cron \
	&& chmod a+x /usr/local/bin/go-cron \
	&& apt-get clean

RUN pip3 install requests

ENV SSH_REMOTE_USER **None**
ENV SSH_REMOTE_HOST **None**
ENV POSTGRES_DB_CONTAINER_NAME **None**
ENV POSTGRES_DB **None**
ENV POSTGRES_DB_FILE **None**
ENV POSTGRES_PORT 5432
ENV POSTGRES_USER **None**
ENV POSTGRES_USER_FILE **None**
ENV POSTGRES_PASSWORD **None**
ENV POSTGRES_PASSWORD_FILE **None**
ENV POSTGRES_EXTRA_OPTS ''
ENV SCHEDULE '@daily'
ENV BACKUP_DIR '/backups'
ENV BACKUP_KEEP_DAYS 7
ENV BACKUP_KEEP_WEEKS 4
ENV BACKUP_KEEP_MONTHS 12
COPY backup.sh /backup.sh
COPY emails.py /emails.py
COPY email_api.key /email_api.key

VOLUME /backups

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["exec /usr/local/bin/go-cron -s \"$SCHEDULE\" -- /backup.sh"]
