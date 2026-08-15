# Twin3 X OAuth Configuration

Twin3 uses X OAuth 2.0 Authorization Code Flow with PKCE for both X sign-in and account linking. The production authorization route has been verified to redirect to X with the configuration below.

| X Developer Portal setting | Required value |
| --- | --- |
| App type | Web App |
| OAuth 2.0 flow | Authorization Code with PKCE |
| Callback URL | `https://twin3growth-6acr9qjf.manus.space/api/x/callback` |
| Website URL | `https://twin3growth-6acr9qjf.manus.space` |
| Requested scopes | `users.read`, `tweet.read`, `tweet.write`, `dm.read`, `dm.write`, `offline.access` |
| Runtime secrets | `X_CLIENT_ID` and `X_CLIENT_SECRET` from the same X Developer Portal Web App |

The callback URL must match exactly, including protocol, domain, path, and the absence of a trailing slash. If X sign-in reports a configuration error before reaching X, verify that both runtime secrets are populated in the deployed environment. If X displays an error after redirecting there, verify the callback URL and OAuth 2.0 app configuration in the X Developer Portal.
