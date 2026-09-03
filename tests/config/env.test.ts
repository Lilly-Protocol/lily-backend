import { describe, expect, it } from "vitest";

import { trustProxySchema } from "../../src/config/env";

describe("TRUST_PROXY validation", () => {
  it('accepts "false" and transforms to boolean false', () => {
    const result = trustProxySchema.parse("false");
    expect(result).toBe(false);
  });

  it('rejects "true" (unsafe in production)', () => {
    expect(() => trustProxySchema.parse("true")).toThrow();
  });

  it("accepts numeric string hop counts", () => {
    const result = trustProxySchema.parse("1");
    expect(result).toBe(1);
  });

  it("accepts zero as valid hop count", () => {
    const result = trustProxySchema.parse("0");
    expect(result).toBe(0);
  });

  it("rejects negative numbers", () => {
    expect(() => trustProxySchema.parse("-1")).toThrow();
  });

  it("rejects non-numeric strings", () => {
    expect(() => trustProxySchema.parse("yes")).toThrow();
  });

  it("rejects floating point numbers", () => {
    expect(() => trustProxySchema.parse("1.5")).toThrow();
  });

  it("defaults to false when not provided", () => {
    const result = trustProxySchema.parse(undefined);
    expect(result).toBe(false);
  });
});
