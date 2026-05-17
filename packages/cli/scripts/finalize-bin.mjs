#!/usr/bin/env node
/**
 * finalize-bin.mjs — runs after `tsc`. Ensures `dist/index.js` is executable
 * (Node compiles without preserving the source shebang's executable bit).
 */
import { chmod, access, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = resolve(__dirname, "..");
const binPath = resolve(cliRoot, "dist", "index.js");

try {
  await access(binPath);
} catch {
  process.stderr.write(`finalize-bin: ${binPath} not found (did tsc run?)\n`);
  process.exit(1);
}

// Ensure shebang is present (tsc preserves it, but double-check).
const src = await readFile(binPath, "utf8");
if (!src.startsWith("#!")) {
  await writeFile(binPath, `#!/usr/bin/env node\n${src}`);
}

await chmod(binPath, 0o755);
process.stdout.write(`finalize-bin: chmod +x ${binPath}\n`);
