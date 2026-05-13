# pi-cicd

CI/CD workflow automation extension for Pi coding agents.

## Features

- **Pipeline Orchestration** - Define and run CI/CD pipelines
- **Headless Mode** - Run in CI environments with exit codes
- **Exit Codes** - Structured exit codes (0=success, 1=error, 10=blocked, 11=cancelled)
- **Answer Injection** - Provide answers non-interactively
- **Event Streaming** - JSONL output for CI integration
- **Canary Deployments** - Progressive deployment with health checks
- **Landing Queue** - Queue deployments with rollback capability

## Install

```bash
pi install npm:pi-cicd
```

## Usage

### Run Pipeline
```bash
/ci run production
```

### Check Status
```bash
/ci status
```

### Deploy Canary
```bash
/ci canary deploy --percentage 10
```

## Commands

- `/ci` - CI/CD main command
- `/ci run` - Run pipeline
- `/ci status` - Check status
- `/ci deploy` - Deploy

## Verify

```bash
pi list
```

## License

MIT