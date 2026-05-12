/**
 * Landing Queue - Process deployments in order
 * Based on gstack /landing-report pattern
 */

export type DeployStatus = 'pending' | 'deploying' | 'deployed' | 'failed' | 'cancelled';
export type DeployEnvironment = 'staging' | 'production';

export interface QueuedDeploy {
  id: string;
  version: string;
  environment: DeployEnvironment;
  status: DeployStatus;
  createdAt: number;
  deployedAt?: number;
  message?: string;
  logs: string[];
}

export interface LandingQueueStats {
  total: number;
  pending: number;
  deploying: number;
  deployed: number;
  failed: number;
}

/**
 * Landing Queue Manager
 */
export class LandingQueue {
  private queue: QueuedDeploy[] = [];
  private current: QueuedDeploy | null = null;

  /**
   * Add deployment to queue
   */
  enqueue(version: string, environment: DeployEnvironment, message?: string): QueuedDeploy {
    const deploy: QueuedDeploy = {
      id: `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version,
      environment,
      status: 'pending',
      createdAt: Date.now(),
      message,
      logs: [],
    };

    this.queue.push(deploy);
    this.log(deploy.id, `Added to queue: ${version} -> ${environment}`);

    return deploy;
  }

  /**
   * Get next pending deployment
   */
  peek(): QueuedDeploy | undefined {
    return this.queue.find((d) => d.status === 'pending');
  }

  /**
   * Start deploying next item
   */
  async startNext(): Promise<QueuedDeploy | null> {
    const next = this.peek();
    if (!next) return null;

    // Mark as deploying
    next.status = 'deploying';
    this.current = next;
    this.log(next.id, 'Starting deployment');

    return next;
  }

  /**
   * Mark deployment as complete
   */
  complete(id: string, success: boolean): void {
    const deploy = this.queue.find((d) => d.id === id);
    if (!deploy) return;

    deploy.status = success ? 'deployed' : 'failed';
    deploy.deployedAt = Date.now();
    this.log(id, success ? 'Deployment successful' : 'Deployment failed');

    if (this.current?.id === id) {
      this.current = null;
    }
  }

  /**
   * Cancel a deployment
   */
  cancel(id: string): void {
    const deploy = this.queue.find((d) => d.id === id);
    if (!deploy) return;

    if (deploy.status === 'deploying') {
      this.log(id, 'Cannot cancel - deployment in progress');
      return;
    }

    deploy.status = 'cancelled';
    this.log(id, 'Cancelled');
  }

  /**
   * Get deployment by ID
   */
  get(id: string): QueuedDeploy | undefined {
    return this.queue.find((d) => d.id === id);
  }

  /**
   * Get queue status
   */
  getStats(): LandingQueueStats {
    return {
      total: this.queue.length,
      pending: this.queue.filter((d) => d.status === 'pending').length,
      deploying: this.queue.filter((d) => d.status === 'deploying').length,
      deployed: this.queue.filter((d) => d.status === 'deployed').length,
      failed: this.queue.filter((d) => d.status === 'failed').length,
    };
  }

  /**
   * Get all deployments
   */
  getAll(): QueuedDeploy[] {
    return [...this.queue].sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get pending deployments
   */
  getPending(): QueuedDeploy[] {
    return this.queue
      .filter((d) => d.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Get current deploying
   */
  getCurrent(): QueuedDeploy | null {
    return this.current;
  }

  /**
   * Add log entry
   */
  private log(id: string, message: string): void {
    const deploy = this.queue.find((d) => d.id === id);
    if (deploy) {
      deploy.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }

  /**
   * Clear completed deployments
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(
      (d) => d.status === 'pending' || d.status === 'deploying'
    );
  }

  /**
   * Format queue as markdown report
   */
  formatReport(): string {
    const stats = this.getStats();
    const lines: string[] = [];

    lines.push('## Landing Queue Report\n');
    lines.push(`**Total:** ${stats.total} | **Pending:** ${stats.pending} | **Deploying:** ${stats.deploying} | **Deployed:** ${stats.deployed} | **Failed:** ${stats.failed}\n`);

    const current = this.getCurrent();
    if (current) {
      lines.push('### Currently Deploying\n');
      lines.push(`**${current.version}** -> ${current.environment}`);
      lines.push(`Status: ${current.status}`);
      lines.push('');
    }

    const pending = this.getPending();
    if (pending.length > 0) {
      lines.push('### Queue\n');
      lines.push('| # | Version | Environment | Message |');
      lines.push('|---|--------|------------|---------|');

      pending.forEach((d, i) => {
        lines.push(`| ${i + 1} | ${d.version} | ${d.environment} | ${d.message || '-'} |`);
      });
      lines.push('');
    }

    const recent = this.queue
      .filter((d) => d.status === 'deployed' || d.status === 'failed')
      .slice(0, 5);

    if (recent.length > 0) {
      lines.push('### Recent\n');
      lines.push('| Version | Environment | Status | Time |');
      lines.push('|---------|------------|--------|------|');

      for (const d of recent) {
        const icon = d.status === 'deployed' ? '✅' : '❌';
        const time = d.deployedAt
          ? new Date(d.deployedAt).toLocaleTimeString()
          : '-';
        lines.push(`| ${d.version} | ${d.environment} | ${icon} ${d.status} | ${time} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
