import { describe, expect, it } from "vitest";

describe("X OAuth credentials", () => {
  it("reaches the X token endpoint with confidential-client credentials", async () => {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    expect(clientId, "X_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "X_CLIENT_SECRET must be configured").toBeTruthy();

    const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });

    expect([401, 403], `X rejected the client credentials: ${await response.text()}`).not.toContain(response.status);
  }, 20_000);
});
