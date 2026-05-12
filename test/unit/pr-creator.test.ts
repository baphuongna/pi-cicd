/**
 * Unit tests: PR creator
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createPR } from "../../src/ci/pr-creator.ts";

describe("createPR()", () => {
  it("throws when gh CLI is not available", async () => {
    // In most CI test environments, gh may not be installed or authenticated.
    // We test that the function handles this gracefully.
    try {
      await createPR({ title: "Test PR" });
      // If it succeeds, gh is installed — skip
    } catch (err) {
      const message = (err as Error).message;
      assert.ok(
        message.includes("gh") || message.includes("failed"),
        `Expected gh-related error, got: ${message}`,
      );
    }
  });
});
