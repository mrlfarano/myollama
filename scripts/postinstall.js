#!/usr/bin/env node

// Ensures platform-specific native bindings are installed.
// npm sometimes fails to resolve optional platform bindings correctly,
// particularly on Windows. This script detects and fixes missing bindings.

const { execSync } = require("child_process");

const platformBindings = {
  "win32-x64": "@rolldown/binding-win32-x64-msvc",
  "win32-arm64": "@rolldown/binding-win32-arm64-msvc",
  "darwin-x64": "@rolldown/binding-darwin-x64",
  "darwin-arm64": "@rolldown/binding-darwin-arm64",
  "linux-x64": "@rolldown/binding-linux-x64-gnu",
  "linux-arm64": "@rolldown/binding-linux-arm64-gnu",
};

const key = `${process.platform}-${process.arch}`;
const binding = platformBindings[key];

if (!binding) return;

try {
  require.resolve(binding);
} catch {
  console.log(`Installing missing native binding: ${binding}`);
  try {
    execSync(`npm install ${binding} --no-save --no-audit --no-fund`, {
      stdio: "inherit",
    });
  } catch {
    // Non-fatal — binding may not be needed in all contexts (e.g., production)
  }
}
