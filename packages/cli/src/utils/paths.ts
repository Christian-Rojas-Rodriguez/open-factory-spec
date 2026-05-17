import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * Resolve the templates directory relative to the installed CLI.
 * When published: `<package-root>/templates/`.
 * When running from source: also `<package-root>/templates/` (created by sync-templates.mjs).
 */
export function getTemplatesDir(): string {
  // src/utils/paths.ts → dist/utils/paths.js after compile
  // Either way, three levels up from this file lands on the package root.
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "templates");
}
