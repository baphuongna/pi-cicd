# Command Reference - pi-cicd

## Slash Commands

### /ci
Main CI/CD command.

```bash
/ci <subcommand> [options]
```

### /ci run
Run pipeline.

```bash
/ci run [environment] [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--env` | Environment | default |
| `--var` | Variables | - |
| `--headless` | CI mode | false |
| `--stream` | Output format | text |
| `--timeout` | Max runtime | 1h |

### /ci status
Check status.

```bash
/ci status [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--run-id` | Specific run |
| `--watch` | Live updates |

### /ci deploy
Deploy.

```bash
/ci deploy <environment> [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--confirm` | Require confirmation |
| `--strategy` | Deployment type |
| `--var` | Variables |

### /ci canary
Canary deployment.

```bash
/ci canary <action> [options]
```

#### Actions

| Action | Description |
|--------|-------------|
| `deploy` | Start canary |
| `promote` | Increase traffic |
| `rollback` | Revert canary |
| `status` | Check status |

#### Options

| Option | Description |
|--------|-------------|
| `--percentage` | Traffic % |
| `--service` | Service name |

### /ci queue
Landing queue.

```bash
/ci queue <action> [options]
```

## Tools

### ci_run

```javascript
ci_run({
  environment: "production",
  variables: { VERSION: "1.2.3" },
  headless: false,
  stream: "text"
})
```

### ci_status

```javascript
ci_status({ runId: "abc123" })
```

### ci_deploy

```javascript
ci_deploy({
  environment: "production",
  strategy: "canary",
  confirm: true
})
```

### ci_canary

```javascript
ci_canary({
  action: "deploy",
  service: "api",
  percentage: 10
})
```

## Exit Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | SUCCESS | Pipeline completed |
| 1 | ERROR | General error |
| 2 | TIMEOUT | Exceeded timeout |
| 10 | BLOCKED | Gate verification failed |
| 11 | CANCELLED | User cancelled |
| 12 | DEPLOY_FAILED | Deployment error |
| 13 | HEALTH_CHECK_FAILED | Health check failed |
| 14 | ROLLBACK | Rolled back |
