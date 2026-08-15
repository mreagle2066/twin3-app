# Twin3 Growth Agent

Twin3 Growth Agent is a full-stack, AI-assisted operating system for thoughtful X (Twitter) growth and outreach. It combines a public product site with a protected workspace for building campaigns, qualifying leads, drafting conversations, managing reply content, and applying human-controlled operating limits.

> **Operating principle:** drafts, research, and local workspace configuration remain under user control. X-dependent activity requires a connected X account and explicit approval through the product’s guarded workflow.

## What is included

| Area | Included capabilities |
| --- | --- |
| Marketing experience | A premium Twin3 landing page, pricing overview, sign-in entry points, animated SVG brand mark, and browser-tab favicon. |
| Dashboard | Today’s activity metrics and campaign performance calculated from protected workspace data. |
| Outreach Agent | Lead-source workflow, audience filters, campaign creation, AI message variations, scheduling controls, and connected-X guardrails for live activity. |
| Conversation Agent | Knowledge base, intent classification, conversation history, AI-grounded response drafts, and a human escalation queue. |
| Reply & Content Agent | Draft-first reply review, monitored accounts, and original content drafting. No reply is automatically published. |
| Lead Intelligence | Searchable lead records, a **0–100** lead score, interest levels, and opportunity tags: `potential user`, `partner`, `investor`, and `KOL`. |
| Safety & Controls | Per-agent limits, Manual/Semi-autonomous/Autonomous modes, auto-pause threshold, and X account connection status. |
| X authentication | X OAuth 2.0 Authorization Code with PKCE for sign-in and account linking, encrypted token storage, refresh support, local disconnect, and guarded X actions. |

## Technology

| Layer | Technology |
| --- | --- |
| Front end | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, TanStack Query, Lucide, Framer Motion |
| Server | Express 4, tRPC 11, Zod |
| Data | Drizzle ORM with MySQL/TiDB-compatible storage |
| Authentication | Manus OAuth for the core workspace and X OAuth 2.0 with PKCE for X sign-in/account linking |
| AI | Built-in Forge LLM integration for outreach variations and knowledge-grounded conversation drafts |
| Testing | Vitest |

## Repository layout

```text
client/
  src/
    components/        Shared UI, brand mark, dashboard shell, agent panels
    pages/             Landing, sign-in, dashboard, agents, leads, controls
    index.css          Twin3 forest-green / warm-ivory visual system
server/
  routers/             tRPC feature routers
  _core/               Framework services, authentication, and runtime helpers
  xOAuth.ts            X authorization, callback, token refresh, and disconnect flow
  db.ts                Workspace query and persistence helpers
drizzle/
  schema.ts            Database tables and typed models
docs/
  accessibility-audit.md
  x-oauth-setup.md
```

## Local development

### Prerequisites

Install a current **Node.js 22** runtime and **pnpm 10**. You also need a MySQL/TiDB-compatible database and the OAuth credentials described below.

```bash
git clone https://github.com/mreagle2066/twin3-app.git
cd twin3-app
pnpm install
```

Create a local environment file using your deployment provider’s secret-management approach. Do **not** commit credentials.

```dotenv
# Database and session security
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
JWT_SECRET=replace-with-a-long-random-secret

# Manus workspace authentication / built-in services
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=your_manus_oauth_portal_url
BUILT_IN_FORGE_API_URL=your_forge_api_url
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# X OAuth 2.0 application credentials
X_CLIENT_ID=your_x_oauth_client_id
X_CLIENT_SECRET=your_x_oauth_client_secret
```

Generate and apply schema migrations after configuring `DATABASE_URL`:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Then start the development server:

```bash
pnpm dev
```

### Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Starts the Vite/Express development runtime. |
| `pnpm check` | Runs TypeScript type checking without emitting files. |
| `pnpm test` | Runs the Vitest suite. |
| `pnpm build` | Builds the client and server bundles. |
| `pnpm start` | Runs the production Node bundle after `pnpm build`. |
| `pnpm format` | Formats tracked source files with Prettier. |
| `pnpm db:push` | Generates and applies Drizzle migrations. |

## X OAuth configuration

Twin3 uses X OAuth 2.0 **Authorization Code with PKCE**. Create a Web App in the X Developer Portal and configure the following values for the published Twin3 application.

| Setting | Required production value |
| --- | --- |
| App type | Web App |
| OAuth flow | Authorization Code with PKCE |
| Callback URL | `https://twin3growth-6acr9qjf.manus.space/api/x/callback` |
| Website URL | `https://twin3growth-6acr9qjf.manus.space` |
| Requested scopes | `users.read`, `tweet.read`, `tweet.write`, `dm.read`, `dm.write`, `offline.access` |

The callback URL must match exactly. Store `X_CLIENT_ID` and `X_CLIENT_SECRET` in your platform’s secure environment configuration. The application never exposes the client secret in the authorization URL; linked X tokens are encrypted at rest using a key derived from `JWT_SECRET`.

The in-repository guide at [`docs/x-oauth-setup.md`](docs/x-oauth-setup.md) covers troubleshooting and disconnect behavior. For the current X OAuth protocol requirements, consult the official X documentation.[1]

## Product behavior and guardrails

The platform is intentionally designed around reviewable, constrained activity.

| Control | Behavior |
| --- | --- |
| Draft mode | Reply and content drafts start in draft mode; they are not auto-published. |
| X connection gate | Campaigns in `scheduled` or `active` status, as well as X account verification, require a valid linked X account. |
| Knowledge constraints | Conversation drafting reads approved knowledge-base entries and excludes restricted entries. |
| Escalation | Conversations marked for human follow-up are available in the dedicated escalation queue. |
| Account ownership | An X account cannot be linked to more than one Twin3 workspace user. |
| Token lifecycle | The server refreshes access tokens when appropriate and removes local credentials when a user disconnects. |

## Testing and quality checks

Run the complete validation suite before opening a pull request or deploying:

```bash
pnpm check
pnpm test
```

The current test coverage includes authentication logout behavior, agent constants, dashboard aggregation, X action guardrails, OAuth state matching and token encryption, credential endpoint validation, metadata, and the global focus-visible accessibility treatment.

The live X credential probe is intentionally opt-in because it calls an external X endpoint and can be affected by network egress availability. Run it only in an environment where external X API access is expected:

```bash
RUN_X_OAUTH_CREDENTIAL_TEST=true pnpm vitest run server/xOAuthCredentials.test.ts
```

For repeatable CI validation, add `X_CLIENT_ID` and `X_CLIENT_SECRET` as **repository secrets** in GitHub, then run the **X OAuth Integration Check** workflow manually from the repository’s *Actions* tab. The workflow exposes neither secret in logs and runs the same live credential probe in an environment intended for outbound API access.

## Deployment

The project is designed for a Node-compatible deployment environment that provides secure environment variables, a MySQL/TiDB-compatible database, and HTTPS. Deploy only after configuring the secrets listed above and applying database migrations. The X callback URL must remain synchronized with the deployed public origin.

For the managed Twin3 deployment, create a checkpoint after verified changes; its deployment environment provides the app’s managed authentication and Forge service variables.

## Contributing

Use focused branches and keep these checks green before requesting review:

```bash
pnpm check && pnpm test
```

Do not commit `.env` files, OAuth client secrets, X access tokens, or refresh tokens. Use the platform secret manager for all sensitive values.

## License

MIT. See the repository metadata for the current license declaration.

## References

[1]: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code "X OAuth 2.0 Authorization Code Flow with PKCE"
