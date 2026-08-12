import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Twin3 brand accessibility", () => {
  it("defines an explicit warm-ivory focus-visible treatment for interactive controls", () => {
    const css = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 2px solid oklch(0.9 0.035 95)");
    expect(css).toContain("outline-offset: 3px");
    expect(css).toContain("Shared accessibility treatment");
  });
});
