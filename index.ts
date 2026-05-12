/**
 * pi-ci — Pi extension entry point.
 *
 * Registers the /ci status command and CI lifecycle hooks.
 */

import type { CIEvent, CIOptions, ExitCode } from "./src/types.ts";
import { EXIT_CODES } from "./src/types.ts";
import {
  ciStatusHandler,
  createRunTracker,
  clearRuns,
  registerRun,
  type CIRunRecord,
} from "./src/tools/ci_status.ts";
import { CIPipeline, type PipelineResult } from "./src/ci/pipeline.ts";
import { generateReport } from "./src/ci/report.ts";

// Re-export for consumers
export { EXIT_CODES } from "./src/types.ts";
export { resolveExitCode } from "./src/headless/exit-codes.ts";
export { loadAnswers, matchAnswer, parseAnswers } from "./src/headless/answer-injector.ts";
export { IdleDetector } from "./src/headless/idle-detector.ts";
export { CIEventCollector, writeCIEvent } from "./src/headless/jsonl-stream.ts";
export { HeadlessOrchestrator } from "./src/headless/orchestrator.ts";
export { CIPipeline } from "./src/ci/pipeline.ts";
export { createPR, detectBaseBranch } from "./src/ci/pr-creator.ts";
export { parseTestResults } from "./src/ci/test-runner.ts";
export { generateReport } from "./src/ci/report.ts";
export { ciStatusHandler, registerRun, clearRuns, createRunTracker } from "./src/tools/ci_status.ts";
export { loadCiConfig, DEFAULT_CONFIG } from "./src/config.ts";
export type { PiCiConfig } from "./src/config.ts";

/**
 * Extension API type (minimal — avoids hard dep on pi-coding-agent types).
 */
interface ExtensionAPI {
  registerCommand?: (name: string, handler: (args: unknown) => string | Promise<string>) => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
}

/**
 * Default export — Pi extension registration.
 */
export default function piCiExtension(pi: ExtensionAPI): void {
  // Register /ci status command
  if (pi.registerCommand) {
    pi.registerCommand("ci", (args: unknown) => {
      return ciStatusHandler(args);
    });
  }
}
