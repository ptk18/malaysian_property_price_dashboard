import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const buildDirectory = new URL("../.next/", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);

// Next.js standalone output omits static assets; include them before serving.
cpSync(
  new URL("static/", buildDirectory),
  new URL("standalone/.next/static/", buildDirectory),
  { recursive: true },
);
if (existsSync(publicDirectory)) {
  cpSync(publicDirectory, new URL("standalone/public/", buildDirectory), {
    recursive: true,
  });
}

process.env.HOSTNAME ||= "0.0.0.0";
await import(fileURLToPath(new URL("standalone/server.js", buildDirectory)));
