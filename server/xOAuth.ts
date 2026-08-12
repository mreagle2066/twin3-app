import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "./db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_REVOKE_URL = "https://api.x.com/2/oauth2/revoke";
const X_ME_URL = "https://api.x.com/2/users/me";
const X_STATE_COOKIE = "twin3_x_oauth";
const X_SCOPES = ["users.read", "tweet.read", "tweet.write", "dm.read", "dm.write", "offline.access"];
const EXTERNAL_APP_ORIGIN = "https://twin3growth-6acr9qjf.manus.space";

export type OAuthState = { state: string; verifier: string; intent: "signin" | "link"; openId?: string };
type XProfile = { id: string; username: string; name?: string };
type XTokenResponse = { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };

function base64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function encodeState(value: OAuthState) {
  return base64Url(JSON.stringify(value));
}

function decodeState(value: string | undefined): OAuthState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthState;
    return parsed.state && parsed.verifier && (parsed.intent === "signin" || parsed.intent === "link") ? parsed : null;
  } catch {
    return null;
  }
}

export function isMatchingXOAuthState(saved: OAuthState | null, returnedState: string | undefined) {
  return Boolean(saved && returnedState && saved.state === returnedState);
}

function codeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function redirectUri() {
  return `${EXTERNAL_APP_ORIGIN}/api/x/callback`;
}

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("Session encryption is not configured.");
  return createHash("sha256").update(ENV.cookieSecret).digest();
}

export function encryptXToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${base64Url(iv)}.${base64Url(cipher.getAuthTag())}.${base64Url(ciphertext)}`;
}

export function decryptXToken(value: string) {
  const [encodedIv, encodedTag, encodedCiphertext] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext) throw new Error("Invalid encrypted X credential.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(encodedIv, "base64url"));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encodedCiphertext, "base64url")), decipher.final()]).toString("utf8");
}

export function buildXAuthorizeUrl(state: string, verifier: string) {
  if (!ENV.xClientId || !ENV.xClientSecret) throw new Error("X OAuth is not configured.");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.xClientId,
    redirect_uri: redirectUri(),
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: codeChallenge(verifier),
    code_challenge_method: "S256",
  });
  return `${X_AUTHORIZE_URL}?${params.toString()}`;
}

async function getLinkedSession(req: Request) {
  const cookie = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
  const session = await sdk.verifySession(cookie);
  if (!session) return null;
  return db.getUserByOpenId(session.openId);
}

async function exchangeCode(code: string, verifier: string) {
  const payload = new URLSearchParams({ code, grant_type: "authorization_code", client_id: ENV.xClientId, redirect_uri: redirectUri(), code_verifier: verifier });
  const credentials = Buffer.from(`${ENV.xClientId}:${ENV.xClientSecret}`).toString("base64");
  const response = await fetch(X_TOKEN_URL, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: payload });
  if (!response.ok) throw new Error("X declined the account authorization. Please reconnect and approve the requested permissions.");
  return response.json() as Promise<XTokenResponse>;
}

async function exchangeRefreshToken(refreshToken: string) {
  const payload = new URLSearchParams({ refresh_token: refreshToken, grant_type: "refresh_token", client_id: ENV.xClientId });
  const credentials = Buffer.from(`${ENV.xClientId}:${ENV.xClientSecret}`).toString("base64");
  const response = await fetch(X_TOKEN_URL, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: payload });
  if (!response.ok) throw new Error("Your X connection has expired. Please reconnect the account in Safety & Controls.");
  return response.json() as Promise<XTokenResponse>;
}

async function getXProfile(accessToken: string) {
  const response = await fetch(X_ME_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error("X did not return an account profile.");
  const body = await response.json() as { data?: XProfile };
  if (!body.data?.id || !body.data.username) throw new Error("X did not return a complete account profile.");
  return body.data;
}

export async function getActiveXAccessToken(userId: number) {
  const account = await db.getXAccount(userId);
  requireXConnection(account);
  const shouldRefresh = Boolean(account.tokenExpiresAt && account.tokenExpiresAt.getTime() - Date.now() < 60_000);
  if (!shouldRefresh) return decryptXToken(account.accessTokenCiphertext);
  if (!account.refreshTokenCiphertext) throw new Error("Your X connection has expired. Please reconnect the account in Safety & Controls.");
  const refreshToken = decryptXToken(account.refreshTokenCiphertext);
  const refreshed = await exchangeRefreshToken(refreshToken);
  await db.saveXAccount(userId, {
    xUserId: account.xUserId,
    username: account.username,
    displayName: account.displayName,
    accessTokenCiphertext: encryptXToken(refreshed.access_token),
    refreshTokenCiphertext: encryptXToken(refreshed.refresh_token ?? refreshToken),
    scopes: refreshed.scope ?? account.scopes,
    tokenExpiresAt: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : account.tokenExpiresAt,
  });
  return refreshed.access_token;
}

export function requireXConnection<T>(account: T | null): T {
  if (!account) throw new Error("Connect an X account before using X agent actions.");
  return account;
}

export async function disconnectXAccount(userId: number) {
  const account = await db.getXAccount(userId);
  if (!account) return { success: true as const };
  try {
    const token = account.refreshTokenCiphertext ? decryptXToken(account.refreshTokenCiphertext) : decryptXToken(account.accessTokenCiphertext);
    const credentials = Buffer.from(`${ENV.xClientId}:${ENV.xClientSecret}`).toString("base64");
    await fetch(X_REVOKE_URL, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token, client_id: ENV.xClientId }) });
  } catch (error) {
    console.warn("[X OAuth] Remote token revocation was not confirmed; removing local X credentials.", error);
  }
  return db.deleteXAccount(userId);
}

export function registerXOAuthRoutes(app: Express) {
  app.get("/api/x/authorize", async (req: Request, res: Response) => {
    const intent = req.query.intent === "link" ? "link" : "signin";
    try {
      const linkedUser = intent === "link" ? await getLinkedSession(req) : null;
      if (intent === "link" && !linkedUser) return res.redirect(302, "/signin?x=sign-in-required");
      const state = randomBytes(24).toString("base64url");
      const verifier = randomBytes(48).toString("base64url");
      const signedState: OAuthState = { state, verifier, intent, openId: linkedUser?.openId };
      res.cookie(X_STATE_COOKIE, encodeState(signedState), { httpOnly: true, secure: true, sameSite: "lax", maxAge: 10 * 60 * 1000, path: "/" });
      return res.redirect(302, buildXAuthorizeUrl(state, verifier));
    } catch (error) {
      console.error("[X OAuth] Authorization start failed", error);
      return res.redirect(302, "/signin?x=configuration-error");
    }
  });

  app.get("/api/x/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const returnedState = typeof req.query.state === "string" ? req.query.state : undefined;
    const saved = decodeState(parseCookieHeader(req.headers.cookie ?? "")[X_STATE_COOKIE]);
    res.clearCookie(X_STATE_COOKIE, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    if (!code || !saved || !isMatchingXOAuthState(saved, returnedState)) return res.redirect(302, "/signin?x=invalid-state");
    try {
      const token = await exchangeCode(code, saved.verifier);
      const profile = await getXProfile(token.access_token);
      const existingAccount = await db.getXAccountByXUserId(profile.id);
      let user = saved.intent === "link" && saved.openId ? await db.getUserByOpenId(saved.openId) : undefined;
      if (existingAccount && saved.intent === "link" && existingAccount.userId !== user?.id) throw new Error("This X account is already linked to another Twin3 workspace.");
      if (existingAccount && !user) user = await db.getUserById(existingAccount.userId);
      if (!user) {
        const openId = `x:${profile.id}`;
        await db.upsertUser({ openId, name: profile.name ?? profile.username, loginMethod: "x", lastSignedIn: new Date() });
        user = await db.getUserByOpenId(openId);
      }
      if (!user) throw new Error("Unable to create the X user session.");
      await db.saveXAccount(user.id, {
        xUserId: profile.id,
        username: profile.username,
        displayName: profile.name ?? null,
        accessTokenCiphertext: encryptXToken(token.access_token),
        refreshTokenCiphertext: token.refresh_token ? encryptXToken(token.refresh_token) : null,
        scopes: token.scope ?? X_SCOPES.join(" "),
        tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? profile.username, expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      return res.redirect(302, "/app/safety?x=connected");
    } catch (error) {
      console.error("[X OAuth] Callback failed", error);
      return res.redirect(302, "/signin?x=authorization-failed");
    }
  });
}
