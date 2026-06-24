import fs from "node:fs";
import path from "node:path";
import { ensureDir, exists, systemBrainHome } from "../paths.mjs";
import { systemLayout } from "../sync/brain-sync.mjs";

function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function writeWeeklyDigest(opts = {}) {
  const sys = systemLayout(opts.systemHome || systemBrainHome());
  const week = opts.week || isoWeek();
  const digestPath = path.join(sys.memory, `portfolio_digest_${week}.md`);

  if (exists(digestPath) && !opts.force) {
    return { digestPath, created: false, week };
  }

  ensureDir(sys.memory);
  const portfolio = exists(sys.portfolio) ? fs.readFileSync(sys.portfolio, "utf8") : "(no portfolio.md)";

  const body = `# Portfolio digest — ${week}

**Lead-CTO weekly read.** One paragraph per active project: what shipped, what's stuck, what to reprioritize.

## Portfolio map (snapshot)

\`\`\`
${portfolio.trim()}
\`\`\`

## Per-project notes

<!-- Append one paragraph per project after reading each STATUS.md / GROWTH.md -->

## Cross-project synthesis

<!-- Promote lessons that fired in 2+ projects via: cto-brain sync --promote -->

## Next lead-tier actions

- [ ] Read BLOCKER/ESCALATE entries
- [ ] Reprioritize human attention for the week
- [ ] Promote general lessons to system brain policy

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(digestPath, body, "utf8");
  return { digestPath, created: true, week };
}
