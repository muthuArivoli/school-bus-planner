FROM ubuntu:20.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    python-dev-is-python3 \
    python3-pip \
    libpq-dev gcc netcat && \
    apt-get clean && \
    # Clear apt caches to reduce image size
    rm -rf /var/lib/apt/lists/*


COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

RUN mkdir /app
WORKDIR /app

COPY entrypoint.sh entrypoint.sh
ENTRYPOINT [ "./entrypoint.sh" ]
