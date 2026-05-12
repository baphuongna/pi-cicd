/**
 * Unit tests: headless orchestrator
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HeadlessOrchestrator } from "../../src/headless/orchestrator.ts";
import type { OrchestratorHooks } from "../../src/headless/orchestrator.ts";
import { EXIT_CODES } from "../../src/types.ts";

describe("HeadlessOrchestrator", () => {
  function makeHooks(stepResult: () => Promise<{ status: string }>): OrchestratorHooks {
    return {
      executeStep: async (_prompt, _inject) => stepResult(),
    };
  }

  it("successful run emits start + end events, returns 0", async () => {
    const hooks = makeHooks(async () => ({ status: "success" }));
    const orch = new HeadlessOrchestrator([], {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 60_000,
    }, hooks);

    const result = await orch.run("test", "single");

    assert.equal(result.exitCode, 0);
    const events = result.events;
    assert.equal(events[0].type, "ci_start");
    assert.equal(events[events.length - 1].type, "ci_end");
    assert.ok(result.durationMs >= 0);
  });

  it("timeout triggers exit code 1", async () => {
    const hooks: OrchestratorHooks = {
      executeStep: async () => {
        // Never resolves — idle detector will fire
        return new Promise(() => {});
      },
    };

    const orch = new HeadlessOrchestrator([], {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 50,
      maxRetries: 0,
    }, hooks);

    const result = await orch.run("test", "single");
    assert.equal(result.exitCode, EXIT_CODES.TIMEOUT);
  });

  it("blocked state returns exit code 10", async () => {
    const hooks = makeHooks(async () => ({ status: "blocked" }));
    const orch = new HeadlessOrchestrator([], {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 60_000,
    }, hooks);

    const result = await orch.run("test", "single");
    assert.equal(result.exitCode, EXIT_CODES.BLOCKED);
  });

  it("cancelled state returns exit code 11", async () => {
    const hooks = makeHooks(async () => ({ status: "cancelled" }));
    const orch = new HeadlessOrchestrator([], {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 60_000,
    }, hooks);

    const result = await orch.run("test", "single");
    assert.equal(result.exitCode, EXIT_CODES.CANCELLED);
  });

  it("auto-restart retries on error, gives up after maxRetries", async () => {
    let calls = 0;
    const hooks: OrchestratorHooks = {
      executeStep: async () => {
        calls++;
        return { status: "error" };
      },
    };

    const orch = new HeadlessOrchestrator([], {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 60_000,
      maxRetries: 2,
    }, hooks);

    const result = await orch.run("test", "single");
    // Initial attempt + 2 retries = 3
    assert.equal(calls, 3);
    assert.equal(result.exitCode, EXIT_CODES.ERROR);
  });

  it("answer injection works in orchestrated flow", async () => {
    let capturedAnswer: string | undefined = "NOT_CALLED";
    const hooks: OrchestratorHooks = {
      executeStep: async (_prompt, injectAnswer) => {
        capturedAnswer = injectAnswer("Please Select an option: [1/2/3]");
        return { status: "success" };
      },
    };

    const answers = [{ match: "Select an option:", answer: "2" }];
    const orch = new HeadlessOrchestrator(answers, {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 60_000,
    }, hooks);

    await orch.run("test", "single");
    assert.equal(capturedAnswer, "2");
  });

  it("emits edit events from step result", async () => {
    const hooks: OrchestratorHooks = {
      executeStep: async () => ({
        status: "success",
        edits: [{ file: "a.ts", lines_added: 5, lines_removed: 2 }],
      }),
    };

    const orch = new HeadlessOrchestrator([], {
      prompt: "test",
      mode: "single",
      idleTimeoutMs: 60_000,
    }, hooks);

    const result = await orch.run("test", "single");
    const editEvents = result.events.filter((e) => e.type === "ci_edit");
    assert.equal(editEvents.length, 1);
  });
});
