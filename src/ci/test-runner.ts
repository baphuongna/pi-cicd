/**
 * pi-ci — Test result parsing for TAP, Jest, and Vitest output formats.
 */

import type { TestSummary } from "../types.ts";

export type TestOutputFormat = "tap" | "jest" | "vitest";

/**
 * Parse test output and return a summary.
 */
export function parseTestResults(output: string, format: TestOutputFormat): TestSummary {
  if (!output || !output.trim()) {
    return { passed: 0, failed: 0, total: 0, duration_ms: 0 };
  }

  switch (format) {
    case "tap":
      return parseTap(output);
    case "jest":
      return parseJest(output);
    case "vitest":
      return parseVitest(output);
    default:
      return { passed: 0, failed: 0, total: 0, duration_ms: 0 };
  }
}

/**
 * Parse TAP (Test Anything Protocol) output.
 *
 * Example:
 *   1..5
 *   ok 1 - first test
 *   not ok 2 - failing test
 *   ok 3 - third test
 */
function parseTap(output: string): TestSummary {
  let passed = 0;
  let failed = 0;

  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("ok ")) {
      passed++;
    } else if (trimmed.startsWith("not ok ")) {
      failed++;
    }
  }

  return {
    passed,
    failed,
    total: passed + failed,
    duration_ms: 0, // TAP doesn't have standard duration
  };
}

/**
 * Parse Jest-style test output.
 *
 * Looks for patterns like:
 *   Tests:       5 passed, 2 failed, 7 total
 *   Time:        3.456 s
 */
function parseJest(output: string): TestSummary {
  let passed = 0;
  let failed = 0;
  let total = 0;
  let durationMs = 0;

  // Match test summary line
  const testMatch = output.match(
    /Tests:\s*(\d+)\s*passed(?:,\s*(\d+)\s*failed)?(?:,\s*(\d+)\s*total)?/,
  );
  if (testMatch) {
    passed = parseInt(testMatch[1], 10);
    failed = parseInt(testMatch[2] || "0", 10);
    total = parseInt(testMatch[3] || String(passed + failed), 10);
  } else {
    // Fallback: count individual test lines
    const passMatches = output.match(/✓|PASS/g);
    const failMatches = output.match(/✕|FAIL/g);
    passed = passMatches?.length ?? 0;
    failed = failMatches?.length ?? 0;
    total = passed + failed;
  }

  // Match time
  const timeMatch = output.match(/Time:\s*([\d.]+)\s*s/);
  if (timeMatch) {
    durationMs = Math.round(parseFloat(timeMatch[1]) * 1000);
  }

  return { passed, failed, total, duration_ms: durationMs };
}

/**
 * Parse Vitest-style test output.
 *
 * Looks for patterns like:
 *   Tests  5 passed | 2 failed (7)
 *   Duration  3.45s
 */
function parseVitest(output: string): TestSummary {
  let passed = 0;
  let failed = 0;
  let total = 0;
  let durationMs = 0;

  // Match test summary line: "Tests  5 passed | 2 failed (7)"
  const testMatch = output.match(
    /Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?(?:\s*\((\d+)\))?/,
  );
  if (testMatch) {
    passed = parseInt(testMatch[1], 10);
    failed = parseInt(testMatch[2] || "0", 10);
    total = parseInt(testMatch[3] || String(passed + failed), 10);
  }

  // Match duration: "Duration  3.45s"
  const durMatch = output.match(/Duration\s+([\d.]+)s/);
  if (durMatch) {
    durationMs = Math.round(parseFloat(durMatch[1]) * 1000);
  }

  return { passed, failed, total, duration_ms: durationMs };
}
