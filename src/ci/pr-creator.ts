/**
 * pi-ci — PR creation via the GitHub CLI (`gh`).
 *
 * Wraps `gh pr create` with structured error handling.
 */

import { execFile } from "node:child_process";
import type { PROptions, PRResult } from "../types.ts";

/**
 * Create a pull request using the `gh` CLI.
 *
 * Throws if `gh` is not installed or the command fails.
 */
export async function createPR(options: PROptions): Promise<PRResult> {
  const args = ["pr", "create", "--title", options.title];

  if (options.body) {
    args.push("--body", options.body);
  }
  if (options.base) {
    args.push("--base", options.base);
  }
  if (options.head) {
    args.push("--head", options.head);
  }
  if (options.draft) {
    args.push("--draft");
  }
  for (const label of options.labels ?? []) {
    args.push("--label", label);
  }

  const output = await runGh(args);

  // Parse the PR URL from the output
  const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/);
  if (!urlMatch) {
    throw new Error(`Failed to parse PR URL from gh output: ${output}`);
  }

  return {
    url: urlMatch[0],
    number: parseInt(urlMatch[1], 10),
  };
}

/**
 * Detect the default (base) branch for the current repository.
 */
export async function detectBaseBranch(): Promise<string> {
  const output = await runGh(["repo", "view", "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]);
  return output.trim() || "main";
}

/**
 * Execute a `gh` command and return stdout.
 */
function runGh(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { timeout: 60_000 }, (err, stdout, stderr) => {
      if (err) {
        const message = stderr?.trim() || err.message;
        if (err.code === "ENOENT") {
          reject(new Error("gh CLI is not installed. Install it from https://cli.github.com"));
        } else {
          reject(new Error(`gh ${args.join(" ")} failed: ${message}`));
        }
        return;
      }
      resolve(stdout);
    });
  });
}
