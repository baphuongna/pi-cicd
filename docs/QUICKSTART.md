# Quick Start - pi-cicd

## Installation

```bash
pi install npm:pi-cicd
```

## Basic Usage

### 1. Run Pipeline

```bash
# Run default pipeline
/ci run

# Run specific environment
/ci run production

# Run with variables
/ci run staging --var=VERSION=1.2.3
```

### 2. Check Status

```bash
# Check current run status
/ci status

# Check specific run
/ci status --run-id=abc123
```

### 3. Deploy

```bash
# Deploy to environment
/ci deploy production

# Deploy with confirmation
/ci deploy staging --confirm
```

### 4. Canary Deployment

```bash
# Start canary (10% traffic)
/ci canary deploy --percentage 10

# Increase canary
/ci canary promote --percentage 25

# Rollback canary
/ci canary rollback
```

## Examples

### Example: Production Deploy

```
/ci run production

Output:
## CI/CD Pipeline: production

### Stage: build
✅ npm install (23s)
✅ npm run build (45s)

### Stage: test
✅ Unit tests (89 tests, 12s)
✅ Integration tests (34 tests, 28s)

### Stage: deploy
🚀 Deploying to production...

✅ Pipeline complete (2m 34s)
```

### Example: Headless CI

```bash
# In GitHub Actions
- name: Run Pi CI
  run: |
    pi ci run --headless --exit-code
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Timeout |
| 10 | Blocked (verification failed) |
| 11 | Cancelled |
| 12 | Deployment failed |
