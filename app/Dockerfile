FROM ubuntu:20.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    python-dev-is-python3 \
    python3-pip && \
    apt-get clean && \
    # Clear apt caches to reduce image size
    rm -rf /var/lib/apt/lists/*


RUN pip3 install Flask

RUN mkdir /app
WORKDIR /app

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
