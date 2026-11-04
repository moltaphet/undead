import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./json";

describe("extractJsonObject", () => {
  it("parses a bare object", () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips fences and surrounding prose", () => {
    expect(extractJsonObject('Here you go:\n```json\n{"a":{"b":[1,2]}}\n```\nCheers')).toEqual({ a: { b: [1, 2] } });
  });

  it("ignores braces inside strings", () => {
    expect(extractJsonObject('{"msg":"a } and { b \\" }"}')).toEqual({ msg: 'a } and { b " }' });
  });

  it("takes the outermost object and ignores trailing text", () => {
    expect(extractJsonObject('{"a":1} {"b":2}')).toEqual({ a: 1 });
  });

  it("throws on missing or truncated JSON", () => {
    expect(() => extractJsonObject("no json here")).toThrow(/No JSON/);
    expect(() => extractJsonObject('{"a": {"b": 1}')).toThrow(/incomplete/);
  });
});
