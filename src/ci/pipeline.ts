/**
 * pi-ci — CI pipeline wrapper.
 *
 * Provides single, plan, review, and supervised execution modes.
 */

import type { CIEvent, CIOptions, CIPipelineMode, ExitCode, TestSummary } from "../types.ts";
import { EXIT_CODES } from "../types.ts";
import { HeadlessOrchestrator, type OrchestratorHooks } from "../headless/orchestrator.ts";
import { loadAnswers } from "../headless/answer-injector.ts";
import { parseTestResults } from "./test-runner.ts";
import { generateReport } from "./report.ts";

export interface PipelineResult {
  exitCode: ExitCode;
  events: CIEvent[];
  report: string;
  testSummary?: TestSummary;
}

export class CIPipeline {
  private readonly options: CIOptions;
  private readonly hooks: OrchestratorHooks;

  constructor(options: CIOptions, hooks: OrchestratorHooks) {
    this.options = options;
    this.hooks = hooks;
  }

  /**
   * Execute the pipeline in the configured mode.
   */
  async execute(): Promise<PipelineResult> {
    switch (this.options.mode) {
      case "single":
        return this.executeSingle();
      case "plan":
        return this.executePlan();
      case "review":
        return this.executeReview();
      case "supervised":
        return this.executeSupervised();
      default:
        throw new Error(`Unknown CI pipeline mode: ${this.options.mode as string}`);
    }
  }

  /**
   * Single task mode — run one prompt to completion.
   */
  private async executeSingle(): Promise<PipelineResult> {
    const answers = await this.loadAnswers();
    const orchestrator = new HeadlessOrchestrator(answers, this.options, this.hooks);
    const result = await orchestrator.run(this.options.prompt, "single");

    return {
      exitCode: result.exitCode,
      events: result.events,
      report: generateReport(result.events),
    };
  }

  /**
   * Plan mode — execute steps from a plan file.
   *
   * Each step becomes a sequential orchestrator invocation. If any step fails,
   * the pipeline stops.
   */
  private async executePlan(): Promise<PipelineResult> {
    const allEvents: CIEvent[] = [];
    let finalExitCode: ExitCode = EXIT_CODES.SUCCESS;
    let totalDuration = 0;

    // Plan steps are provided via the executeStep hook — the orchestrator
    // iterates over steps internally.
    const answers = await this.loadAnswers();
    const orchestrator = new HeadlessOrchestrator(answers, this.options, this.hooks);
    const result = await orchestrator.run(this.options.prompt, "plan");

    allEvents.push(...result.events);
    finalExitCode = result.exitCode;
    totalDuration = result.durationMs;

    return {
      exitCode: finalExitCode,
      events: allEvents,
      report: generateReport(allEvents),
    };
  }

  /**
   * PR review mode — review a PR by number.
   */
  private async executeReview(): Promise<PipelineResult> {
    const answers = await this.loadAnswers();
    const orchestrator = new HeadlessOrchestrator(answers, this.options, this.hooks);
    const prompt = this.options.prNumber
      ? `Review PR #${this.options.prNumber}`
      : this.options.prompt;
    const result = await orchestrator.run(prompt, "single");

    return {
      exitCode: result.exitCode,
      events: result.events,
      report: generateReport(result.events),
    };
  }

  /**
   * Supervised mode — stdin/stdout forwarding for an external orchestrator.
   */
  private async executeSupervised(): Promise<PipelineResult> {
    const answers = await this.loadAnswers();
    const orchestrator = new HeadlessOrchestrator(answers, this.options, this.hooks);
    const result = await orchestrator.run(this.options.prompt, "single");

    return {
      exitCode: result.exitCode,
      events: result.events,
      report: generateReport(result.events),
    };
  }

  private async loadAnswers() {
    if (this.options.answersFile) {
      return loadAnswers(this.options.answersFile);
    }
    return [];
  }
}
