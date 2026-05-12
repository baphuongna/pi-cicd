/**
 * pi-ci — Headless orchestrator.
 *
 * Ties together exit codes, answer injection, idle detection, and JSONL
 * streaming into a single execution loop.
 */

import type { ExitCode, CIEvent, CIOptions } from "../types.ts";
import { EXIT_CODES } from "../types.ts";
import { resolveExitCode } from "./exit-codes.ts";
import { matchAnswer } from "./answer-injector.ts";
import type { AnswerEntry } from "../types.ts";
import { IdleDetector } from "./idle-detector.ts";
import { CIEventCollector, writeCIEvent } from "./jsonl-stream.ts";
import type { Writable } from "node:stream";

export interface OrchestratorResult {
  exitCode: ExitCode;
  events: CIEvent[];
  durationMs: number;
}

export interface OrchestratorHooks {
  /** Called for each step of execution. Return a status string to signal completion. */
  executeStep: (
    prompt: string,
    injectAnswer: (question: string) => string | undefined,
  ) => Promise<StepResult>;
  /** Optional writable for JSONL streaming. */
  outputStream?: Writable;
}

export interface StepResult {
  status: string;
  edits?: { file: string; lines_added: number; lines_removed: number }[];
  tests?: { command: string; passed: number; failed: number }[];
  cost?: { tokens: { input: number; output: number }; cost_usd: number };
}

const RESTART_CONFIG = {
  baseDelayMs: 5_000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
};

export class HeadlessOrchestrator {
  private readonly collector = new CIEventCollector();
  private readonly answers: AnswerEntry[];
  private readonly idleTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly hooks: OrchestratorHooks;

  constructor(
    answers: AnswerEntry[],
    options: CIOptions,
    hooks: OrchestratorHooks,
  ) {
    this.answers = answers;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 15_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.hooks = hooks;
  }

  /**
   * Run the orchestrator loop.
   *
   * 1. Emit ci_start
   * 2. Execute steps via the hook, checking for answer injection
   * 3. On idle timeout → retry with exponential backoff
   * 4. Emit ci_end with the resolved exit code
   */
  async run(prompt: string, mode: "single" | "plan"): Promise<OrchestratorResult> {
    const startTime = Date.now();

    const startEvent: CIEvent = {
      type: "ci_start",
      timestamp: new Date().toISOString(),
      task: prompt,
      mode,
    };
    this.emit(startEvent);

    let lastExitCode: ExitCode = EXIT_CODES.ERROR;
    let retries = 0;

    while (retries <= this.maxRetries) {
      const result = await this.runAttempt(prompt);
      lastExitCode = result;

      if (lastExitCode === EXIT_CODES.SUCCESS) break;
      if (lastExitCode === EXIT_CODES.BLOCKED || lastExitCode === EXIT_CODES.CANCELLED) break;

      // Retry on error/timeout
      retries++;
      if (retries <= this.maxRetries) {
        const delay = Math.min(
          RESTART_CONFIG.baseDelayMs *
            Math.pow(RESTART_CONFIG.backoffMultiplier, retries - 1),
          RESTART_CONFIG.maxDelayMs,
        );
        await sleep(delay);
      }
    }

    const durationMs = Date.now() - startTime;
    const endEvent: CIEvent = {
      type: "ci_end",
      timestamp: new Date().toISOString(),
      exit_code: lastExitCode,
      duration_ms: durationMs,
    };
    this.emit(endEvent);

    return {
      exitCode: lastExitCode,
      events: this.collector.all(),
      durationMs,
    };
  }

  /**
   * Single attempt: run with idle detection.
   */
  private async runAttempt(prompt: string): Promise<ExitCode> {
    return new Promise<ExitCode>((resolve) => {
      let settled = false;

      const idle = new IdleDetector({
        idleTimeoutMs: this.idleTimeoutMs,
        onTimeout: () => {
          if (!settled) {
            settled = true;
            resolve(EXIT_CODES.TIMEOUT);
          }
        },
      });

      const injectAnswer = (question: string): string | undefined => {
        idle.reset();
        return matchAnswer(this.answers, question);
      };

      idle.start();

      this.hooks
        .executeStep(prompt, injectAnswer)
        .then((stepResult) => {
          if (!settled) {
            settled = true;
            idle.stop();

            // Emit detail events
            if (stepResult.edits) {
              for (const edit of stepResult.edits) {
                this.emit({
                  type: "ci_edit",
                  timestamp: new Date().toISOString(),
                  file: edit.file,
                  lines_added: edit.lines_added,
                  lines_removed: edit.lines_removed,
                });
              }
            }
            if (stepResult.tests) {
              for (const t of stepResult.tests) {
                this.emit({
                  type: "ci_test",
                  timestamp: new Date().toISOString(),
                  command: t.command,
                  passed: t.passed,
                  failed: t.failed,
                });
              }
            }
            if (stepResult.cost) {
              this.emit({
                type: "ci_cost",
                timestamp: new Date().toISOString(),
                tokens: stepResult.cost.tokens,
                cost_usd: stepResult.cost.cost_usd,
              });
            }

            resolve(resolveExitCode(stepResult.status));
          }
        })
        .catch(() => {
          if (!settled) {
            settled = true;
            idle.stop();
            resolve(EXIT_CODES.ERROR);
          }
        });
    });
  }

  private emit(event: CIEvent): void {
    this.collector.emit(event);
    if (this.hooks.outputStream) {
      writeCIEvent(this.hooks.outputStream, event);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
