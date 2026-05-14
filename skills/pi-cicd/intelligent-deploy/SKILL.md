---
name: intelligent-deploy
description: CI/CD pipeline monitoring, canary deployment management, and landing queue orchestration
triggers:
  - deploy
  - canary
  - rollout
  - landing queue
  - production
  - CI status
  - pipeline
  - release
  - build
requirements:
  tools: [bash]
  context: [CI configuration, deployment scripts]
---

# Intelligent Deploy Skill

## Objective
Monitor CI/CD pipelines, manage canary deployments, and track landing queues for safe production releases.

## Tools Available
- `/ci` command - Show CI status and run information
- `bash` - For running CI scripts and deployment commands

## When to Use
- When deploying to production
- When monitoring CI/CD pipelines
- When managing canary releases
- When tracking landing queues
- When investigating build failures
- When checking deployment status

## CI Status Command

### Usage
```
/ci [run-id]
```

Shows:
- Current/last CI run status
- Exit codes
- Duration
- Events

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General failure |
| 2 | Misuse/Invalid input |
| 3 | Configuration error |
| 124 | Timeout |
| 137 | SIGKILL (OOM) |

## Deployment Strategies

### Canary Deployment
1. Deploy to small percentage
2. Monitor metrics
3. Gradually increase
4. Full rollout or rollback

### Landing Queue
- Queue changes for controlled rollout
- Automatic promotion
- Manual gates for risky changes

## Pipeline Monitoring

### Status Check
```
/ci
```

Returns:
- Run ID
- Start time
- Events (pass/fail)
- Exit code
- Duration

### Historical Analysis
Track patterns in:
- Build times
- Failure rates
- Flaky tests

## Examples

### Check CI Status
```
User: What's the CI status?
Agent:
  /ci
```

### Check Specific Run
```
Agent:
  /ci run-123
```

### Analyze Failure
```
User: Why did the build fail?
Agent:
  /ci
  # Analyze events and exit code
```

### Run Deployment
```bash
# Deploy with canary
./scripts/deploy.sh --strategy=canary --initial=5%

# Check deployment status
/ci
```

## Configuration

### Pipeline Config
```yaml
ci:
  timeout: 300
  retry: 2
  parallel: true
  
deploy:
  strategy: canary
  canary:
    initial: 5%
    increment: 10%
    pause: 5m
```

## Integration
- With pi-pipeline for verification gates
- With pi-debug for error investigation
- With pi-render for status display

## Integration with pi-recollect

### Store Deployment Patterns

```typescript
memory_store({
  category: "deployment",
  title: "Docker build failed on memory",
  content: `Issue: Docker build OOM killed
Fix: Added --memory=2g to docker build
Prevention: Use multi-stage build for smaller images`,
  metadata: { 
    environment: "production",
    type: "OOM"
  }
})
```

### Before Deploying

```typescript
memory_search({
  query: "deployment failed production",
  maxResults: 5
})
```
