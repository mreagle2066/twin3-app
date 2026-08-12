import { describe, expect, it } from "vitest";
import { buildXAuthorizeUrl, decryptXToken, encryptXToken, isMatchingXOAuthState, requireXConnection } from "./xOAuth";

describe("X account token protection", () => {
  it("encrypts refreshable X credentials before persistence", () => {
    const plaintext = "oauth-access-token";
    const encrypted = encryptXToken(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptXToken(encrypted)).toBe(plaintext);
  });

  it("constructs a PKCE authorization request without exposing the client secret", () => {
    const url = buildXAuthorizeUrl("csrf-state", "private-verifier");
    expect(url).toContain("response_type=code");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain("state=csrf-state");
    expect(url).not.toContain(process.env.X_CLIENT_SECRET ?? "");
  });

  it("rejects a callback whose CSRF state does not match the account-linking request", () => {
    const saved = { state: "expected", verifier: "verifier", intent: "link" as const, openId: "workspace-user" };
    expect(isMatchingXOAuthState(saved, "expected")).toBe(true);
    expect(isMatchingXOAuthState(saved, "attacker-state")).toBe(false);
  });

  it("blocks agent access when no X account is connected", () => {
    expect(() => requireXConnection(null)).toThrow("Connect an X account");
  });
});
