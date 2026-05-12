/**
 * pi-ci — CI report generation.
 *
 * Produces JSONL or human-readable summary reports from collected CI events.
 */

import type { CIEvent, CIEndEvent, CICostEvent, CITestEvent } from "../types.ts";
import { isCIEndEvent, isCICostEvent, isCITestEvent } from "../headless/jsonl-stream.ts";

export interface ReportOptions {
  format: "jsonl" | "summary";
}

/**
 * Generate a report from a list of CI events.
 */
export function generateReport(events: CIEvent[], options?: ReportOptions): string {
  const format = options?.format ?? "jsonl";

  if (format === "summary") {
    return generateSummary(events);
  }

  // JSONL: one event per line
  return events.map((e) => JSON.stringify(e)).join("\n");
}

/**
 * Generate a human-readable summary.
 */
function generateSummary(events: CIEvent[]): string {
  const lines: string[] = ["=== CI Run Summary ===", ""];

  let totalTestsPassed = 0;
  let totalTestsFailed = 0;
  let totalCostUsd = 0;
  let exitCode = -1;
  let durationMs = 0;

  for (const event of events) {
    if (isCITestEvent(event)) {
      totalTestsPassed += event.passed;
      totalTestsFailed += event.failed;
    }
    if (isCICostEvent(event)) {
      totalCostUsd += event.cost_usd;
    }
    if (isCIEndEvent(event)) {
      exitCode = event.exit_code;
      durationMs = event.duration_ms;
    }
  }

  lines.push(`Exit Code: ${exitCode}`);
  lines.push(`Duration:  ${(durationMs / 1000).toFixed(1)}s`);
  lines.push(`Tests:     ${totalTestsPassed} passed, ${totalTestsFailed} failed`);
  if (totalCostUsd > 0) {
    lines.push(`Cost:      $${totalCostUsd.toFixed(4)}`);
  }

  const status = exitCode === 0 ? "SUCCESS" : exitCode === 10 ? "BLOCKED" : exitCode === 11 ? "CANCELLED" : "ERROR";
  lines.push(`Status:    ${status}`);

  return lines.join("\n");
}
