/**
 * Unit tests: exit codes
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXIT_CODES, resolveExitCode } from "../../src/headless/exit-codes.ts";

describe("EXIT_CODES", () => {
  it("has correct SUCCESS value", () => {
    assert.equal(EXIT_CODES.SUCCESS, 0);
  });

  it("has correct ERROR value", () => {
    assert.equal(EXIT_CODES.ERROR, 1);
  });

  it("has correct TIMEOUT value (same as ERROR)", () => {
    assert.equal(EXIT_CODES.TIMEOUT, 1);
  });

  it("has correct BLOCKED value", () => {
    assert.equal(EXIT_CODES.BLOCKED, 10);
  });

  it("has correct CANCELLED value", () => {
    assert.equal(EXIT_CODES.CANCELLED, 11);
  });

  it("has correct NEEDS_INPUT value", () => {
    assert.equal(EXIT_CODES.NEEDS_INPUT, 12);
  });
});

describe("resolveExitCode()", () => {
  it("maps 'success' to 0", () => {
    assert.equal(resolveExitCode("success"), 0);
  });

  it("maps 'error' to 1", () => {
    assert.equal(resolveExitCode("error"), 1);
  });

  it("maps 'timeout' to 1", () => {
    assert.equal(resolveExitCode("timeout"), 1);
  });

  it("maps 'blocked' to 10", () => {
    assert.equal(resolveExitCode("blocked"), 10);
  });

  it("maps 'cancelled' to 11", () => {
    assert.equal(resolveExitCode("cancelled"), 11);
  });

  it("maps 'needs_input' to 12", () => {
    assert.equal(resolveExitCode("needs_input"), 12);
  });

  it("maps 'needs-input' (hyphen) to 12", () => {
    assert.equal(resolveExitCode("needs-input"), 12);
  });

  it("defaults unknown status to ERROR (1)", () => {
    assert.equal(resolveExitCode("unknown_status"), 1);
    assert.equal(resolveExitCode(""), 1);
    assert.equal(resolveExitCode("random"), 1);
  });
});
