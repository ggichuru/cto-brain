// Tiny zero-dependency ANSI/UX helpers for the CLI.
//
// Color is OFF when: NO_COLOR is set, stdout is not a TTY (piped), or the
// operator passed --no-color. It is forced ON by CLICOLOR_FORCE=1. Human
// rendering is used in a terminal; piped/`--json` callers get raw JSON
// (see useJson) so CI and the test suites stay byte-stable.

let COLOR = computeDefaultColor();

function computeDefaultColor() {
  if (process.env.CLICOLOR_FORCE === "1") return true;
  if (process.env.NO_COLOR != null && process.env.NO_COLOR !== "") return false;
  return !!process.stdout.isTTY;
}

export function setColorEnabled(on) {
  COLOR = !!on;
}

export function colorEnabled() {
  return COLOR;
}

// True when the caller wants machine output: explicit --json, or stdout is
// piped (not a TTY). Keeps `cto-brain router plan | jq` and CI deterministic.
export function useJson(args = {}) {
  if (args.json) return true;
  return !process.stdout.isTTY;
}

function paint(code, s) {
  return COLOR ? `[${code}m${s}[0m` : String(s);
}

export const bold = (s) => paint("1", s);
export const dim = (s) => paint("2", s);
export const red = (s) => paint("31", s);
export const green = (s) => paint("32", s);
export const yellow = (s) => paint("33", s);
export const cyan = (s) => paint("36", s);
export const gray = (s) => paint("90", s);

export const sym = {
  ok: () => green("✓"),
  bad: () => red("✗"),
  warn: () => yellow("⚠"),
  dot: () => gray("•"),
  arrow: () => cyan("›"),
};

// Strip ANSI for width math (so alignment is correct even with color on).
const ANSI = /\[[0-9;]*m/g;
const width = (s) => String(s).replace(ANSI, "").length;

export function heading(s) {
  return bold(cyan(s));
}

export function rule(n = 48) {
  return gray("─".repeat(n));
}

// Aligned key/value block. pairs: [ [key, value], ... ].
export function kv(pairs, indent = 2) {
  const keyW = Math.max(0, ...pairs.map(([k]) => width(k)));
  const pad = " ".repeat(indent);
  return pairs
    .map(([k, v]) => `${pad}${dim(k)}${" ".repeat(keyW - width(k) + 2)}${v}`)
    .join("\n");
}

// Simple left-aligned table. headers: [string]; rows: [[cell,...]].
export function table(headers, rows, indent = 2) {
  const cols = headers.length;
  const w = headers.map((h, i) => Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))));
  const pad = " ".repeat(indent);
  const fmt = (cells, paint) =>
    pad +
    cells
      .map((c, i) => {
        const cell = c ?? "";
        return cell + " ".repeat(w[i] - width(cell) + (i < cols - 1 ? 2 : 0));
      })
      .join("");
  const out = [fmt(headers.map((h) => bold(h)))];
  out.push(pad + gray("─".repeat(w.reduce((a, b) => a + b, 0) + (cols - 1) * 2)));
  for (const r of rows) out.push(fmt(r));
  return out.join("\n");
}
