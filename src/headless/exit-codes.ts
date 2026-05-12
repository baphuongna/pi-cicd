/**
 * pi-ci — Exit code resolution helpers.
 */

import { EXIT_CODES, type ExitCode } from "../types.ts";

/**
 * Map a symbolic status string to a numeric exit code.
 *
 * Unknown / unexpected statuses resolve to ERROR (1).
 */
export function resolveExitCode(status: string): ExitCode {
  switch (status) {
    case "success":
      return EXIT_CODES.SUCCESS;
    case "error":
    case "timeout":
      return EXIT_CODES.ERROR;
    case "blocked":
      return EXIT_CODES.BLOCKED;
    case "cancelled":
      return EXIT_CODES.CANCELLED;
    case "needs_input":
    case "needs-input":
      return EXIT_CODES.NEEDS_INPUT;
    default:
      return EXIT_CODES.ERROR;
  }
}

export { EXIT_CODES };
export type { ExitCode };
