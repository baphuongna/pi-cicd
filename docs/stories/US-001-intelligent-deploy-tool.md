# US-001: Intelligent Deploy Tool

## User Story
As an agent, I want to monitor CI/CD pipelines, manage canary deployments, and track landing queues so that I can safely deploy changes to production.

## Status
- [x] Implemented

## Commands
- `/ci` - CI status command

## Features
- CI run tracking
- Canary deployment support
- Landing queue management
- Exit code resolution

## Triggers
- "deploy", "canary", "rollout", "landing queue", "production"

## Acceptance Criteria
- [x] CI status command shows run information
- [x] Exit codes are properly resolved
- [x] Can track deployment progress

## Notes
See `skills/intelligent-deploy/SKILL.md` for detailed usage.
