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

/** Recursively merge `override` into `base`, handling nested objects.
 * Does not mutate either argument.
 */
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const bv = base[key];
		const ov = override[key];
		if (
			bv !== undefined && ov !== undefined &&
			typeof bv === "object" && !Array.isArray(bv) &&
			typeof ov === "object" && !Array.isArray(ov)
		) {
			result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>);
		} else {
			result[key] = ov;
		}
	}
	return result;
}

export { deepMerge };

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
    return structuredClone(DEFAULT_CONFIG) as PiCiConfig;
  }

  const raw: unknown = JSON.parse(text);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return structuredClone(DEFAULT_CONFIG) as PiCiConfig;
  }

  return deepMerge(
    structuredClone(DEFAULT_CONFIG) as unknown as Record<string, unknown>,
    raw as Record<string, unknown>,
  ) as PiCiConfig;
}

export { DEFAULT_CONFIG };