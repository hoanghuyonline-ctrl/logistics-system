/**
 * Copies static assets into the Next.js standalone build directory.
 *
 * The standalone output (output: "standalone") bundles server code but
 * excludes .next/static and public/. This script copies them so that
 * `node .next/standalone/server.js` serves CSS, JS, and public files.
 *
 * Runs automatically after `npm run build` via the postbuild hook.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

const copies = [
  { src: path.join(root, ".next", "static"), dest: path.join(standalone, ".next", "static") },
  { src: path.join(root, "public"), dest: path.join(standalone, "public") },
];

for (const { src, dest } of copies) {
  if (!fs.existsSync(src)) {
    console.log(`[postbuild] Skipping ${path.relative(root, src)} (not found)`);
    continue;
  }
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[postbuild] Copied ${path.relative(root, src)} → ${path.relative(root, dest)}`);
}
