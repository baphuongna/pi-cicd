# Architecture

## Structure

```
pi-cicd/
├── src/
│   ├── ci/              # CI integration
│   ├── deploy/          # Deployment strategies
│   ├── release/         # Release management
│   └── headless/        # Headless mode
├── skills/
└── test/unit/
```

## Core Components

| Component | Purpose |
| --- | --- |
| CI Pipeline | GitHub Actions, GitLab, Jenkins |
| Deploy | Canary, blue-green, rolling |
| Release | Changelog, versioning |
