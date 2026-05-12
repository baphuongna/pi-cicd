/**
 * Unit tests: CI status command
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  ciStatusHandler,
  registerRun,
  clearRuns,
  getRun,
  createRunTracker,
  type CIRunRecord,
} from "../../src/tools/ci_status.ts";

describe("ciStatusHandler()", () => {
  beforeEach(() => {
    clearRuns();
  });

  it("returns 'no runs found' when no runs exist", () => {
    const result = ciStatusHandler(undefined);
    assert.ok(result.includes("No CI runs found"));
  });

  it("returns status for a registered run", () => {
    registerRun({
      id: "run-001",
      startTime: "2025-01-01T00:00:00.000Z",
      events: [
        { type: "ci_start", timestamp: "2025-01-01T00:00:00.000Z", task: "test", mode: "single" },
        { type: "ci_end", timestamp: "2025-01-01T00:00:03.000Z", exit_code: 0, duration_ms: 3000 },
      ],
      exitCode: 0,
      durationMs: 3000,
    });

    const result = ciStatusHandler(undefined);
    assert.ok(result.includes("run-001"));
    assert.ok(result.includes("SUCCESS"));
  });

  it("returns specific run by ID", () => {
    registerRun({
      id: "run-002",
      startTime: "2025-01-01T00:00:00.000Z",
      events: [
        { type: "ci_start", timestamp: "", task: "t", mode: "single" },
        { type: "ci_end", timestamp: "", exit_code: 10, duration_ms: 5000 },
      ],
      exitCode: 10,
      durationMs: 5000,
    });

    const result = ciStatusHandler("run-002");
    assert.ok(result.includes("BLOCKED"));
  });

  it("supports prefix match for run ID", () => {
    registerRun({
      id: "abc123def",
      startTime: "2025-01-01T00:00:00.000Z",
      events: [],
    });

    const result = ciStatusHandler("abc123");
    assert.ok(result.includes("abc123def"));
  });

  it("returns 'not found' for unknown run ID", () => {
    const result = ciStatusHandler("nonexistent");
    assert.ok(result.includes("No CI run found"));
  });
});

describe("createRunTracker()", () => {
  beforeEach(() => {
    clearRuns();
  });

  it("collects events and finalizes into a run record", () => {
    const tracker = createRunTracker("run-track-1");
    tracker.collector.emit({ type: "ci_start", timestamp: "", task: "t", mode: "single" });
    tracker.collector.emit({ type: "ci_end", timestamp: "", exit_code: 0, duration_ms: 100 });

    const record = tracker.finalize();
    assert.equal(record.id, "run-track-1");
    assert.equal(record.events.length, 2);
    assert.equal(record.exitCode, 0);
    assert.equal(record.durationMs, 100);
  });

  it("registers the run for status lookups", () => {
    const tracker = createRunTracker("run-track-2");
    tracker.collector.emit({ type: "ci_end", timestamp: "", exit_code: 0, duration_ms: 50 });
    tracker.finalize();

    const found = getRun("run-track-2");
    assert.ok(found);
    assert.equal(found.id, "run-track-2");
  });
});
