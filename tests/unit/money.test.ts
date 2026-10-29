import { describe, expect, it } from "vitest";
import { eth, wei } from "../../src/domain/money";
describe("ETH exact decimal arithmetic", () => {
  it("preserves all 18 decimals without floating point rounding", () => {
    expect(eth(wei("0.1") + wei("0.2"))).toBe("0.3");
    expect(eth(wei("123456789.123456789123456789"))).toBe(
      "123456789.123456789123456789",
    );
  });
  it("rejects exponent notation, negative amounts and excess precision", () => {
    for (const value of ["1e3", "-1", "0.1234567890123456789", "NaN"])
      expect(() => wei(value)).toThrow();
  });
  it("computes quantity and network fee exactly", () => {
    expect(eth(wei("1.19") * 3n + wei("0.016"))).toBe("3.586");
  });
});
