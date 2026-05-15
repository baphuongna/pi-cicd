/**
 * Deployment Workflow - Pattern from pi-crew workflow-config.ts
 * 
 * Declarative deployment workflow definition.
 */

export interface DeploymentStep {
  id: string;
  name: string;
  action: "validate" | "build" | "test" | "deploy" | "verify" | "rollback";
  environment: "staging" | "production" | "preview";
  dependsOn?: string[];
  parallelGroup?: string;
  timeout?: number; // ms
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
  conditions?: {
    onlyIf?: string;
    skipIf?: string;
  };
}

export interface DeploymentWorkflow {
  name: string;
  description: string;
  version: string;
  steps: DeploymentStep[];
  maxConcurrency?: number;
  rollbackOnFailure?: boolean;
}

export interface DeploymentState {
  workflowId: string;
  runId: string;
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

/**
 * Create a standard deployment workflow
 */
export function createDeploymentWorkflow(
  options: {
    name: string;
    environments?: string[];
    includeStaging?: boolean;
  }
): DeploymentWorkflow {
  const envs = options.environments ?? ["staging", "production"];
  
  const steps: DeploymentStep[] = [
    { id: "validate", name: "Validate", action: "validate", environment: "staging" as const },
    { id: "build", name: "Build", action: "build", environment: "staging" as const, dependsOn: ["validate"] },
    { id: "test", name: "Test", action: "test", environment: "staging" as const, dependsOn: ["build"] },
  ];
  
  if (options.includeStaging !== false) {
    steps.push({
      id: "deploy-staging",
      name: "Deploy to Staging",
      action: "deploy",
      environment: "staging",
      dependsOn: ["test"],
      retry: { maxAttempts: 3, backoffMs: 5000 },
    });
    steps.push({
      id: "verify-staging",
      name: "Verify Staging",
      action: "verify",
      environment: "staging",
      dependsOn: ["deploy-staging"],
    });
  }
  
  if (envs.includes("production")) {
    steps.push({
      id: "deploy-production",
      name: "Deploy to Production",
      action: "deploy",
      environment: "production",
      dependsOn: options.includeStaging !== false ? ["verify-staging"] : ["test"],
      retry: { maxAttempts: 3, backoffMs: 10000 },
      conditions: {
        onlyIf: "BRANCH=main",
      },
    });
  }
  
  return {
    name: options.name,
    description: `Deployment workflow for ${options.name}`,
    version: "1.0.0",
    steps,
    maxConcurrency: 1,
    rollbackOnFailure: true,
  };
}

/**
 * Execute a deployment workflow with proper dependency handling.
 * Steps are processed in dependency order, re-queued when dependencies are met.
 */
export async function* executeDeploymentWorkflow(
  workflow: DeploymentWorkflow,
  executor: (step: DeploymentStep) => Promise<{ success: boolean; error?: string }>
): AsyncGenerator<DeploymentState> {
  const state: DeploymentState = {
    workflowId: workflow.name,
    runId: `deploy-${Date.now()}`,
    status: "pending",
    completedSteps: [],
    failedSteps: [],
    startedAt: new Date().toISOString(),
  };
  
  yield state;
  
  const stepMap = new Map(workflow.steps.map(s => [s.id, s]));
  const completed = new Set<string>();
  
  // Track pending steps that haven't been processed yet
  const pendingSteps = [...workflow.steps];
  
  // Keep iterating until all steps are processed
  while (pendingSteps.length > 0) {
    let madeProgress = false;
    
    // Find steps whose dependencies are all met
    for (let i = 0; i < pendingSteps.length; i++) {
      const step = pendingSteps[i];
      
      // Check if all dependencies are satisfied
      if (step.dependsOn?.some(dep => !completed.has(dep))) {
        continue; // Dependencies not met yet, try next step
      }
      
      // Dependencies are met - execute this step
      pendingSteps.splice(i, 1); // Remove from pending
      i--; // Adjust index after splice
      madeProgress = true;
      
      state.status = "running";
      state.currentStep = step.id;
      yield state;
      
      const result = await executor(step);
      
      if (result.success) {
        completed.add(step.id);
        state.completedSteps.push(step.id);
      } else {
        state.failedSteps.push(step.id);
        state.status = "failed";
        state.error = result.error;
        state.finishedAt = new Date().toISOString();
        yield state;
        return;
      }
    }
    
    // If no progress but steps remain, we have circular dependencies
    if (!madeProgress && pendingSteps.length > 0) {
      const circularDeps = pendingSteps.map(s => s.id).join(", ");
      state.failedSteps.push(...pendingSteps.map(s => s.id));
      state.status = "failed";
      state.error = `Circular dependency detected among: ${circularDeps}`;
      state.finishedAt = new Date().toISOString();
      yield state;
      return;
    }
  }
  
  state.status = "completed";
  state.finishedAt = new Date().toISOString();
  yield state;
}
