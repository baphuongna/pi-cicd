---
name: intelligent-deploy
description: Canary deployment with monitoring and landing queue management
triggers:
  - deploy
  - canary
  - rollout
  - landing queue
  - production
requirements:
  tools: [bash]
  context: [deployment target]
---

# Intelligent Deploy Skill

## Objective
Execute safe deployments with canary monitoring, automatic rollback, and landing queue management.

## When to Use
- When user asks to "deploy" or "ship to production"
- When running CI/CD pipelines
- When managing multiple deployments
- When requiring gradual rollouts with monitoring

## Workflow

### Step 1: Canary Deployment
```typescript
import { CanaryDeploy } from '../../src/deploy/canary-deploy';

const canary = new CanaryDeploy({
  initialPercentage: 10,
  incrementPercentage: 10,
  stepInterval: 60000, // 1 minute
  totalDuration: 300000, // 5 minutes
  metrics: {
    successRate: { min: 95 },
    latency: { max: 500 },
    errorRate: { max: 5 },
  },
});

const result = await canary.deploy({
  name: 'production',
  url: 'https://api.example.com',
  healthy: true,
});

console.log(canary.formatReport(result));
```

### Step 2: Landing Queue
```typescript
import { LandingQueue } from '../../src/deploy/landing-queue';

const queue = new LandingQueue();

// Add to queue
queue.enqueue('v1.2.0', 'production', 'New feature release');
queue.enqueue('v1.2.1', 'production', 'Bug fix');

// Process queue
while (true) {
  const next = await queue.startNext();
  if (!next) break;
  
  // Deploy
  const success = await deploy(next);
  
  // Mark complete
  queue.complete(next.id, success);
  
  if (!success) break; // Stop on failure
}
```

### Step 3: Monitor and Rollback
```typescript
// Automatic rollback on issues
if (result.rolledBack) {
  console.log('Deployment rolled back due to issues');
  await canary.rollback(target);
}
```

## Canary Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| initialPercentage | 10% | Starting traffic |
| incrementPercentage | 10% | Traffic increase per step |
| stepInterval | 1 min | Time between increments |
| totalDuration | 5 min | Total deployment time |

### Metrics Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Success Rate | > 95% | Continue |
| Latency | < 500ms | Continue |
| Error Rate | < 5% | Continue |

If metrics drop below thresholds:
- Warning at threshold
- Auto-rollback at critical level (90% success, 10% errors)

## Landing Queue Commands

### Enqueue Deployment
```typescript
queue.enqueue('v1.2.0', 'production', 'Feature release');
```

### Process Queue
```typescript
while (const next = queue.startNext()) {
  await deploy(next);
  queue.complete(next.id, success);
}
```

### View Status
```typescript
console.log(queue.formatReport());
```

## Examples

### Deploy with Canary
```
User: Deploy v1.2.0 to production with canary
Agent:
  const result = await canary.deploy({ name: 'production', url: '...', healthy: true });
  if (result.success) {
    console.log('Deployment successful!');
  } else {
    console.log('Rolled back - check issues');
  }
```

### Process Landing Queue
```
User: Queue these deployments: v1.2.0, v1.2.1, v1.2.2
Agent:
  queue.enqueue('v1.2.0', 'production');
  queue.enqueue('v1.2.1', 'production');
  queue.enqueue('v1.2.2', 'staging');
  
  const result = await queue.processAll();
```

### View Queue Status
```
User: Show me the current deployment queue
Agent:
  console.log(queue.formatReport());
```

## Output Format

### Canary Report
```markdown
## Canary Deployment Report
**Status:** ✅ SUCCESS
**Final Traffic:** 100%
**Rolled Back:** No

### Metrics History
| Time | Success | Latency | Error Rate |
|------|---------|---------|------------|
| 0min | 98.5% | 120ms | 1.2% |
| 1min | 99.1% | 115ms | 0.8% |
| 2min | 99.3% | 110ms | 0.5% |
```

### Landing Queue Report
```markdown
## Landing Queue Report
**Total:** 5 | **Pending:** 2 | **Deploying:** 1 | **Deployed:** 2 | **Failed:** 0

### Currently Deploying
**v1.2.1** -> production
Status: deploying

### Queue
| # | Version | Environment | Message |
|---|--------|------------|---------|
| 1 | v1.2.2 | production | Hotfix |
| 2 | v1.2.3 | staging | New feature |
```

## Integration

### With pi-pipeline
```typescript
// Run as part of ship workflow
const gates = new QualityGates();
const gatesResult = await gates.run('pre-push');

if (gatesResult.passed) {
  const result = await canary.deploy(target);
  if (!result.success) {
    throw new Error('Deployment failed');
  }
}
```

### With pi-audit
```typescript
// Security scan before deploy
const shield = new AgentShield();
const scan = shield.scan(deploymentCode);

if (!scan.passed) {
  console.log('Security issues must be fixed');
  process.exit(1);
}
```

### With pi-recollect
```typescript
// Remember deployment
await memory.remember(
  'deployment',
  `Deployed ${version} to ${environment}`,
  'observation'
);
```
