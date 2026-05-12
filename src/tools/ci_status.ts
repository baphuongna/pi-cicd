/**
 * pi-ci — /ci status command handler.
 *
 * Shows the status of the current or last CI run.
 */

import { CIEventCollector } from "../headless/jsonl-stream.ts";
import { generateReport } from "../ci/report.ts";
import type { CIEvent, CIEndEvent, ExitCode } from "../types.ts";
import { isCIEndEvent } from "../headless/jsonl-stream.ts";

export interface CIRunRecord {
  id: string;
  startTime: string;
  events: CIEvent[];
  exitCode?: ExitCode;
  durationMs?: number;
}

/**
 * Simple in-memory registry of CI runs (for the status command).
 */
const runRegistry = new Map<string, CIRunRecord>();

/**
 * Register a CI run for status lookups.
 */
export function registerRun(record: CIRunRecord): void {
  runRegistry.set(record.id, record);
}

/**
 * Clear all registered runs (useful for testing).
 */
export function clearRuns(): void {
  runRegistry.clear();
}

/**
 * Get a specific run by ID (prefix match supported).
 */
export function getRun(id: string): CIRunRecord | undefined {
  // Exact match first
  if (runRegistry.has(id)) {
    return runRegistry.get(id);
  }
  // Prefix match
  for (const [key, value] of runRegistry) {
    if (key.startsWith(id)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Handle the /ci status command.
 *
 * Returns a human-readable status string.
 */
export function ciStatusHandler(args: unknown): string {
  const runId = typeof args === "string" ? args : undefined;

  if (runId) {
    const run = getRun(runId);
    if (!run) {
      return `No CI run found matching: ${runId}`;
    }
    return formatRunStatus(run);
  }

  // Show all runs
  if (runRegistry.size === 0) {
    return "No CI runs found.";
  }

  const lines: string[] = [];
  for (const run of runRegistry.values()) {
    lines.push(formatRunStatus(run));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function formatRunStatus(run: CIRunRecord): string {
  const lines: string[] = [];
  lines.push(`Run:       ${run.id}`);
  lines.push(`Started:   ${run.startTime}`);

  const endEvent = run.events.find((e): e is CIEndEvent => isCIEndEvent(e));
  if (endEvent) {
    lines.push(`Exit Code: ${endEvent.exit_code}`);
    lines.push(`Duration:  ${(endEvent.duration_ms / 1000).toFixed(1)}s`);

    const status =
      endEvent.exit_code === 0
        ? "SUCCESS"
        : endEvent.exit_code === 10
          ? "BLOCKED"
          : endEvent.exit_code === 11
            ? "CANCELLED"
            : "ERROR";
    lines.push(`Status:    ${status}`);
  } else {
    lines.push("Status:    RUNNING");
  }

  return lines.join("\n");
}

/**
 * Create a CI run tracker that collects events and registers the run.
 */
export function createRunTracker(runId: string): {
  collector: CIEventCollector;
  finalize: () => CIRunRecord;
} {
  const collector = new CIEventCollector();
  const startTime = new Date().toISOString();

  return {
    collector,
    finalize() {
      const events = collector.all();
      const endEvent = events.find((e): e is CIEndEvent => isCIEndEvent(e));
      const record: CIRunRecord = {
        id: runId,
        startTime,
        events,
        exitCode: endEvent?.exit_code,
        durationMs: endEvent?.duration_ms,
      };
      registerRun(record);
      return record;
    },
  };
}
