#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  MyOllama - Ollama Model Management

  Usage: myollama [options]

  Options:
    --port, -p <port>   Port to run on (default: 3000)
    --host <host>        Host to bind to (default: 127.0.0.1)
    --version, -v        Show version
    --help, -h           Show this help message
  `);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  const pkg = require("../package.json");
  console.log(pkg.version);
  process.exit(0);
}

function getArg(flags) {
  for (const flag of flags) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  }
  return null;
}

const port = getArg(["--port", "-p"]) || "3000";
const host = getArg(["--host"]) || "127.0.0.1";

const standaloneDir = path.join(__dirname, "..", ".next", "standalone");
const serverPath = path.join(standaloneDir, "server.js");

if (!fs.existsSync(serverPath)) {
  console.error("Error: Standalone server not found. Run 'npm run build' first.");
  process.exit(1);
}

// Copy static files if not already in place
const staticSrc = path.join(__dirname, "..", ".next", "static");
const staticDest = path.join(standaloneDir, ".next", "static");
if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
}

const publicSrc = path.join(__dirname, "..", "public");
const publicDest = path.join(standaloneDir, "public");
if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
}

console.log(`🦙 MyOllama starting on http://${host}:${port}`);

const server = spawn("node", [serverPath], {
  env: { ...process.env, PORT: port, HOSTNAME: host },
  stdio: "inherit",
  cwd: standaloneDir,
});

server.on("error", (err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  process.exit(0);
});
