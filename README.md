# AIRR Data Commons (ADC) API reference implementation

JavaScript REST API implementation for MongoDB database repository
using swagger middleware.

## Bug Reporting

File issues at the top-level [ADC API github repository](https://github.com/airr-community/adc-api/).

## Configuration setup

Create and update environment file with appropriate settings. These
settings get passed to the docker container.

```
cp .env.defaults .env
```

## Development setup

Normally you do not build the docker image directly but instead use
docker-compose at the higher-level to compose all the services
together.
