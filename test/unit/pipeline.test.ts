/**
 * Unit tests: CI pipeline
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CIPipeline } from "../../src/ci/pipeline.ts";
import type { OrchestratorHooks } from "../../src/headless/orchestrator.ts";
import { EXIT_CODES } from "../../src/types.ts";

function makeHooks(status: string): OrchestratorHooks {
  return {
    executeStep: async () => ({ status }),
  };
}

describe("CIPipeline", () => {
  it("single task mode returns correct exit code", async () => {
    const hooks = makeHooks("success");
    const pipeline = new CIPipeline({
      prompt: "Fix the bug",
      mode: "single",
    }, hooks);

    const result = await pipeline.execute();
    assert.equal(result.exitCode, EXIT_CODES.SUCCESS);
    assert.ok(result.events.length >= 2, "should have start and end events");
  });

  it("plan mode executes and returns events", async () => {
    const hooks = makeHooks("success");
    const pipeline = new CIPipeline({
      prompt: "Execute plan",
      mode: "plan",
    }, hooks);

    const result = await pipeline.execute();
    assert.equal(result.exitCode, EXIT_CODES.SUCCESS);
  });

  it("review mode runs with PR number", async () => {
    const hooks = makeHooks("success");
    const pipeline = new CIPipeline({
      prompt: "Review",
      mode: "review",
      prNumber: 42,
    }, hooks);

    const result = await pipeline.execute();
    assert.equal(result.exitCode, EXIT_CODES.SUCCESS);
  });

  it("supervised mode runs", async () => {
    const hooks = makeHooks("success");
    const pipeline = new CIPipeline({
      prompt: "Supervised task",
      mode: "supervised",
    }, hooks);

    const result = await pipeline.execute();
    assert.equal(result.exitCode, EXIT_CODES.SUCCESS);
  });

  it("generates report string", async () => {
    const hooks = makeHooks("success");
    const pipeline = new CIPipeline({
      prompt: "test",
      mode: "single",
    }, hooks);

    const result = await pipeline.execute();
    assert.ok(result.report.length > 0, "report should not be empty");
  });

  it("error mode returns error exit code", async () => {
    const hooks = makeHooks("error");
    const pipeline = new CIPipeline({
      prompt: "test",
      mode: "single",
      maxRetries: 0,
    }, hooks);

    const result = await pipeline.execute();
    assert.equal(result.exitCode, EXIT_CODES.ERROR);
  });
});
