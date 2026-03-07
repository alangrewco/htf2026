FROM python:3.10-slim

WORKDIR /usr/src/app

COPY generated/flask-server/requirements.txt /usr/src/app/requirements.txt
RUN pip3 install --no-cache-dir -r /usr/src/app/requirements.txt

COPY generated/flask-server /usr/src/app/generated/flask-server
COPY app /usr/src/app/app

WORKDIR /usr/src/app/generated/flask-server

EXPOSE 8080

ENTRYPOINT ["python3"]
CMD ["-m", "openapi_server"]
