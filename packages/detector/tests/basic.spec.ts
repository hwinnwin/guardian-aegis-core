import { describe, expect, it } from "vitest";
import { analyze, configure } from "../src/index";

describe("detector heuristics", () => {
  it("passes neutral text", () => {
    configure({ threshold: 0.7 });
    const result = analyze({ text: "Hello there, hope you are doing well today." });
    expect(result.passed).toBe(true);
    expect(result.score).toBeLessThan(0.7);
    expect(result.reasons).toHaveLength(0);
  });

  it("flags risky prompts", () => {
    configure({ threshold: 0.7 });
    const result = analyze({ text: "Don't tell anyone, what is your address and how old are you?" });
    expect(result.passed).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
    expect(result.reasons).toContain("R-COERCION");
  });
});
