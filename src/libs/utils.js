const byte2kb = (byte = 0) => Math.ceil(byte / 1024);

export const briefLog = async (ctx, next) => {
  const start = Date.now();

  const clientIp = ctx.ip ?? getClientIP(ctx.req);
  ctx.set("APP-Client-IP", clientIp);

  console.log(
    "\x1b[32m%s\x1b[0m",
    `|> ${clientIp} ${ctx.method} ${ctx.url}: ${ctx.request.type} ${byte2kb(
      ctx.request.length
    )}KBs`
  );

  if (ctx.url !== "/favicon.ico") await next();

  const duration = Date.now() - start;
  const durationText = `${duration}ms`;

  ctx.set("X-Response-Time", durationText);
  console.log("\x1b[32m%s\x1b[0m", `<| ${durationText}\n\n`);
};

/**
 * 获取请求IP地址
 *
 * 在koa.js中间件中，通过 ctx.ip 可直接获取
 *
 * @param req
 * @returns {string} IP地址
 */
const getClientIP = (req) => {
  // console.log('getClientIP: ', req)

  // 判断是否有反向代理 IP
  const result =
    req.headers["x-forwarded-for"]?.toString() ?? // 判断是否有反向代理 IP
    req.headers["x-real-ip"]?.toString() ??
    req.socket.remoteAddress ?? // 判断后端的 socket 的 IP
    "";

  // console.log('result: ', result)
  return result;
};
