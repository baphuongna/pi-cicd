# pi-cicd

CI/CD workflow automation and deployment extension for coding agents.

## Features

- **Deployment Workflow** - Declarative deployment with stages
- **Canary Deployment** - Gradual rollout with traffic shifting
- **Landing Queue** - Managed deployment queue with backoff
- **Test Runner** - Automated test execution and reporting
- **PR Creator** - Automated pull request generation

## Installation

```bash
npm install pi-cicd
```

## Usage

### Commands

- `/deploy [env]` - Deploy to specified environment
- `/canary [percentage]` - Start canary deployment
- `/rollback` - Rollback to previous version
- `/pr [type]` - Create pull request

### Deployment Workflow

```typescript
import { createDeploymentWorkflow } from 'pi-cicd';

const workflow = createDeploymentWorkflow({
  stages: ['build', 'test', 'staging', 'production'],
  canary: { initial: 10, increment: 20, interval: 60000 },
});
```

## Architecture

```
src/
├── deploy/
│   ├── canary-deploy.ts   # Canary deployment
│   └── landing-queue.ts    # Deployment queue
├── workflow/
│   └── deployment-workflow.ts
├── automation/
│   ├── pr-creator.ts      # PR generation
│   └── pipeline.ts        # Pipeline automation
└── index.ts
```

## Patterns Applied

- DeploymentWorkflow from pi-crew
- LandingQueue from gstack
- Pipeline automation from vetc-dev-kit

## License

MIT
