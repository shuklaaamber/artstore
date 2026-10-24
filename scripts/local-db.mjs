// Dev-only: a project-local Postgres (PGlite, WASM) so no external DB is needed. Data persists in ./.pgdata.
// URL: postgres://postgres:postgres@127.0.0.1:54330/postgres
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const db = await PGlite.create({ dataDir: "./.pgdata" });
const server = new PGLiteSocketServer({ db, port: 54330, host: "127.0.0.1", maxConnections: 10 });
await server.start();
console.log("Local Postgres ready: postgres://postgres:postgres@127.0.0.1:54330/postgres");

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, async () => { await server.stop(); await db.close(); process.exit(0); });
