import { describe, it, expect } from "vitest";
import { nanoToTon, shortenAddress } from "./ton";

describe("nanoToTon", () => {
  it("converts whole TON without fraction", () => {
    expect(nanoToTon(5_000_000_000n)).toBe("5");
  });

  it("converts fractional TON and trims trailing zeros", () => {
    expect(nanoToTon("1234567890")).toBe("1.23456789");
  });

  it("handles 0", () => {
    expect(nanoToTon(0)).toBe("0");
  });

  it("accepts bigint input", () => {
    expect(nanoToTon(1000000000n)).toBe("1");
  });
});

describe("shortenAddress", () => {
  it("shortens long addresses", () => {
    expect(shortenAddress("EQAbcdefghijklmnopqrstuvwxyz123456", 4, 4)).toBe(
      "EQAb…3456",
    );
  });

  it("handles empty string", () => {
    expect(shortenAddress("EQAbcdefghijklmnopqrstuvwxyz123456", 4, 4)).toBe(
      "EQAb…3456",
    );
  });

  it("returns short addresses unchanged", () => {
    const short = "EQ123";
    expect(shortenAddress(short)).toBe(short);
  });

  it("returns empty string for empty input", () => {
    expect(shortenAddress("")).toBe("");
  });
});
