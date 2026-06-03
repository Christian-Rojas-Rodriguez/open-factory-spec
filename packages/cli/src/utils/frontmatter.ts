/**
 * Minimal YAML-frontmatter reader for Spec files. Zero-dependency, intentionally
 * small: it understands the subset the factory's Specs actually use —
 *   key: value            (scalars, optionally quoted)
 *   key:                  (followed by "  - item" lines → string[])
 * Nested list-of-objects (e.g. `declares:`) are recorded as raw item strings;
 * we only need their presence, not their structure.
 */
export interface Frontmatter {
  /** Scalar `key: value` pairs. */
  data: Record<string, string>;
  /** `key:` blocks whose items are `- item` lines. */
  lists: Record<string, string[]>;
  /** Every top-level key seen (scalars + lists). */
  has: Set<string>;
  /** Markdown body after the closing `---`. */
  body: string;
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

export function parseFrontmatter(content: string): Frontmatter | null {
  if (!content.startsWith("---")) return null;
  // Find the closing fence at the start of a line.
  const closeIdx = content.indexOf("\n---", 3);
  if (closeIdx === -1) return null;

  const fmText = content.slice(3, closeIdx).replace(/^\r?\n/, "");
  // Body starts after the line containing the closing `---`.
  const afterFence = content.slice(closeIdx + 4);
  const body = afterFence.replace(/^[^\n]*\r?\n/, "");

  const data: Record<string, string> = {};
  const lists: Record<string, string[]> = {};
  const has = new Set<string>();
  let currentKey: string | null = null;

  for (const rawLine of fmText.split("\n")) {
    if (!rawLine.trim()) continue;
    const indented = /^\s/.test(rawLine);

    if (!indented) {
      const m = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (m) {
        const key = m[1]!;
        const val = m[2] ?? "";
        has.add(key);
        currentKey = key;
        if (val === "") {
          lists[key] = lists[key] ?? [];
        } else {
          data[key] = stripQuotes(val);
        }
        continue;
      }
    }

    const item = rawLine.match(/^\s*-\s+(.*)$/);
    if (item && currentKey) {
      (lists[currentKey] ??= []).push(stripQuotes(item[1]!));
    }
    // Nested "  key: value" lines under a list-of-objects are ignored.
  }

  return { data, lists, has, body };
}

/** True if the markdown body contains a heading line `## <title>` (exact, trimmed). */
export function hasSection(body: string, title: string): boolean {
  const want = title.replace(/^#+\s*/, "").trim().toLowerCase();
  return body
    .split("\n")
    .some((l) => {
      const m = l.match(/^##\s+(.*)$/);
      return m ? m[1]!.trim().toLowerCase() === want : false;
    });
}

/** Return the lines of a `## <title>` section, up to the next `## ` heading. */
export function sectionLines(body: string, title: string): string[] {
  const want = title.replace(/^#+\s*/, "").trim().toLowerCase();
  const lines = body.split("\n");
  const out: string[] = [];
  let inside = false;
  for (const l of lines) {
    const h = l.match(/^##\s+(.*)$/);
    if (h) {
      const isTarget = h[1]!.trim().toLowerCase() === want;
      if (inside && !isTarget) break; // next section reached
      inside = isTarget;
      continue;
    }
    if (inside) out.push(l);
  }
  return out;
}
