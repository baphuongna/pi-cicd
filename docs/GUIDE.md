# User Guide - pi-cicd

## Overview

pi-cicd brings CI/CD capabilities to Pi coding agents with structured pipelines, exit codes, and deployment strategies.

## Pipeline Structure

### Define Pipeline

Create `pi-cicd.yaml`:

```yaml
name: my-app
version: 1.0

stages:
  - name: build
    steps:
      - run: npm install
      - run: npm run build
  
  - name: test
    steps:
      - run: npm test
      - run: npm run lint
  
  - name: deploy
    steps:
      - run: ./deploy.sh production
    conditions:
      - if: stage(build).success
```

### Pipeline Execution

```bash
/ci run [--env=<env>] [--var=<key>=<value>]
```

## Deployment Strategies

### Canary Deployment

```bash
# Deploy to 10% of traffic
/ci canary deploy --service=api --percentage=10

# Monitor health
/ci canary status

# Promote to 50%
/ci canary promote --percentage=50

# Full rollout
/ci canary promote --percentage=100

# Or rollback
/ci canary rollback
```

### Blue-Green Deployment

```bash
/ci deploy blue-green --service=api
```

### Rolling Deployment

```bash
/ci deploy rolling --service=api --batchSize=25%
```

## Headless Mode

For CI environments:

```bash
/ci run --headless
```

### Output Format

```
## STAGE: build
action=start stage=build
action=complete stage=build duration=23s
## STAGE: test  
action=start stage=test
action=complete stage=test duration=45s passed=123 failed=0
## RESULT
action=complete status=success duration=1m 8s
```

## Event Streaming

JSONL output for tooling:

```bash
/ci run --stream=jsonl
```

Output:
```jsonl
{"event":"stage_start","stage":"build"}
{"event":"step_start","stage":"build","step":"npm install"}
{"event":"step_complete","stage":"build","step":"npm install","duration":23}
{"event":"stage_complete","stage":"build","duration":23}
{"event":"pipeline_complete","status":"success","duration":68}
```

## Landing Queue

Queue deployments with safety:

```bash
# Add to queue
/ci queue add production --priority=high

# View queue
/ci queue list

# Process queue
/ci queue process
```

Features:
- Priority ordering
- Automatic rollback on failure
- Health check gates
- Concurrency limits

## Verification Gates

```yaml
gates:
  - name: tests-pass
    check: test-results.success
  
  - name: security-scan
    check: security-report.critical == 0
  
  - name: manual-approval
    check: approval.authorized
```

## Environment Configuration

### Environments

```yaml
environments:
  production:
    cluster: prod-us-east
    replicas: 10
    healthCheck: /health
    
  staging:
    cluster: staging-us-east
    replicas: 3
```

### Variables

```bash
# Set variables
/ci var set DATABASE_URL=postgres://...

# Use in pipeline
/ci run --var=DATABASE_URL=...
```
