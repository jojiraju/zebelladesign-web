import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps same-site paths with their query and hash", () => {
    expect(safeNext("/checkout")).toBe("/checkout");
    expect(safeNext("/checkout/success?order=ZB-1#top")).toBe("/checkout/success?order=ZB-1#top");
  });
  it("falls back when there is no usable value", () => {
    expect(safeNext(null)).toBe("/account");
    expect(safeNext("")).toBe("/account");
    expect(safeNext("checkout")).toBe("/account");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "/\\/evil.com", "/\t/evil.com", "/\n/evil.com", "javascript:alert(1)"])(
    "rejects the off-site value %j",
    (value) => expect(safeNext(value)).toBe("/account"),
  );
});
