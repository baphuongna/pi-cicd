/**
 * pi-ci — JSONL event stream utilities.
 *
 * Writes CI events as single-line JSON to a writable stream and provides
 * type-guard helpers for event discrimination.
 */

import type { Writable } from "node:stream";
import type {
  CIEvent,
  CIStartEvent,
  CIProgressEvent,
  CIEditEvent,
  CITestEvent,
  CICostEvent,
  CIEndEvent,
} from "../types.ts";

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Ensure an event has a timestamp, injecting `now` if missing.
 */
function ensureTimestamp<T extends CIEvent>(event: T): T & { timestamp: string } {
  if (!event.timestamp) {
    return { ...event, timestamp: new Date().toISOString() };
  }
  return event as T & { timestamp: string };
}

/**
 * Serialise a CI event and write it as a single JSONL line to the stream.
 */
export function writeCIEvent(stream: Writable, event: CIEvent): void {
  const stamped = ensureTimestamp(event);
  stream.write(JSON.stringify(stamped) + "\n");
}

// ---------------------------------------------------------------------------
// Event emitter (collects events for reporting)
// ---------------------------------------------------------------------------

export class CIEventCollector {
  private readonly events: CIEvent[] = [];

  /** Record an event. Auto-fills timestamp if missing. */
  emit(event: CIEvent): void {
    this.events.push(ensureTimestamp(event));
  }

  /** Return all collected events in order. */
  all(): CIEvent[] {
    return [...this.events];
  }

  /** Reset the collector. */
  clear(): void {
    this.events.length = 0;
  }
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCIStartEvent(e: CIEvent): e is CIStartEvent {
  return e.type === "ci_start";
}

export function isCIProgressEvent(e: CIEvent): e is CIProgressEvent {
  return e.type === "ci_progress";
}

export function isCIEditEvent(e: CIEvent): e is CIEditEvent {
  return e.type === "ci_edit";
}

export function isCITestEvent(e: CIEvent): e is CITestEvent {
  return e.type === "ci_test";
}

export function isCICostEvent(e: CIEvent): e is CICostEvent {
  return e.type === "ci_cost";
}

export function isCIEndEvent(e: CIEvent): e is CIEndEvent {
  return e.type === "ci_end";
}
