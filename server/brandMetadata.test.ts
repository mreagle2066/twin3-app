import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Twin3 brand metadata", () => {
  it("uses the supplied logo for browser-tab and app-icon metadata", () => {
    const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

    expect(html).toContain('rel="icon" type="image/svg+xml" href="/manus-storage/twin3-logo_0f803bad.svg"');
    expect(html).toContain('rel="apple-touch-icon" href="/manus-storage/twin3-logo_0f803bad.svg"');
    expect(html).toContain('name="theme-color" content="#08170f"');
  });

  it("keeps logo motion slow and respects reduced-motion preferences", () => {
    const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

    expect(css).toContain(".brand-logo-orbit { animation: twin3-orbit 16s linear infinite;");
    expect(css).toContain("@media (prefers-reduced-motion: reduce) { .brand-logo-orbit { animation: none; } }");
  });
});
