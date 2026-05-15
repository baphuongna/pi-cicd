/**
 * pi-ci — Pi extension entry point.
 *
 * Registers the /ci status command and CI lifecycle hooks.
 */

import type { CIEvent, CIOptions, ExitCode } from "./types.ts";
import { EXIT_CODES } from "./types.ts";
import {
  ciStatusHandler,
  createRunTracker,
  clearRuns,
  registerRun,
  type CIRunRecord,
} from "./tools/ci_status.ts";
import { CIPipeline, type PipelineResult } from "./ci/pipeline.ts";
import { generateReport } from "./ci/report.ts";

// Re-export for consumers
export { EXIT_CODES } from "./types.ts";
export { resolveExitCode } from "./headless/exit-codes.ts";
export { loadAnswers, matchAnswer, parseAnswers } from "./headless/answer-injector.ts";
export { IdleDetector } from "./headless/idle-detector.ts";
export { CIEventCollector, writeCIEvent } from "./headless/jsonl-stream.ts";
export { HeadlessOrchestrator } from "./headless/orchestrator.ts";
export { CIPipeline } from "./ci/pipeline.ts";
export { createPR, detectBaseBranch } from "./ci/pr-creator.ts";
export { parseTestResults } from "./ci/test-runner.ts";
export { generateReport } from "./ci/report.ts";
export { ciStatusHandler, registerRun, clearRuns, createRunTracker } from "./tools/ci_status.ts";
export { loadCiConfig, DEFAULT_CONFIG } from "./config.ts";
export type { PiCiConfig } from "./config.ts";

/**
 * Extension API type.
 * NOTE: We define this inline rather than importing from @earendil-works/pi-coding-agent
 * because the peer dependency does not export the full ExtensionAPI shape.
 * The minimal interface covers only the methods pi-cicd actually uses (registerCommand, on).
 * If the host API adds required methods in future, update this interface accordingly.
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
