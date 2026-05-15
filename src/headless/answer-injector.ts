/**
 * pi-ci — Answer injection from a JSON file.
 *
 * When Pi encounters an interactive prompt in CI mode, it consults an
 * answers file for a pre-supplied response.
 */

import type { AnswerEntry, AnswerFile } from "../types.ts";
import * as fs from "fs";

/**
 * Read and validate an answers JSON file.
 *
 * - Returns an empty array if the file cannot be read.
 * - Skips entries that are missing `match` or `answer` fields.
 * - Throws on invalid JSON.
 */
export async function loadAnswers(filePath: string): Promise<AnswerEntry[]> {
  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = { answer: text };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Answers file must contain a JSON object with an "answers" array`);
  }

  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.answers)) {
    throw new Error(`Answers file must contain an "answers" array`);
  }

  const entries: AnswerEntry[] = [];
  for (const item of obj.answers) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).match === "string" &&
      typeof (item as Record<string, unknown>).answer === "string"
    ) {
      entries.push(item as AnswerEntry);
    }
    // Silently skip malformed entries
  }

  return entries;
}

/**
 * Synchronous variant that reads from a string (useful for testing).
 */
export function parseAnswers(jsonText: string): AnswerEntry[] {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    raw = { answer: jsonText };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Answers file must contain a JSON object with an "answers" array`);
  }

  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.answers)) {
    throw new Error(`Answers file must contain an "answers" array`);
  }

  const entries: AnswerEntry[] = [];
  for (const item of obj.answers) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).match === "string" &&
      typeof (item as Record<string, unknown>).answer === "string"
    ) {
      entries.push(item as AnswerEntry);
    }
  }

  return entries;
}

/**
 * Find a matching answer for the given prompt using substring matching.
 *
 * Returns the first answer whose `match` is found as a substring of `prompt`,
 * or `undefined` if no match is found.
 */
export function matchAnswer(
  entries: AnswerEntry[],
  prompt: string,
): string | undefined {
  for (const entry of entries) {
    if (prompt.includes(entry.match)) {
      return entry.answer;
    }
  }
  return undefined;
}
