import assert from "node:assert/strict";
import test from "node:test";
import { createDeploymentWorkflow, executeDeploymentWorkflow } from "../../src/workflow/deployment-workflow.ts";

test("createDeploymentWorkflow - creates standard workflow", () => {
  const workflow = createDeploymentWorkflow({ name: "my-app" });
  
  assert.strictEqual(workflow.name, "my-app");
  assert.ok(workflow.steps.length > 0);
  assert.ok(workflow.steps.some(s => s.action === "validate"));
  assert.ok(workflow.steps.some(s => s.action === "build"));
});

test("createDeploymentWorkflow - respects includeStaging option", () => {
  const withStaging = createDeploymentWorkflow({ name: "app", includeStaging: true });
  const withoutStaging = createDeploymentWorkflow({ name: "app", includeStaging: false });
  
  // Check by looking at step IDs
  assert.ok(withStaging.steps.some(s => s.id.includes("staging")));
  assert.ok(!withoutStaging.steps.some(s => s.id.includes("staging")));
});

test("executeDeploymentWorkflow - executes all steps", async () => {
  const workflow = createDeploymentWorkflow({ name: "test-app" });
  const executed: string[] = [];
  
  for await (const _state of executeDeploymentWorkflow(workflow, async (step) => {
    executed.push(step.id);
    return { success: true };
  })) {
    // Iterate through all states
  }
  
  assert.ok(executed.length > 0);
});

test("executeDeploymentWorkflow - completes successfully", async () => {
  const workflow = createDeploymentWorkflow({ name: "test-app" });
  
  let finalState: any;
  for await (const state of executeDeploymentWorkflow(workflow, async () => {
    return { success: true };
  })) {
    finalState = state;
  }
  
  assert.strictEqual(finalState.status, "completed");
});
