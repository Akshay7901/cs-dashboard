const TARGET_BASE = "https://api.cambridgescholars.com/api/proposals";

function applyCors(response: any) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  );
  response.setHeader("Access-Control-Max-Age", "86400");
}

function readRequestBody(request: any): Promise<Buffer | undefined> {
  if (["GET", "HEAD"].includes(request.method)) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
    request.on("error", reject);
  });
}

export default async function handler(request: any, response: any) {
  applyCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  try {
    const incomingUrl = new URL(request.url ?? "/api/proposals", "https://vercel.local");
    const upstreamPath = incomingUrl.pathname.replace(/^\/api\/proposals\/?/, "");
    const upstreamUrl = `${TARGET_BASE}${upstreamPath ? `/${upstreamPath}` : ""}${incomingUrl.search}`;

    const headers = new Headers();
    const contentType = request.headers["content-type"];
    const authorization = request.headers.authorization;
    if (contentType) headers.set("Content-Type", Array.isArray(contentType) ? contentType[0] : contentType);
    if (authorization) headers.set("Authorization", Array.isArray(authorization) ? authorization[0] : authorization);
    headers.set("Accept", "application/json, text/plain, */*");

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: await readRequestBody(request),
    });

    response.status(upstreamResponse.status);
    upstreamResponse.headers.forEach((value, key) => {
      if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
        response.setHeader(key, value);
      }
    });
    applyCors(response);
    response.send(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch (error) {
    response.status(502).json({ error: "Proposal API proxy failed." });
  }
}