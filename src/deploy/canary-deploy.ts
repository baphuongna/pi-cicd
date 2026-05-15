/**
 * Canary Deployment with Monitoring
 * Gradual rollout with automatic rollback
 * Based on gstack /canary pattern
 */

export interface CanaryConfig {
  /** Initial traffic percentage for canary */
  initialPercentage: number;
  /** Increment per step */
  incrementPercentage: number;
  /** Time between increments (ms) */
  stepInterval: number;
  /** Total duration before full rollout (ms) */
  totalDuration: number;
  /** Metrics to monitor */
  metrics: {
    successRate: { min: number };
    latency: { max: number };
    errorRate: { max: number };
  };
}

export interface CanaryMetrics {
  timestamp: number;
  successRate: number;
  latency: number;
  errorRate: number;
  requests: number;
}

export interface CanaryResult {
  success: boolean;
  finalPercentage: number;
  metrics: CanaryMetrics[];
  issues: string[];
  rolledBack: boolean;
}

export interface DeployTarget {
  name: string;
  url: string;
  healthy: boolean;
}

/**
 * Canary Deployment Manager
 */
export class CanaryDeploy {
  private config: CanaryConfig;
  private metricsHistory: CanaryMetrics[] = [];

  constructor(config?: Partial<CanaryConfig>) {
    this.config = {
      initialPercentage: config?.initialPercentage ?? 10,
      incrementPercentage: config?.incrementPercentage ?? 10,
      stepInterval: config?.stepInterval ?? 60000, // 1 minute
      totalDuration: config?.totalDuration ?? 300000, // 5 minutes
      metrics: config?.metrics ?? {
        successRate: { min: 95 },
        latency: { max: 500 },
        errorRate: { max: 5 },
      },
    };
  }

  /**
   * Execute canary deployment
   */
  async deploy(target: DeployTarget): Promise<CanaryResult> {
    console.log(`Starting canary deployment to ${target.name}`);
    console.log(`Initial: ${this.config.initialPercentage}% traffic`);

    const issues: string[] = [];
    let currentPercentage = this.config.initialPercentage;
    let rolledBack = false;

    const startTime = Date.now();

    while (Date.now() - startTime < this.config.totalDuration) {
      // Get current metrics
      const metrics = await this.getMetrics(target);
      this.metricsHistory.push(metrics);

      // Check for issues
      const detectedIssues = this.checkMetrics(metrics);
      if (detectedIssues.length > 0) {
        issues.push(...detectedIssues);
        console.log(`⚠️ Issues detected: ${detectedIssues.join(', ')}`);

        // Auto-rollback on critical issues
        if (metrics.successRate < 90 || metrics.errorRate > 10) {
          console.log('🔴 Critical issues - rolling back!');
          rolledBack = true;
          break;
        }
      }

      // Print status
      console.log(`[${Math.round((Date.now() - startTime) / 1000)}s] ` +
        `Traffic: ${currentPercentage}% | ` +
        `Success: ${metrics.successRate.toFixed(1)}% | ` +
        `Latency: ${metrics.latency.toFixed(0)}ms`);

      // Wait for next step
      await this.delay(this.config.stepInterval);

      // Increment traffic
      currentPercentage = Math.min(100, currentPercentage + this.config.incrementPercentage);
    }

    return {
      success: !rolledBack,
      finalPercentage: rolledBack ? 0 : currentPercentage,
      metrics: this.metricsHistory,
      issues,
      rolledBack,
    };
  }

  /**
   * Get current metrics from target
   */
  private async getMetrics(target: DeployTarget): Promise<CanaryMetrics> {
    // Simulate metrics collection
    // In production: call monitoring API

    return {
      timestamp: Date.now(),
      successRate: 95 + (new Uint32Array(1)[0]! % 5),
      latency: 50 + (new Uint32Array(1)[0]! % 100),
      errorRate: (new Uint32Array(1)[0]! % 3),
      requests: Math.floor(100 + (new Uint32Array(1)[0]! % 900)),
    };
  }

  /**
   * Check metrics against thresholds
   */
  private checkMetrics(metrics: CanaryMetrics): string[] {
    const issues: string[] = [];

    if (metrics.successRate < this.config.metrics.successRate.min) {
      issues.push(`Low success rate: ${metrics.successRate.toFixed(1)}%`);
    }

    if (metrics.latency > this.config.metrics.latency.max) {
      issues.push(`High latency: ${metrics.latency.toFixed(0)}ms`);
    }

    if (metrics.errorRate > this.config.metrics.errorRate.max) {
      issues.push(`High error rate: ${metrics.errorRate.toFixed(1)}%`);
    }

    return issues;
  }

  /**
   * Rollback deployment
   */
  async rollback(target: DeployTarget): Promise<void> {
    console.log(`Rolling back ${target.name}`);
    // In production: call rollback API
    await this.delay(1000);
    console.log('Rollback complete');
  }

  /**
   * Get deployment history
   */
  getHistory(): CanaryMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Generate deployment report
   */
  formatReport(result: CanaryResult): string {
    const lines: string[] = [];

    lines.push('## Canary Deployment Report\n');
    lines.push(`**Status:** ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    lines.push(`**Final Traffic:** ${result.finalPercentage}%`);
    lines.push(`**Rolled Back:** ${result.rolledBack ? 'Yes' : 'No'}\n`);

    if (result.metrics.length > 0) {
      lines.push('### Metrics History\n');
      lines.push('| Time | Success | Latency | Error Rate |');
      lines.push('|------|---------|---------|------------|');

      result.metrics.forEach((m, i) => {
        lines.push(`| ${i * 1}min | ${m.successRate.toFixed(1)}% | ${m.latency.toFixed(0)}ms | ${m.errorRate.toFixed(1)}% |`);
      });
      lines.push('');
    }

    if (result.issues.length > 0) {
      lines.push('### Issues Detected\n');
      for (const issue of result.issues) {
        lines.push(`- ${issue}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
