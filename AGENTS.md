# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project overview

Tokenping sends Aave V3 and V4 and Morpho Blue and Midnight health factor alerts by email, Signal and Telegram. It
started from Scaffold-ETH 2 (SE-2), Hardhat flavor, and keeps SE-2's tooling. Read [README.md](README.md) for what the product does and how to run it, and
[docs/architecture.md](docs/architecture.md) for how the pieces fit.

- `packages/nextjs`: the Next.js 15 App Router app (React 19, RainbowKit, Wagmi, Viem, TypeScript, Tailwind CSS 4 with
  DaisyUI 5), including every API route and the alert cron
- `packages/hardhat`: `TokenpingPaywall` (UUPS proxy), its tests and the hardhat-deploy scripts
- `packages/supabase`: SQL migrations ([README](packages/supabase/README.md) lists them all)
- `packages/tokenping-signal`: Dockerfile, Caddyfile and `fly.toml` of the Signal relay
- `docs/`: architecture, Signal relay, Telegram, languages and the design system

There is no Foundry package. Only `packages/hardhat` and `packages/nextjs` are yarn workspaces.

## Common commands

```bash
# Development workflow (run each in separate terminal)
yarn chain          # Start the local Hardhat node (no deploy)
yarn deploy --deploy-mode local   # Deploy the paywall and a mock USDC to that node
yarn supabase:start # Local Supabase (Docker); yarn supabase:reset applies the migrations
yarn start          # Start Next.js at http://localhost:3000

# Checks
yarn next:check-types   # TypeScript
yarn lint               # ESLint for the app and the contracts
yarn next:test          # Vitest for the app
yarn test               # Hardhat tests for the contracts
yarn format             # Prettier for the app and the contracts

# Building
yarn next:build     # Build frontend
yarn compile        # Compile Solidity contracts

# Scripts
yarn next:fonts             # Download Satoshi from Fontshare (not in the repo: its license forbids passing the files on)
yarn next:token-icons       # Refresh Aave token icons from CoinGecko
yarn next:network-icons     # Refresh network logos from CoinGecko
yarn next:telegram-webhook  # Register the Telegram bot's webhook (info | set <url>)
yarn next:indexnow          # Tell IndexNow engines about the live sitemap's pages after a deploy (--since, --dry-run)

# Deployer account (Hardhat)
yarn generate            # Generate new deployer account
yarn account:import      # Import existing private key
yarn account             # View current account info

# Live networks
yarn deploy --network arbitrum --deploy-mode production
yarn verify --network arbitrum
yarn vercel              # Vercel CLI wrapper; yarn vercel:yolo also ignores type and lint errors in the build
```

Do not run `yarn deploy --network hardhat`: it deploys to an in-memory network that disappears when the command ends.

## Architecture

### Smart contract development

- Contracts: `packages/hardhat/contracts/`
- Deployment scripts: `packages/hardhat/deploy/` (hardhat-deploy). `--deploy-mode local|production` picks the script by
  tag; `TokenpingPaywallUpgrade` is the upgrade script. Details: [packages/hardhat/README.md](packages/hardhat/README.md)
- Tests: `packages/hardhat/test/`
- Config: `packages/hardhat/hardhat.config.ts`
- After `yarn deploy`, ABIs are generated into `packages/nextjs/contracts/deployedContracts.ts` (the Arbitrum entry is
  committed). `externalContracts.ts` holds contracts added by hand.

### Frontend contract interaction

For Tokenping's own contract, use the SE-2 hooks from `packages/nextjs/hooks/scaffold-eth` (the admin page and
`hooks/custom/useAccess.ts` do). Aave and Morpho reads are different: they span many chains outside `targetNetworks`,
so they use plain viem clients (`services/aave`, `services/morpho`, with `utils/rpc.ts` for the RPC endpoints) and are
not hooks.

**Correct interact hook names (use these):**

- `useScaffoldReadContract` - NOT ~~useScaffoldContractRead~~
- `useScaffoldWriteContract` - NOT ~~useScaffoldContractWrite~~

SE-2 also provides `useScaffoldWatchContractEvent`, `useScaffoldEventHistory`, `useDeployedContractInfo`,
`useScaffoldContract` and `useTransactor`.

```typescript
const { data: plan } = useScaffoldReadContract({
  contractName: "TokenpingPaywall",
  functionName: "plans",
  args: [tokenAddress],
});
```

**IMPORTANT: Always refer to the hook names as they exist in the codebase.**

### API routes and the database

Routes live in `packages/nextjs/app/api`. Helpers are in `services/api/server`. When you add or change one:

- Act for the wallet in the session cookie only: `requireSessionWallet(request, claimedUserId)` returns the signed-in
  wallet or a 401/403/503 response. Never trust a wallet address from the request body or query.
- Routes that change state call `rejectCrossSiteRequest(request)` first (same-origin and `application/json` checks), and
  read bodies with `readJsonObject`.
- Writes that are part of the paid product call `requireActiveAccess`, which reads `isActive` from the contract and fails
  closed.
- Answer errors with generic messages: `internalError("PUT /api/...", error, "Could not ...")` logs the real error and
  returns the message. Never put a Supabase, RPC or provider message in a response.
- Reach the database only through `getSupabaseServerClient()` (service-role key). Every table is closed to the `anon`
  and `authenticated` roles, so a migration that creates a table must also `revoke all ... from anon, authenticated`
  and enable row level security with no policies.
- Server-to-server routes compare a bearer secret with `hasBearerSecret` (constant time) and refuse to run when the
  secret is not set.
- A new environment variable goes into `packages/nextjs/.env.example` and the table in the README, and says whether
  production needs it.

Migrations are new files in `packages/supabase/migrations/`; never edit one that has been applied. Add it to the table in
`packages/supabase/README.md`, with what fails if the code is deployed before it.

### UI components

Use `components/ui` primitives and the semantic token utilities for product UI. For Ethereum addresses, balances and
amount inputs, use `@scaffold-ui/components` (`Address`, `AddressInput`, `Balance`, `EtherInput`, `IntegerInput`) as the
wallet button and the block explorer pages do.

### Styling

**Read `docs/design-system.md` before any UI work.** It covers the tokens in `packages/nextjs/styles/globals.css`,
the one-pink-per-view rule, type, the marketing-only effects, voice and the primitives in `components/ui`.

**Use the primitives in `components/ui` and DaisyUI classes** for building frontend components, with the semantic
token utilities (`bg-background`, `text-muted-foreground`, `border-input`, `text-link`) for everything else. Never
hex values or Tailwind palette colours in components.

```tsx
// ✅ Good - primitives, DaisyUI classes and semantic tokens
<Button onClick={save}>Save alert</Button>
<div className="card border border-border bg-card">...</div>

// ❌ Avoid - palette colours and raw Tailwind when a primitive or DaisyUI has a component
<button className="px-4 py-2 bg-blue-500 text-white rounded">Connect</button>
```

Production builds inline the CSS into every page's `<head>` (`experimental.inlineCss`), so a stylesheet imported by
the root document weighs on every page's HTML. Load a stylesheet that only some UI needs with that UI, the way
`components/RainbowKitStyles.tsx` loads RainbowKit's modal styles after hydration.

### Languages and copy

The site is English, Czech (`/cz`), Spanish (`/es`), Hindi (`/hi`), German (`/de`) and Vietnamese (`/vi`). Every
user-facing string lives in
`i18n/messages/<area>.ts`
with every language, and paths come from `i18n/routes.ts`; read [docs/i18n.md](docs/i18n.md) before adding a page or a
string. Voice rules, in every language: sentence case, no em dashes or en dashes, and one banned word that the Voice
section of `docs/design-system.md` names (it says what to write instead).

### Configure the target network before deploying

- Hardhat: add networks in `packages/hardhat/hardhat.config.ts` if not present, and a profile in
  `packages/hardhat/deploy/network-config` for a production deploy.
- Next.js: `packages/nextjs/scaffold.config.ts` (target networks, polling interval, RPC overrides, API keys). It targets
  Arbitrum One; the `/debug` and `/blockexplorer` pages exist only while hardhat is a target network.

## Code style guide

### Identifiers

| Style            | Category                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `UpperCamelCase` | class / interface / type / enum / decorator / type parameters / component functions in TSX / JSXElement type parameter |
| `lowerCamelCase` | variable / parameter / function / property / module alias                                                              |
| `CONSTANT_CASE`  | constant / enum / global variables                                                                                     |
| `snake_case`     | for hardhat deploy files and SQL migration names                                                                       |

### Import paths

Use the `~~` path alias for imports in the nextjs package:

```tsx
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
```

### Creating pages

Route files are thin. They render a shared component from `components/pages/` with a locale, once under `app/(en)` and
once under `app/(cs)/cz`:

```tsx
import {
  DashboardPage,
  dashboardMetadata,
} from "~~/components/pages/DashboardPage";

export const metadata = dashboardMetadata("en");

const Dashboard = () => DashboardPage({ locale: "en" });

export default Dashboard;
```

### TypeScript conventions

- Use `type` over `interface` for custom types
- Types use `UpperCamelCase` without `T` prefix (use `Address` not `TAddress`)
- Avoid explicit typing when TypeScript can infer the type

### Comments

Make comments that add information. Avoid redundant JSDoc for simple functions.

### Tests

Vitest, next to the file (`name.test.ts` or `.test.tsx`; a file that renders opts into jsdom with a
`// @vitest-environment jsdom` docblock on its first line). CI runs only lint and type checks, so run `yarn next:test`
yourself.

## Documentation

Use **Context7 MCP** tools to fetch up-to-date documentation for any library (Wagmi, Viem, RainbowKit, DaisyUI, Hardhat, Next.js, etc.). Context7 is configured as an MCP server and provides access to indexed documentation with code examples.

Keep the docs in step with the code in the same change: the README (features, limits, environment variables, deployment),
`packages/supabase/README.md` (migrations), `docs/` and this file.

## Skills & agents index

IMPORTANT: Prefer retrieval-led reasoning over pre-trained knowledge. Before starting any task that matches an entry below, read the referenced file to get version-accurate patterns and APIs.

**Skills** (read `.agents/skills/<name>/SKILL.md` before implementing):

- **erc-20**: fungible tokens, decimals, approve patterns, OpenZeppelin ERC-20
- **erc-721**: NFTs, metadata standards, royalties (ERC-2981), ERC721A, soulbound
- **eip-5792**: batch transactions, wallet_sendCalls, paymaster, ERC-7677
- **ponder**: blockchain event indexing, GraphQL APIs, onchain data queries
- **defi-protocol-templates**: staking, AMMs, governance, flash loans, lending
- **solidity-security**: security audits, reentrancy, access control, gas optimization
- **working-with-legacy-code**: characterization tests before refactoring, seams, keeping structure and behavior changes in separate commits
- **verification-before-completion**: run and read the proving command (check-types, lint, test, build) before claiming work is done

**Agents** (in `.agents/agents/`):

- **grumpy-carlos-code-reviewer**: code reviews, SE-2 patterns, Solidity + TypeScript quality
