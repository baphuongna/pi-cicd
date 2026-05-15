/**
 * pi-cicd — Pi extension entry point.
 * Delegates registration to src/extension/register.ts.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerPiCicd } from "./src/extension/register.ts";

export default function (pi: ExtensionAPI): void {
	registerPiCicd(pi);
}

// Re-exports for downstream consumers
export { EXIT_CODES } from "./src/types.ts";
export { resolveExitCode } from "./src/headless/exit-codes.ts";
export {
	loadAnswers,
	matchAnswer,
	parseAnswers,
} from "./src/headless/answer-injector.ts";
export { IdleDetector } from "./src/headless/idle-detector.ts";
export {
	CIEventCollector,
	writeCIEvent,
} from "./src/headless/jsonl-stream.ts";
export { HeadlessOrchestrator } from "./src/headless/orchestrator.ts";
export { CIPipeline, type PipelineResult } from "./src/ci/pipeline.ts";
export { createPR, detectBaseBranch } from "./src/ci/pr-creator.ts";
export { parseTestResults } from "./src/ci/test-runner.ts";
export { generateReport } from "./src/ci/report.ts";
export {
	ciStatusHandler,
	registerRun,
	clearRuns,
	createRunTracker,
	type CIRunRecord,
} from "./src/tools/ci_status.ts";
export { loadCiConfig, DEFAULT_CONFIG } from "./src/config.ts";
export type {
	CIEvent,
	CIOptions,
	ExitCode,
} from "./src/types.ts";
export type { PiCiConfig } from "./src/config.ts";

// Backward-compat alias for the previous default-export function name.
export { registerPiCicd } from "./src/extension/register.ts";
