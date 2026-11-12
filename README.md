# infra-blocks-neo4j

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Repository size](https://img.shields.io/github/repo-size/kamaslau/infra-blocks-neo4j?color=56BEB8)

A [Neo4j](https://neo4j.com/docs/) bootstraper, using [official Node.js client driver](https://neo4j.com/docs/javascript-manual/current/) and [Neo4j Browser](https://neo4j.com/docs/browser-manual/current/) as Web UI。

For desktop GUI, consider [Neo4j Desktop](https://neo4j.com/docs/desktop-manual/current/).

## Service URL

- Database (Neo4j) [http://localhost:7687](http://localhost:7687)
- Web UI (Neo4j Browser) [http://localhost:7474](http://localhost:7474)

## Default user

Default logins should only be used in local/dev environments.

| Username | Password |
| -------- | -------- |
| neo4j    | 12345678 |

## Usage

### Start with [Docker Compose](https://docs.docker.com/compose/)

```bash
# Initiate .env file
cp .env.example .env
# Start services
docker compose up -d
```

Update existing composed containers with latest images:

```bash
docker compose pull && \
docker compose down && \
docker compose up -d
```

### Further operations

```shell
# Enter container and initiate shell
docker exec -it <neo4j-container-name>
```

## Relevent Docker images

- [Neo4j](https://hub.docker.com/_/neo4j)

## References

- [Neo4j in Docker](https://neo4j.com/docs/operations-manual/current/docker/introduction/)
- [Cypher Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/5/neo4j-community)
