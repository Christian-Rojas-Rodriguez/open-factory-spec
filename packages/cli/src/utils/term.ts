const supportsColor =
  process.stdout.isTTY === true &&
  process.env["NO_COLOR"] === undefined &&
  process.env["TERM"] !== "dumb";

function wrap(open: number, close: number): (s: string) => string {
  if (!supportsColor) return (s) => s;
  return (s) => `\x1b[${open}m${s}\x1b[${close}m`;
}

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
};

export function line(s = ""): void {
  process.stdout.write(s + "\n");
}

export function errLine(s = ""): void {
  process.stderr.write(s + "\n");
}

export async function confirm(question: string, defaultYes = false): Promise<boolean> {
  const suffix = defaultYes ? "[Y/n]" : "[y/N]";
  process.stdout.write(`${question} ${c.dim(suffix)} `);
  const ans = await readSingleLine();
  if (!ans) return defaultYes;
  return /^y(es)?$/i.test(ans.trim());
}

export async function selectOne<T>(
  question: string,
  options: ReadonlyArray<{ label: string; value: T }>,
  defaultIndex = 0,
): Promise<T> {
  process.stdout.write(`${question}\n`);
  options.forEach((opt, i) => {
    const num = c.bold(String(i + 1));
    const marker = i === defaultIndex ? c.cyan("›") : " ";
    process.stdout.write(`  ${marker} ${num}. ${opt.label}\n`);
  });
  process.stdout.write(`\n${c.dim(`Enter number (1–${options.length})`)} [${c.bold(String(defaultIndex + 1))}]: `);

  const defaultOpt = options[defaultIndex] ?? options[0];
  if (!defaultOpt) throw new Error("selectOne: options array is empty");

  const raw = await readSingleLine();
  const trimmed = raw.trim();
  if (!trimmed) return defaultOpt.value;
  const n = parseInt(trimmed, 10);
  if (Number.isInteger(n) && n >= 1 && n <= options.length) {
    return (options[n - 1] ?? defaultOpt).value;
  }
  // Try matching by label prefix or exact value string.
  const match = options.find(
    (o) =>
      String(o.value).toLowerCase() === trimmed.toLowerCase() ||
      o.label.toLowerCase().startsWith(trimmed.toLowerCase()),
  );
  if (match) return match.value;

  // Fall back to default silently.
  return defaultOpt.value;
}

async function readSingleLine(): Promise<string> {
  return new Promise((resolve) => {
    let buffer = "";
    const onData = (chunk: Buffer) => {
      const s = chunk.toString("utf8");
      buffer += s;
      if (s.includes("\n") || s.includes("\r")) {
        process.stdin.off("data", onData);
        process.stdin.pause();
        resolve(buffer.replace(/[\r\n]+$/, ""));
      }
    };
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}
