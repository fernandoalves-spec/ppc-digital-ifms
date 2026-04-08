import { describe, expect, it } from "vitest";
import { getPageMeta } from "./pageMeta";

describe("pageMeta contract", () => {
  it("returns dashboard metadata for root", () => {
    const meta = getPageMeta("/");
    expect(meta.title).toBe("Dashboard institucional");
    expect(meta.badge).toBe("Painel");
  });

  it("returns reports metadata for reports route", () => {
    const meta = getPageMeta("/reports");
    expect(meta.title).toBe("Relatorios");
    expect(meta.badge).toBe("Analises");
    expect(meta.emptyStateTitle.length).toBeGreaterThan(5);
  });

  it("falls back when route is unknown", () => {
    const meta = getPageMeta("/unknown/path");
    expect(meta.title).toBe("Dashboard institucional");
  });
});

