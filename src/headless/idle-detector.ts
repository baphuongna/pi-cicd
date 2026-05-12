/**
 * pi-ci — Idle timeout detection.
 *
 * If no activity is detected within the configured timeout, the callback fires.
 */

export interface IdleDetectorOptions {
  /** Timeout in milliseconds. Default: 15 000. */
  idleTimeoutMs?: number;
  /** Called when the idle timeout is reached. */
  onTimeout: () => void;
}

const DEFAULT_IDLE_TIMEOUT_MS = 15_000;

export class IdleDetector {
  private readonly idleTimeoutMs: number;
  private readonly onTimeout: () => void;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private _running = false;
  private _fired = false;

  constructor(options: IdleDetectorOptions) {
    this.idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
    this.onTimeout = options.onTimeout;
  }

  /** Whether the detector is currently running. */
  get running(): boolean {
    return this._running;
  }

  /** Whether the timeout has already fired. */
  get fired(): boolean {
    return this._fired;
  }

  /** Start the idle timer. Safe to call multiple times (no-op if already running). */
  start(): void {
    if (this._running) return;
    this._running = true;
    this._fired = false;
    this.scheduleTimer();
  }

  /** Reset the idle timer. If not running, this is a no-op. */
  reset(): void {
    if (!this._running) return;
    this.clearTimer();
    this.scheduleTimer();
  }

  /** Stop the idle timer. */
  stop(): void {
    this._running = false;
    this._fired = false;
    this.clearTimer();
  }

  private scheduleTimer(): void {
    this.timer = setTimeout(() => {
      if (this._running) {
        this._running = false;
        this._fired = true;
        this.onTimeout();
      }
    }, this.idleTimeoutMs);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
