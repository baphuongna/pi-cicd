/**
 * Unit tests: config loading
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadCiConfig, DEFAULT_CONFIG } from "../../src/config.ts";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadCiConfig()", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `pi-ci-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  it("returns defaults when no config file exists", async () => {
    const config = await loadCiConfig(testDir);
    assert.equal(config.enabled, true);
    assert.equal(config.idleTimeoutMs, 15_000);
    assert.equal(config.maxRetries, 3);
    assert.equal(config.retryBackoffMaxMs, 30_000);
    assert.equal(config.exitCodes.success, 0);
    assert.equal(config.exitCodes.error, 1);
    assert.equal(config.exitCodes.blocked, 10);
    assert.equal(config.exitCodes.cancelled, 11);
    assert.equal(config.exitCodes.needsInput, 12);
  });

  it("merges user config with defaults", async () => {
    const piDir = join(testDir, ".pi");
    await mkdir(piDir, { recursive: true });
    await writeFile(
      join(piDir, "pi-ci.json"),
      JSON.stringify({ idleTimeoutMs: 30_000, enabled: false }),
    );

    const config = await loadCiConfig(testDir);
    assert.equal(config.enabled, false);
    assert.equal(config.idleTimeoutMs, 30_000);
    // Defaults preserved
    assert.equal(config.maxRetries, 3);
    assert.equal(config.exitCodes.success, 0);
  });

  it("handles invalid JSON gracefully", async () => {
    const piDir = join(testDir, ".pi");
    await mkdir(piDir, { recursive: true });
    await writeFile(join(piDir, "pi-ci.json"), "not json");

    // Should throw on invalid JSON
    await assert.rejects(() => loadCiConfig(testDir));
  });

  it("handles non-object JSON by returning defaults", async () => {
    const piDir = join(testDir, ".pi");
    await mkdir(piDir, { recursive: true });
    await writeFile(join(piDir, "pi-ci.json"), "42");

    const config = await loadCiConfig(testDir);
    assert.equal(config.enabled, true);
  });
});

describe("DEFAULT_CONFIG", () => {
  it("has all required fields", () => {
    assert.equal(typeof DEFAULT_CONFIG.enabled, "boolean");
    assert.equal(typeof DEFAULT_CONFIG.idleTimeoutMs, "number");
    assert.equal(typeof DEFAULT_CONFIG.maxRetries, "number");
    assert.equal(typeof DEFAULT_CONFIG.retryBackoffMaxMs, "number");
    assert.ok(DEFAULT_CONFIG.exitCodes);
    assert.ok(DEFAULT_CONFIG.report);
    assert.equal(DEFAULT_CONFIG.report.format, "jsonl");
  });
});
