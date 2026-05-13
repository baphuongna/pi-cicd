# Configuration - pi-cicd

## Configuration File

Create `pi-cicd.yaml` or `pi-cicd.json`:

```yaml
name: my-app
version: 1.0

# Pipeline definition
pipeline:
  stages:
    - name: build
      steps:
        - run: npm install
        - run: npm run build
    
    - name: test
      steps:
        - run: npm test
      timeout: 10m
    
    - name: deploy
      steps:
        - run: ./deploy.sh
      conditions:
        - if: test.success

# Environments
environments:
  production:
    cluster: prod-us-east
    namespace: production
    replicas: 10
    
  staging:
    cluster: staging-us-east
    namespace: staging
    replicas: 3

# Canary config
canary:
  initialPercentage: 10
  incrementPercentage: 25
  healthCheckEndpoint: /health
  interval: 30s
  autoPromote: true

# Landing queue
queue:
  maxConcurrent: 1
  priorityLevels:
    - critical
    - high
    - normal
    - low

# Headless mode
headless:
  exitCode: true
  streamFormat: jsonl
  failOn:
    - gate_failure
    - deployment_failure
```

## JSON Config

```json
{
  "name": "my-app",
  "pipeline": {
    "stages": [...]
  },
  "environments": {
    "production": {...}
  },
  "canary": {
    "initialPercentage": 10
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PI_CI_ENV` | Default environment | default |
| `PI_CI_TIMEOUT` | Default timeout | 1h |
| `PI_CI_HEADLESS` | Headless mode | false |
| `CI` | CI environment flag | false |

## Per-Command Options

```bash
# Timeout override
/ci run --timeout=30m

# Variables
/ci run --var=VERSION=1.2.3 --var=ENV=prod

# Stream format
/ci run --stream=jsonl
```

## Secrets Management

Store in environment or secrets manager:

```bash
export PI_CI_SECRET_API_KEY=xxx
export PI_CI_SECRET_DEPLOY_TOKEN=xxx
```

Reference in pipeline:

```yaml
steps:
  - run: deploy.sh
    env:
      API_KEY: ${SECRET:API_KEY}
```
