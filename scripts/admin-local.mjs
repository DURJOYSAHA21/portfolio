// `npm run local` — try the site and the /admin dashboard on this computer.
//
// Starts `next dev` (http://localhost:3000) plus a tiny helper on :4100 that lets
// /admin's "local mode" read and write the files in this working copy instead of
// GitHub. Saving rewrites src/content/site.json (and any uploaded file in public/),
// and the dev server hot-reloads the page. Nothing is committed or published —
// review with `git diff`, undo with `git checkout -- <file>`.
//
//   node scripts/admin-local.mjs            helper + next dev
//   node scripts/admin-local.mjs --api-only helper only (if next dev already runs)

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_PATH = "src/content/site.json";
const PORT = 4100;
const MAX_BODY = 60 * 1024 * 1024;

const blobSha = (buf) => createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
const readContent = () => readFileSync(join(ROOT, CONTENT_PATH));

/** Only the content file and files under public/ may be written. */
function target(path) {
  if (typeof path !== "string") return null;
  if (path !== CONTENT_PATH && !path.startsWith("public/")) return null;
  const full = resolve(ROOT, path);
  const rel = relative(ROOT, full);
  if (rel.startsWith("..") || rel.split(sep).includes("..")) return null;
  return full;
}

function send(req, res, status, body) {
  const origin = req.headers.origin ?? "";
  const allowed = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...(allowed && {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }),
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const server = createServer((req, res) => {
  if (req.method === "OPTIONS") return send(req, res, 204);

  if (req.method === "GET" && req.url === "/health") return send(req, res, 200, { ok: true });

  if (req.method === "GET" && req.url === "/content") {
    try {
      const buf = readContent();
      return send(req, res, 200, { content: JSON.parse(buf.toString("utf8")), sha: blobSha(buf) });
    } catch (e) {
      return send(req, res, 500, { error: `Could not read ${CONTENT_PATH}: ${e.message}` });
    }
  }

  if (req.method === "POST" && req.url === "/save") {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) req.destroy();
      else chunks.push(c);
    });
    req.on("end", () => {
      try {
        const { changes, expectedSha, force } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!force && blobSha(readContent()) !== expectedSha) {
          return send(req, res, 409, {
            conflict: true,
            error: `${CONTENT_PATH} was changed on disk since the dashboard loaded it.`,
          });
        }
        const writes = changes.map((c) => {
          const full = target(c.path);
          if (!full) throw new Error(`Refusing to write outside the content file and public/: ${c.path}`);
          const buf = Buffer.from(c.base64, "base64");
          if (c.path === CONTENT_PATH) JSON.parse(buf.toString("utf8")); // never write broken JSON
          return { full, buf, path: c.path };
        });
        for (const w of writes) {
          mkdirSync(dirname(w.full), { recursive: true });
          writeFileSync(w.full, w.buf);
          console.log(`  [admin] wrote ${w.path} (${(w.buf.length / 1024).toFixed(1)} KB)`);
        }
        return send(req, res, 200, {
          commitSha: `local-${Date.now()}`,
          commitUrl: "",
          contentSha: blobSha(readContent()),
        });
      } catch (e) {
        return send(req, res, 400, { error: e.message });
      }
    });
    return;
  }

  send(req, res, 404, { error: "Not found" });
});

server.on("error", (e) => {
  console.error(e.code === "EADDRINUSE" ? `Port ${PORT} is busy — is the helper already running?` : e);
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  admin helper on http://localhost:${PORT}`);
  console.log("  open http://localhost:3000/admin/ → “use local mode”\n");
});

if (!process.argv.includes("--api-only")) {
  const next = spawn(process.execPath, [join(ROOT, "node_modules/next/dist/bin/next"), "dev"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  const stop = () => {
    next.kill();
    server.close();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  next.on("exit", (code) => {
    server.close();
    process.exit(code ?? 0);
  });
}
