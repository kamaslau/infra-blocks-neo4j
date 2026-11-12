import Koa from "koa";
import { getStatus } from "http-response-text";
import neo4j from "./libs/neo4j.js";
import { briefLog } from "./libs/utils.js";

const port = Number(process.env.APP_PORT ?? 3000);

// Languages supported by http-response-text, anything else falls back to English
const languages = ["en", "zh", "ja"];

const detectLanguage = () => {
  const locale =
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale;
  const language = locale.split(/[-_.]/)[0].toLowerCase();

  return languages.find((item) => item === language) ?? "en";
};

const language = detectLanguage();

const report = async (code, label, payload) => {
  const { message } = await getStatus(code, language);
  const line = `${label} (${code} ${message})`;
  const detail =
    payload instanceof Error
      ? payload.message || payload.code || payload.name
      : payload;

  if (code < 400) console.log(line, detail ?? "");
  else console.error(line, detail ?? "");
};

// Driver error codes carry the meaning; map them onto the status a client can act on
const codeOf = (error) => {
  const code = error?.code ?? "";

  if (code === "ServiceUnavailable" || error?.name === "ServiceUnavailable")
    return 503;
  if (code.startsWith("Neo.ClientError.Security")) return 401;
  if (code.includes("ConstraintValidationFailed")) return 409;
  if (code.startsWith("Neo.ClientError.Statement")) return 400;

  return 500;
};

const app = new Koa();

app.use(briefLog);

app.on("error", (error) => report(500, "App", error));

app.use(async (ctx) => {
  const collectionName = "Person";

  try {
    // Write
    const created = await neo4j.insertOne(collectionName);

    // Read
    const result = await neo4j.findMany(collectionName);

    ctx.status = result.count > 0 ? 200 : 404;
    ctx.body = result;
    await report(ctx.status, "Read/Write", {
      nodesCreated: created,
      count: result.count,
    });
  } catch (error) {
    // A refused connection lands on 503 here, a rejected query on 400/409/500
    ctx.status = codeOf(error);
    ctx.body = { error: (await getStatus(ctx.status, language)).message };
    await report(ctx.status, "Read/Write", error);
  }
});

const server = app.listen(port, () =>
  report(200, "Listen", `http://127.0.0.1:${port}`),
);

server.on("error", async (error) => {
  // EADDRINUSE: another process already owns the port
  await report(error.code === "EADDRINUSE" ? 409 : 500, "Listen", error);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    await report(200, "Shutdown", signal);
    await neo4j.close();
    process.exit(0);
  });
}
