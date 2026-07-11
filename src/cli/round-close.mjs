import fs from "node:fs";
import path from "node:path";
import { ensureDir, exists, templatesDir } from "../paths.mjs";
import { systemLayout, initSystemBrain } from "../sync/brain-sync.mjs";
import { recordEvent } from "../telemetry/recorder.mjs";

export function appendGrowthRow(opts = {}) {
  const ledgerPath = opts.ledgerPath;
  const row = `${opts.date || new Date().toISOString().slice(0, 10)} | ${opts.tag || "round"} | ${opts.summary || "no-op"} | ${opts.lesson || "no-op"}\n`;
  ensureDir(path.dirname(ledgerPath));
  if (!exists(ledgerPath)) {
    fs.writeFileSync(ledgerPath, "# Growth ledger (append-only)\n\nFormat: `YYYY-MM-DD | <round-tag> | <action-summary> | <lesson-or-noop>`\n\n", "utf8");
  }
  fs.appendFileSync(ledgerPath, row, "utf8");
  return { ledgerPath, row: row.trim() };
}

export function scaffoldFeedback(opts = {}) {
  const topic = (opts.topic || "lesson").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const memoryDir = opts.memoryDir;
  ensureDir(memoryDir);
  const file = path.join(memoryDir, `feedback_${topic}.md`);
  if (exists(file) && !opts.force) return { file, created: false };

  const body = `---
name: feedback-${topic}
description: "${opts.description || "Future-tense rule this feedback captures."}"
metadata:
  node_type: memory
  type: feedback
  originSessionId: ${opts.sessionId || "manual"}
---

## When it fires
${opts.when || "<situation>"}

## Why
${opts.why || "<lesson>"}

## How to apply
${opts.how || "<new rule>"}

## Anti-pattern
${opts.anti || "<what to watch for>"}
`;
  fs.writeFileSync(file, body, "utf8");
  return { file, created: true };
}

export function roundClose(opts = {}) {
  const sys = systemLayout(opts.systemHome);
  const projectGrowth = opts.projectGrowth || path.join(opts.cwd || process.cwd(), "GROWTH.md");
  const memoryDir = opts.projectMemory || path.join(opts.cwd || process.cwd(), ".cto-brain", "memory");

  const results = {
    system: appendGrowthRow({
      ledgerPath: sys.growthLedger,
      date: opts.date,
      tag: opts.tag,
      summary: opts.summary,
      lesson: opts.lesson,
    }),
  };

  if (opts.project !== false && exists(path.dirname(projectGrowth))) {
    results.project = appendGrowthRow({
      ledgerPath: projectGrowth,
      date: opts.date,
      tag: opts.tag,
      summary: opts.summary,
      lesson: opts.lesson,
    });
  }

  if (opts.feedbackTopic) {
    results.feedback = scaffoldFeedback({
      memoryDir: opts.feedbackMemory || memoryDir,
      topic: opts.feedbackTopic,
      description: opts.feedbackDescription,
      when: opts.feedbackWhen,
      why: opts.feedbackWhy,
      how: opts.feedbackHow,
      anti: opts.feedbackAnti,
      sessionId: opts.sessionId,
      force: opts.forceFeedback,
    });
  } else if (opts.noOp !== false && !opts.lesson) {
    results.noop = true;
  }

  // Cost-per-outcome accrues at the round boundary. Best-effort (recordEvent
  // swallows failures): telemetry must never break the ritual. Token flags
  // arrive as strings from the CLI; non-finite values are dropped, never NaN.
  recordEvent(
    {
      kind: "round_close",
      outcome: opts.outcome || "round-closed",
      tokensIn: Number(opts.tokensIn),
      tokensOut: Number(opts.tokensOut),
      ok: true,
    },
    sys.home
  );

  return results;
}

export function deployCto(opts = {}) {
  initSystemBrain(opts.systemHome);
  const sys = systemLayout(opts.systemHome);
  const cwd = opts.cwd || process.cwd();
  const projectName = opts.projectName || path.basename(cwd);
  const slug = projectName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const ctoId = opts.ctoId || `${slug}-cto`;

  const charterTpl = path.join(templatesDir(), "CHARTER.md");
  const charterPath = path.join(cwd, "CHARTER.md");
  if (!exists(charterPath) && exists(charterTpl)) {
    let text = fs.readFileSync(charterTpl, "utf8");
    text = text
      .replace(/\{\{projectName\}\}/g, projectName)
      .replace(/\{\{ctoId\}\}/g, ctoId)
      .replace(/\{\{cwd\}\}/g, cwd)
      .replace(/\{\{date\}\}/g, new Date().toISOString().slice(0, 10));
    fs.writeFileSync(charterPath, text, "utf8");
  }

  const row = `${projectName} | ${ctoId} | ${cwd} | ${charterPath} | active | ${new Date().toISOString().slice(0, 10)} | deployed via cto-brain\n`;
  ensureDir(path.dirname(sys.portfolio));
  if (!exists(sys.portfolio)) {
    fs.writeFileSync(sys.portfolio, "# Portfolio — lead-CTO map\n\n", "utf8");
  }
  const portfolio = fs.readFileSync(sys.portfolio, "utf8");
  if (!portfolio.includes(cwd)) {
    fs.appendFileSync(sys.portfolio, row, "utf8");
  }

  const briefPath = path.join(cwd, ".cto-brain", "first-round-brief.md");
  ensureDir(path.dirname(briefPath));
  if (!exists(briefPath)) {
    fs.writeFileSync(
      briefPath,
      `# First round brief — ${projectName}

## Goal
Ship the first integration round with frozen contracts and a validation matrix.

## Background
Read CHARTER.md, project-addendum.md, and GROWTH.md first.

## Scope
**You may touch:** (fill per decomposition)
**You may NOT touch:** (owned by other agents)

## Output format
Structured summary: modified files, validation performed, open questions.

## Reminders
- DO NOT commit. Parent integrates.
- Run reviewer trio before release tag.
`,
      "utf8"
    );
  }

  return { ctoId, charterPath, portfolio: sys.portfolio, briefPath };
}
