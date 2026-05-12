/**
 * Unit tests: answer injector
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAnswers, matchAnswer } from "../../src/headless/answer-injector.ts";

describe("parseAnswers()", () => {
  it("parses a valid answer file", () => {
    const json = JSON.stringify({
      answers: [
        { match: "Select an option:", answer: "1" },
        { match: "Continue?", answer: "yes" },
      ],
    });
    const entries = parseAnswers(json);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].match, "Select an option:");
    assert.equal(entries[0].answer, "1");
    assert.equal(entries[1].match, "Continue?");
    assert.equal(entries[1].answer, "yes");
  });

  it("throws on invalid JSON", () => {
    assert.throws(() => parseAnswers("not json"));
  });

  it("throws when top-level is not an object", () => {
    assert.throws(() => parseAnswers("[]"));
    assert.throws(() => parseAnswers('"hello"'));
  });

  it("throws when answers field is not an array", () => {
    assert.throws(() => parseAnswers(JSON.stringify({ answers: "not array" })));
  });

  it("skips entries missing match field", () => {
    const json = JSON.stringify({
      answers: [
        { answer: "yes" },
        { match: "Continue?", answer: "no" },
      ],
    });
    const entries = parseAnswers(json);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].match, "Continue?");
  });

  it("skips entries missing answer field", () => {
    const json = JSON.stringify({
      answers: [
        { match: "Continue?" },
        { match: "OK?", answer: "yes" },
      ],
    });
    const entries = parseAnswers(json);
    assert.equal(entries.length, 1);
  });

  it("returns empty array for empty answers", () => {
    const entries = parseAnswers(JSON.stringify({ answers: [] }));
    assert.equal(entries.length, 0);
  });
});

describe("matchAnswer()", () => {
  const entries = [
    { match: "Select an option:", answer: "1" },
    { match: "Continue?", answer: "yes" },
    { match: "Enter filename:", answer: "output.ts" },
  ];

  it("finds matching answer by substring", () => {
    assert.equal(matchAnswer(entries, "Please Select an option: [1/2/3]"), "1");
  });

  it("finds another matching answer", () => {
    assert.equal(matchAnswer(entries, "Do you want to Continue? (y/n)"), "yes");
  });

  it("returns undefined when no match", () => {
    assert.equal(matchAnswer(entries, "Something completely different"), undefined);
  });

  it("returns first match when multiple could match", () => {
    const multi = [
      { match: "test", answer: "first" },
      { match: "test", answer: "second" },
    ];
    assert.equal(matchAnswer(multi, "this is a test"), "first");
  });

  it("works with empty entries", () => {
    assert.equal(matchAnswer([], "any prompt"), undefined);
  });
});
