#!/usr/bin/env node
// Post-build step for Vercel static hosting (SPA fallback workaround).
// TanStack Start's normal build is SSR-only and emits no index.html.
// This script generates a minimal SPA shell that loads the client entry
// chunk, so a Vercel static deploy + catch-all rewrite can render every
// route in the browser instead of returning 404.
import { readdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const clientDir = "dist/client";
const assetsDir = join(clientDir, "assets");

if (!existsSync(assetsDir)) {
  console.error(`[build-vercel] ${assetsDir} not found. Run \`bun run build\` first.`);
  process.exit(1);
}

// Find the client mount entry (the chunk that calls hydrateRoot/createRoot).
let entry;
let entryCss;
for (const file of readdirSync(assetsDir)) {
  if (!file.endsWith(".js")) continue;
  const contents = readFileSync(join(assetsDir, file), "utf8");
  if (contents.includes("hydrateRoot(document") || contents.includes("createRoot(document")) {
    entry = file;
    break;
  }
}
if (!entry) {
  console.error("[build-vercel] Could not locate client entry chunk in dist/client/assets.");
  process.exit(1);
}

// Find a top-level CSS asset (Tailwind/global styles).
for (const file of readdirSync(assetsDir)) {
  if (file.endsWith(".css")) {
    entryCss = file;
    break;
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>App</title>
${entryCss ? `    <link rel="stylesheet" href="/assets/${entryCss}" />\n` : ""}    <script type="module" src="/assets/${entry}"></script>
  </head>
  <body></body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html);
console.log(`[build-vercel] Wrote ${clientDir}/index.html (entry: ${entry}${entryCss ? `, css: ${entryCss}` : ""})`);