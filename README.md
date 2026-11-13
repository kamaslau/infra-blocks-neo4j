# infra-blocks-neo4j

[![Blocks](https://img.shields.io/badge/infra--blocks-index-555?style=flat-square)](https://github.com/kamaslau/infra-blocks)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Repository size](https://img.shields.io/github/repo-size/kamaslau/infra-blocks-neo4j?color=56BEB8)

A unit, not a demo: one service, one port, one documented credential, disposable with a single command.

Typical use: the question is about multi-hop relationships — who introduced whom, which part belongs to which assembly — and a join table would need four joins to answer it.

[Neo4j](https://neo4j.com/docs/) with the [official Node.js driver](https://neo4j.com/docs/javascript-manual/current/) and [Neo4j Browser](https://neo4j.com/docs/browser-manual/current/) as the web UI. For a desktop client, [Neo4j Desktop](https://neo4j.com/docs/desktop-manual/current/).

## Service URL

- Bolt `bolt://localhost:7687` — what drivers connect to; not an HTTP endpoint
- Neo4j Browser `http://localhost:7474`

Ports can be changed in `.env`; see Usage.

## Default user

Defaults are for local use only.

| Username | Password |
| -------- | -------- |
| `neo4j` | `12345678` |

Neo4j refuses to start with the default password on a fresh volume unless `NEO4J_AUTH` set it, which is why the compose file passes `neo4j/${PASSWORD}` rather than relying on the image default. Changing `PASSWORD` after the data volume exists does not change the stored password — `ALTER CURRENT USER SET PASSWORD FROM '…' TO '…'` in the Browser does.

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
# Enter the container
docker exec -it neo4j bash

# Or go straight into Cypher
docker exec -it neo4j cypher-shell -u neo4j -p 12345678
```

## Verify

```bash
docker compose exec -T neo4j cypher-shell -u neo4j -p 12345678 'RETURN 1 AS ok;'
```

One row, one column, `1` — Bolt is listening and the credentials are the ones in `.env`. Browser answering at <http://localhost:7474> with a login form is the same fact through the other port.

```bash
docker compose logs --tail 20 neo4j | grep -i "Bolt enabled"
```

`Bolt enabled on 0.0.0.0:7687` is the line to look for when a driver times out but the container is up; its absence means the server never finished starting, usually because the password was rejected.

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

## Why this shape

One server, no cluster. A causal cluster needs three core members before it accepts writes, which is three containers and three JVMs to answer a question one graph answers fine at this size. The upgrade path is documented by Neo4j and is not a reinstall.

The Browser container is the same one as the database — Neo4j ships it inside the image at `:7474`, so there is no second container to keep in step. That is also why the port list has the UI under the service port: someone opening the firewall writes a rule for 7687 first.

Data and logs are separate named volumes (`/data`, `/logs`). Logs are worth keeping apart from data because they are what you ask for when the container has already been recreated; `docker compose down` keeps both, `down -v` removes both.

No memory ceiling is set, and that is the one place this unit differs from [infra-blocks-postgresql](https://github.com/kamaslau/infra-blocks-postgresql): Neo4j's page cache wants a configured share of the host (`NEO4J_server_memory_pagecache_size`), and a default limit picked here would be wrong on the next machine. On a 2C4G box, set it to `1G` and the heap to `1G` explicitly.

## Notes for deployments in China

The `neo4j` image is large — roughly 600 MB compressed — and pulls slowly through a congested link; pull it before the machine goes behind the client's firewall. The driver in `src/` is a separate dependency: `pnpm install` needs a registry mirror on a fresh host.

Neo4j Browser loads fonts and the dashboard from the container itself, so it works without internet access; the desktop client and the update checks do not.

## References

- [Neo4j in Docker](https://neo4j.com/docs/operations-manual/current/docker/introduction/)
- [Cypher Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/5/neo4j-community)
- [Neo4j image on Docker Hub](https://hub.docker.com/_/neo4j)

---

Part of [infrastructure blocks](https://github.com/kamaslau/infra-blocks) · ← back to index · [what I do](https://www.kamaslau.com/works?utm_source=github&utm_medium=repo-readme&utm_campaign=always-on&utm_content=unit)
