/**
 * Unit tests: JSONL event stream
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CIEventCollector,
  writeCIEvent,
  isCIStartEvent,
  isCIProgressEvent,
  isCIEditEvent,
  isCITestEvent,
  isCIEndEvent,
} from "../../src/headless/jsonl-stream.ts";
import { Writable } from "node:stream";
import type { CIEvent } from "../../src/types.ts";

describe("CIEventCollector", () => {
  it("collects events in order", () => {
    const collector = new CIEventCollector();
    const e1: CIEvent = { type: "ci_start", timestamp: "", task: "test", mode: "single" };
    const e2: CIEvent = { type: "ci_end", timestamp: "", exit_code: 0, duration_ms: 100 };

    collector.emit(e1);
    collector.emit(e2);

    const all = collector.all();
    assert.equal(all.length, 2);
    assert.equal(all[0].type, "ci_start");
    assert.equal(all[1].type, "ci_end");
  });

  it("auto-fills missing timestamps", () => {
    const collector = new CIEventCollector();
    const event: CIEvent = { type: "ci_start", timestamp: "", task: "t", mode: "single" };

    collector.emit(event);

    const all = collector.all();
    assert.ok(all[0].timestamp.length > 0, "timestamp should be auto-filled");
  });

  it("clear() removes all events", () => {
    const collector = new CIEventCollector();
    collector.emit({ type: "ci_start", timestamp: "", task: "t", mode: "single" });
    collector.clear();
    assert.equal(collector.all().length, 0);
  });
});

describe("writeCIEvent()", () => {
  it("writes single-line JSON to the stream", () => {
    const chunks: string[] = [];
    const stream = new Writable({ write(chunk, _enc, cb) { chunks.push(chunk.toString()); cb(); } });

    writeCIEvent(stream, { type: "ci_start", timestamp: "2025-01-01T00:00:00.000Z", task: "test", mode: "single" });

    assert.equal(chunks.length, 1);
    const parsed = JSON.parse(chunks[0].trim());
    assert.equal(parsed.type, "ci_start");
    // JSONL is one JSON object followed by a newline — exactly one \n at end
    const newlineCount = (chunks[0].match(/\n/g) || []).length;
    assert.equal(newlineCount, 1, "should have exactly one trailing newline");
  });

  it("auto-fills timestamp if empty", () => {
    const chunks: string[] = [];
    const stream = new Writable({ write(chunk, _enc, cb) { chunks.push(chunk.toString()); cb(); } });

    writeCIEvent(stream, { type: "ci_start", timestamp: "", task: "t", mode: "single" });

    const parsed = JSON.parse(chunks[0].trim());
    assert.ok(parsed.timestamp.length > 0, "timestamp should be filled");
  });
});

describe("type guards", () => {
  const startEvent: CIEvent = { type: "ci_start", timestamp: "", task: "t", mode: "single" };
  const progressEvent: CIEvent = { type: "ci_progress", timestamp: "", phase: "exploring" };
  const editEvent: CIEvent = { type: "ci_edit", timestamp: "", file: "a.ts", lines_added: 1, lines_removed: 0 };
  const testEvent: CIEvent = { type: "ci_test", timestamp: "", command: "npm test", passed: 1, failed: 0 };
  const endEvent: CIEvent = { type: "ci_end", timestamp: "", exit_code: 0, duration_ms: 100 };

  it("isCIStartEvent discriminates correctly", () => {
    assert.equal(isCIStartEvent(startEvent), true);
    assert.equal(isCIStartEvent(endEvent), false);
  });

  it("isCIProgressEvent discriminates correctly", () => {
    assert.equal(isCIProgressEvent(progressEvent), true);
    assert.equal(isCIProgressEvent(startEvent), false);
  });

  it("isCIEditEvent discriminates correctly", () => {
    assert.equal(isCIEditEvent(editEvent), true);
    assert.equal(isCIEditEvent(startEvent), false);
  });

  it("isCITestEvent discriminates correctly", () => {
    assert.equal(isCITestEvent(testEvent), true);
    assert.equal(isCITestEvent(startEvent), false);
  });

  it("isCIEndEvent discriminates correctly", () => {
    assert.equal(isCIEndEvent(endEvent), true);
    assert.equal(isCIEndEvent(startEvent), false);
  });
});
