/**
 * Unit tests: test result parsing
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTestResults } from "../../src/ci/test-runner.ts";

describe("parseTestResults() — TAP", () => {
  it("parses TAP output correctly", () => {
    const output = [
      "TAP version 13",
      "1..5",
      "ok 1 - first test",
      "not ok 2 - failing test",
      "ok 3 - third test",
      "ok 4 - fourth test",
      "ok 5 - fifth test",
    ].join("\n");

    const result = parseTestResults(output, "tap");
    assert.equal(result.passed, 4);
    assert.equal(result.failed, 1);
    assert.equal(result.total, 5);
  });

  it("handles all-passing TAP output", () => {
    const output = "1..3\nok 1\nok 2\nok 3";
    const result = parseTestResults(output, "tap");
    assert.equal(result.passed, 3);
    assert.equal(result.failed, 0);
  });
});

describe("parseTestResults() — Jest", () => {
  it("parses Jest-style summary", () => {
    const output = [
      "PASS src/auth.test.ts",
      "  ✓ should login (5 ms)",
      "  ✕ should fail (2 ms)",
      "",
      "Tests:       1 passed, 1 failed, 2 total",
      "Time:        3.456 s",
    ].join("\n");

    const result = parseTestResults(output, "jest");
    assert.equal(result.passed, 1);
    assert.equal(result.failed, 1);
    assert.equal(result.total, 2);
    assert.equal(result.duration_ms, 3456);
  });

  it("handles Jest output with only passed", () => {
    const output = "Tests:       5 passed, 5 total\nTime:        1.000 s";
    const result = parseTestResults(output, "jest");
    assert.equal(result.passed, 5);
    assert.equal(result.failed, 0);
    assert.equal(result.total, 5);
    assert.equal(result.duration_ms, 1000);
  });

  it("parses Vitest-style summary", () => {
    const output = [
      "Tests  3 passed | 1 failed (4)",
      "Duration  2.50s",
    ].join("\n");

    const result = parseTestResults(output, "vitest");
    assert.equal(result.passed, 3);
    assert.equal(result.failed, 1);
    assert.equal(result.total, 4);
    assert.equal(result.duration_ms, 2500);
  });

  it("handles empty output", () => {
    const result = parseTestResults("", "jest");
    assert.equal(result.passed, 0);
    assert.equal(result.failed, 0);
    assert.equal(result.total, 0);
  });

  it("handles whitespace-only output", () => {
    const result = parseTestResults("   \n  ", "jest");
    assert.equal(result.total, 0);
  });

  it("handles malformed output", () => {
    const result = parseTestResults("random garbage output", "jest");
    assert.equal(result.passed, 0);
    assert.equal(result.failed, 0);
  });
});
