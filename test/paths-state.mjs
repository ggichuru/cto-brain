// ADR-0005: cto-code owns an isolated XDG runtime-state dir; writes are atomic;
// a lock file prevents concurrent launches from racing.
// Hermetic: XDG_STATE_HOME is redirected to a throwaway tmp dir so nothing
// touches the real home.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { stateDir, writeAtomic, withLock } from "../src/paths.mjs";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "paths-"));
process.env.XDG_STATE_HOME = TMP;

test("stateDir respects XDG_STATE_HOME", () => {
  assert.equal(stateDir(), path.join(TMP, "cto-code"));
  assert.equal(stateDir("runtime"), path.join(TMP, "cto-code", "runtime"));
});

test("stateDir falls back to ~/.local/state/cto-code without XDG_STATE_HOME", () => {
  const saved = process.env.XDG_STATE_HOME;
  delete process.env.XDG_STATE_HOME;
  try {
    const d = stateDir("x");
    assert.match(d, /\.local[\\/]state[\\/]cto-code[\\/]x$/);
  } finally {
    process.env.XDG_STATE_HOME = saved;
  }
});

test("stateDir does not create the directory (pure path)", () => {
  const d = stateDir("never-created");
  assert.equal(fs.existsSync(d), false);
});

test("writeAtomic writes content and leaves no .tmp-* sibling", () => {
  const dir = path.join(TMP, "atomic");
  const target = path.join(dir, "state.json");
  writeAtomic(target, "hello-atomic");
  assert.equal(fs.readFileSync(target, "utf8"), "hello-atomic");
  const leftovers = fs.readdirSync(dir).filter((f) => /\.tmp-/.test(f));
  assert.deepEqual(leftovers, []);
});

test("writeAtomic accepts a Buffer", () => {
  const target = path.join(TMP, "atomic-buf", "b.bin");
  writeAtomic(target, Buffer.from([1, 2, 3]));
  assert.deepEqual([...fs.readFileSync(target)], [1, 2, 3]);
});

test("withLock runs fn, returns its value, and releases the lock", () => {
  const lockFile = path.join(stateDir("locks"), "run.lock");
  const out = withLock("run", () => 42);
  assert.equal(out, 42);
  assert.equal(fs.existsSync(lockFile), false);
});

test("withLock releases the lock even when fn throws", () => {
  assert.throws(() => withLock("boom", () => { throw new Error("kaboom"); }), /kaboom/);
  // If the lock were leaked, this second acquisition would throw "is locked".
  const out = withLock("boom", () => "recovered");
  assert.equal(out, "recovered");
});

test("withLock throws when the lock is already held", () => {
  assert.throws(
    () => withLock("nested", () => withLock("nested", () => "inner")),
    /cto-code: 'nested' is locked/,
  );
});
