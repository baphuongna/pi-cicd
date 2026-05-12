/**
 * Unit tests: report generation
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateReport } from "../../src/ci/report.ts";
import type { CIEvent } from "../../src/types.ts";

describe("generateReport()", () => {
  const events: CIEvent[] = [
    { type: "ci_start", timestamp: "2025-01-01T00:00:00.000Z", task: "test", mode: "single" },
    { type: "ci_test", timestamp: "2025-01-01T00:00:01.000Z", command: "npm test", passed: 10, failed: 2 },
    { type: "ci_cost", timestamp: "2025-01-01T00:00:02.000Z", tokens: { input: 5000, output: 800 }, cost_usd: 0.04 },
    { type: "ci_end", timestamp: "2025-01-01T00:00:03.000Z", exit_code: 1, duration_ms: 3000 },
  ];

  it("JSONL report contains all events in order", () => {
    const report = generateReport(events);
    const lines = report.split("\n");
    assert.equal(lines.length, 4);

    for (let i = 0; i < lines.length; i++) {
      const parsed = JSON.parse(lines[i]);
      assert.equal(parsed.type, events[i].type);
    }
  });

  it("summary report includes pass/fail counts", () => {
    const report = generateReport(events, { format: "summary" });
    assert.ok(report.includes("10 passed"), "should include passed count");
    assert.ok(report.includes("2 failed"), "should include failed count");
    assert.ok(report.includes("Exit Code: 1"), "should include exit code");
    assert.ok(report.includes("3.0s"), "should include duration");
  });

  it("summary report aggregates cost correctly", () => {
    const eventsWithCost: CIEvent[] = [
      { type: "ci_start", timestamp: "", task: "t", mode: "single" },
      { type: "ci_cost", timestamp: "", tokens: { input: 1000, output: 200 }, cost_usd: 0.01 },
      { type: "ci_cost", timestamp: "", tokens: { input: 2000, output: 300 }, cost_usd: 0.02 },
      { type: "ci_end", timestamp: "", exit_code: 0, duration_ms: 1000 },
    ];

    const report = generateReport(eventsWithCost, { format: "summary" });
    assert.ok(report.includes("$0.0300"), "should sum costs");
  });

  it("handles empty events", () => {
    const report = generateReport([]);
    assert.equal(report, "");
  });
});
