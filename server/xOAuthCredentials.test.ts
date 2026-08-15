import { describe, expect, it } from "vitest";
async function fetchTokenEndpointWithRetry(authorization: string, attempts = 3): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      });
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("X token endpoint request failed.");
}

const integrationTest = process.env.RUN_X_OAUTH_CREDENTIAL_TEST === "true" ? it : it.skip;

describe("X OAuth credentials", () => {
  integrationTest("reaches the X token endpoint with confidential-client credentials", async () => {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;
    expect(clientId, "X_CLIENT_ID must be configured").toBeTruthy();
    expect(clientSecret, "X_CLIENT_SECRET must be configured").toBeTruthy();

    const authorization = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetchTokenEndpointWithRetry(authorization);

    expect([401, 403], `X rejected the client credentials: ${await response.text()}`).not.toContain(response.status);
  }, 25_000);
});
