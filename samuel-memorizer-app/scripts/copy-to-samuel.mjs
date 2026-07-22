import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const dist = join(root, "dist");
const pages = join(root, "..", "samuel");

function emptyDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = join(dir, entry.name);
    rmSync(target, { recursive: true, force: true });
  }
}

emptyDir(pages);
cpSync(dist, pages, { recursive: true });
console.log(`Copied ${dist} -> ${pages}`);
