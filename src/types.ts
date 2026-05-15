/**
 * pi-ci — Shared types for headless CI mode.
 *
 * Exit code contract and CI event types per SPEC.md §2.1 and §5.
 */

// ---------------------------------------------------------------------------
// Exit codes
// ---------------------------------------------------------------------------

export const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  TIMEOUT: 1,
  BLOCKED: 10,
  CANCELLED: 11,
  NEEDS_INPUT: 12,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

// ---------------------------------------------------------------------------
// CI events (JSONL stream)
// ---------------------------------------------------------------------------

export type CIEventType =
  | "ci_start"
  | "ci_progress"
  | "ci_edit"
  | "ci_test"
  | "ci_cost"
  | "ci_end"
  | "ci_step_complete";

export interface CIEventBase {
  type: CIEventType;
  timestamp: string; // ISO 8601
}

export interface CIStartEvent extends CIEventBase {
  type: "ci_start";
  task: string;
  mode: "single" | "plan";
}

export type CIRunPhase =
  | "exploring"
  | "planning"
  | "implementing"
  | "verifying"
  | "reviewing";

export interface CIProgressEvent extends CIEventBase {
  type: "ci_progress";
  phase: CIRunPhase;
  files?: string[];
}

export interface CIEditEvent extends CIEventBase {
  type: "ci_edit";
  file: string;
  lines_added: number;
  lines_removed: number;
}

export interface CITestEvent extends CIEventBase {
  type: "ci_test";
  command: string;
  passed: number;
  failed: number;
}

export interface CICostEvent extends CIEventBase {
  type: "ci_cost";
  tokens: { input: number; output: number };
  cost_usd: number;
}

export interface CIEndEvent extends CIEventBase {
  type: "ci_end";
  exit_code: ExitCode;
  duration_ms: number;
}

export interface CIStepCompleteEvent extends CIEventBase {
  type: "ci_step_complete";
  step: number;
}

export type CIEvent =
  | CIStartEvent
  | CIProgressEvent
  | CIEditEvent
  | CITestEvent
  | CICostEvent
  | CIEndEvent
  | CIStepCompleteEvent;

// ---------------------------------------------------------------------------
// Answer injection
// ---------------------------------------------------------------------------

export interface AnswerEntry {
  match: string;
  answer: string;
}

export interface AnswerFile {
  answers: AnswerEntry[];
}

// ---------------------------------------------------------------------------
// Test results
// ---------------------------------------------------------------------------

export interface TestSummary {
  passed: number;
  failed: number;
  total: number;
  duration_ms: number;
}

// ---------------------------------------------------------------------------
// PR creation
// ---------------------------------------------------------------------------

export interface PROptions {
  title: string;
  body?: string;
  base?: string;
  head?: string;
  draft?: boolean;
  labels?: string[];
}

export interface PRResult {
  url: string;
  number: number;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export type CIPipelineMode = "single" | "plan" | "review" | "supervised";

export interface CIOptions {
  prompt: string;
  mode: CIPipelineMode;
  answersFile?: string;
  planFile?: string;
  prNumber?: number;
  resume?: string;
  idleTimeoutMs?: number;
  maxRetries?: number;
}
