// https://neo4j.com/docs/javascript-manual/current/
import neo4j from "neo4j-driver";

const dbUrl = process.env.DB_URL ?? "neo4j://localhost:7687";
const dbName = process.env.DB_NAME ?? "neo4j";
const dbUser = process.env.DB_USER ?? "neo4j";
const dbPwd = process.env.DB_PWD ?? process.env.PASSWORD ?? "12345678";

let client = null;

const initDB = async () => {
  // use existing connection, if any
  if (!!client) {
    return client;
  }

  const candidate = neo4j.driver(dbUrl, neo4j.auth.basic(dbUser, dbPwd), {
    // Without these the driver retries for 30s before admitting nothing answers
    connectionTimeout: 5_000,
    maxTransactionRetryTime: 5_000,
  });

  // Creating a driver is lazy — only this opens a socket and checks the credentials
  await candidate.verifyConnectivity();

  client = candidate;

  return client;
};

const close = async () => {
  if (!client) return;

  await client.close();
  client = null;
};

const execute = async (query, parameters = {}) => {
  const driver = await initDB();

  return driver.executeQuery(query, parameters, { database: dbName });
};

const inspect = async () => {
  const driver = await initDB();

  return driver.getServerInfo();
};

const count = async (collectionName) => {
  const { records } = await execute(
    `MATCH (p: ${collectionName}) RETURN count(p) AS count`,
  );

  return Number(records.at(0)?.get("count") ?? 0);
};

const findMany = async (collectionName, options = {}) => {
  const { records } = await execute(
    `MATCH (p: ${collectionName})
      WITH count(p) AS count
      MATCH (p: ${collectionName})
      WITH p, count
      ${options.limit ? `LIMIT ${options.limit}` : ""}
      RETURN p AS node, count`,
  );

  return {
    count: Number(records.at(0)?.get("count") ?? 0),
    data: records.map((record) => record.get("node")),
  };
};

const insertOne = async (collectionName, data = {}) => {
  const { name = "Kamas" } = data;

  const { summary } = await execute(
    `MERGE (p: ${collectionName} {name: $name})`,
    { name },
  );

  return summary.counters.updates().nodesCreated;
};

export default { inspect, close, count, insertOne, findMany };
