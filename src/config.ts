/**
 * pi-ci — Configuration loading and defaults.
 *
 * Reads `.pi/pi-ci.json` from the given directory (or cwd) and merges with defaults.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface PiCiReportConfig {
  format: "jsonl" | "summary";
  includeCost: boolean;
  includeEdits: boolean;
  includeTests: boolean;
}

export interface PiCiExitCodeConfig {
  success: number;
  error: number;
  blocked: number;
  cancelled: number;
  needsInput: number;
}

export interface PiCiConfig {
  enabled: boolean;
  idleTimeoutMs: number;
  maxRetries: number;
  retryBackoffMaxMs: number;
  exitCodes: PiCiExitCodeConfig;
  report: PiCiReportConfig;
}

const DEFAULT_CONFIG: PiCiConfig = {
  enabled: true,
  idleTimeoutMs: 15_000,
  maxRetries: 3,
  retryBackoffMaxMs: 30_000,
  exitCodes: {
    success: 0,
    error: 1,
    blocked: 10,
    cancelled: 11,
    needsInput: 12,
  },
  report: {
    format: "jsonl",
    includeCost: true,
    includeEdits: true,
    includeTests: true,
  },
};

/**
 * Load pi-ci configuration from `.pi/pi-ci.json` (if present) merged with defaults.
 */
export async function loadCiConfig(cwd?: string): Promise<PiCiConfig> {
  const dir = cwd ?? process.cwd();
  const configPath = join(dir, ".pi", "pi-ci.json");

  let text: string;
  try {
    text = await readFile(configPath, "utf-8");
  } catch {
    return { ...DEFAULT_CONFIG };
  }

  const raw: unknown = JSON.parse(text);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_CONFIG };
  }

  const user = raw as Record<string, unknown>;
  return {
    enabled: typeof user.enabled === "boolean" ? user.enabled : DEFAULT_CONFIG.enabled,
    idleTimeoutMs:
      typeof user.idleTimeoutMs === "number" ? user.idleTimeoutMs : DEFAULT_CONFIG.idleTimeoutMs,
    maxRetries:
      typeof user.maxRetries === "number" ? user.maxRetries : DEFAULT_CONFIG.maxRetries,
    retryBackoffMaxMs:
      typeof user.retryBackoffMaxMs === "number"
        ? user.retryBackoffMaxMs
        : DEFAULT_CONFIG.retryBackoffMaxMs,
    exitCodes: {
      ...DEFAULT_CONFIG.exitCodes,
      ...(typeof user.exitCodes === "object" && user.exitCodes !== null
        ? (user.exitCodes as Partial<PiCiExitCodeConfig>)
        : {}),
    },
    report: {
      ...DEFAULT_CONFIG.report,
      ...(typeof user.report === "object" && user.report !== null
        ? (user.report as Partial<PiCiReportConfig>)
        : {}),
    },
  };
}

export { DEFAULT_CONFIG };
