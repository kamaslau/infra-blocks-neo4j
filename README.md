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

## Demo client

`pnpm start` runs a Koa service on `APP_PORT` (3000). Each `GET /` merges one `Person` node and reads the collection back through the official driver:

```bash
cp .env.example .env
pnpm install
pnpm start
curl -s http://127.0.0.1:3000/
# {"count":1,"data":[{"identity":…,"properties":{"name":"Kamas"},…}]}
```

Failures answer with a status and log a line, both carrying the text from [http-response-text](https://github.com/kamaslau/http-response-text):

| What happened | Response | Log line |
|---|---|---|
| Driver cannot reach the server | `503` | `Read/Write (503 Service Unavailable) Could not perform discovery …` |
| Wrong password | `401` | `Read/Write (401 Unauthorized) …` |
| Constraint rejected the write | `409` | `Read/Write (409 Conflict) …` |
| Malformed Cypher | `400` | `Read/Write (400 Bad Request) …` |
| Anything else the server refused | `500` | `Read/Write (500 Internal Server Error) …` |
| `APP_PORT` already in use | — | `Listen (409 Conflict) listen EADDRINUSE …`, exits `1` |

`DB_URL`, `DB_NAME` and `DB_USER` default to the values in `.env.example`; the password is read from `PASSWORD`, the same variable the compose file passes to `NEO4J_AUTH`. The driver only opens a socket when the first request arrives, so a stopped database shows up as a `503` on that request rather than a crash at startup. Connection attempts give up after five seconds. Message language follows `LANG` / `LC_ALL`, matched against `listLanguages()` from the installed http-response-text (`en`, `zh`, `ja`, `fr` today); anything else falls back to English.

## Relevent Docker images

- [Neo4j](https://hub.docker.com/_/neo4j)

## References

- [Neo4j in Docker](https://neo4j.com/docs/operations-manual/current/docker/introduction/)
- [Cypher Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/5/neo4j-community)
