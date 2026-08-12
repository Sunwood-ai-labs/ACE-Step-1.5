import { describe, expect, it } from "vitest";
import { parseLocale } from "./locale";
import { getShellCopy } from "./shellCopy";

describe("Forge display languages", () => {
  it("accepts Japanese and falls back to English for unknown stored values", () => {
    expect(parseLocale("ja")).toBe("ja");
    expect(parseLocale("fr")).toBe("en");
  });

  it("keeps both navigation labels available", () => {
    expect(getShellCopy("en").navigation.create.label).toBe("Create");
    expect(getShellCopy("ja").navigation.create.label).toBe("作成");
  });
});
