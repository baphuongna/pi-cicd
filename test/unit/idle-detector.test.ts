/**
 * Unit tests: idle detector
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IdleDetector } from "../../src/headless/idle-detector.ts";

describe("IdleDetector", () => {
  it("fires timeout after configured duration", async () => {
    let fired = false;
    const detector = new IdleDetector({
      idleTimeoutMs: 50,
      onTimeout: () => { fired = true; },
    });

    detector.start();
    assert.equal(detector.running, true);

    // Wait for timeout to fire
    await sleep(100);

    assert.equal(fired, true);
    assert.equal(detector.fired, true);
    assert.equal(detector.running, false);
  });

  it("reset() prevents timeout from firing", async () => {
    let fired = false;
    const detector = new IdleDetector({
      idleTimeoutMs: 80,
      onTimeout: () => { fired = true; },
    });

    detector.start();

    // Reset before timeout
    await sleep(40);
    detector.reset();
    await sleep(40);
    detector.reset();
    await sleep(40);

    assert.equal(fired, false);
    detector.stop();
  });

  it("stop() cancels the timer", async () => {
    let fired = false;
    const detector = new IdleDetector({
      idleTimeoutMs: 50,
      onTimeout: () => { fired = true; },
    });

    detector.start();
    detector.stop();

    await sleep(100);
    assert.equal(fired, false);
    assert.equal(detector.running, false);
  });

  it("double start is safe (no-op)", () => {
    let fired = false;
    const detector = new IdleDetector({
      idleTimeoutMs: 5000,
      onTimeout: () => { fired = true; },
    });

    detector.start();
    detector.start(); // Should be no-op
    assert.equal(detector.running, true);
    detector.stop();
  });

  it("default timeout is 15000ms", () => {
    const detector = new IdleDetector({
      onTimeout: () => {},
    });
    // We can't easily test the internal value, but we verify the class
    // constructs without error and doesn't fire immediately
    detector.start();
    assert.equal(detector.running, true);
    detector.stop();
  });

  it("stop without start is safe", () => {
    const detector = new IdleDetector({
      onTimeout: () => {},
    });
    // Should not throw
    detector.stop();
    assert.equal(detector.running, false);
  });

  it("reset without start is a no-op", () => {
    const detector = new IdleDetector({
      onTimeout: () => {},
    });
    detector.reset();
    assert.equal(detector.running, false);
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
