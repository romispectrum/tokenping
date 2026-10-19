# Contributing to Tokenping

Tokenping sends Aave health factor alerts by email, Signal and Telegram. It started from Scaffold-ETH 2 and keeps its
tooling, but this guide is Tokenping's own.

## Get oriented

- [README.md](README.md): what the product does, its limits, how to run it and how to deploy it.
- [docs/architecture.md](docs/architecture.md): how the browser, the Next.js routes, Supabase, the cron, Resend, the
  Signal relay, Telegram and the paywall contract fit together.
- [AGENTS.md](AGENTS.md): code conventions (hooks, API routes, database access, styling, TypeScript). It is written for
  coding agents, and people can follow it as well.
- [docs/design-system.md](docs/design-system.md) before any UI work, and [docs/i18n.md](docs/i18n.md) before adding a
  page or a string.

## Ways to help

- Report a bug or a wrong number: say what you did, what you expected and what happened, with the network, market and
  wallet type (never a private key or seed phrase).
- Suggest a feature or discuss a change before starting something large, so the work fits the product's limits.
- Improve the documentation: when you change behavior, change the docs in the same pull request.

## Making a change

1. Set up locally as described in the README ("Local development").
2. Keep a pull request to one purpose. Mixing a fix with a restyle makes both harder to review.
3. Run the checks that apply:
   ```bash
   yarn next:check-types   # TypeScript
   yarn lint               # ESLint for the app and the contracts
   yarn next:test          # Vitest for the app
   yarn test               # Hardhat tests, if you changed a contract
   yarn format             # Prettier
   ```
   CI runs only the lint and type checks, so the tests are yours to run.
4. Write user-facing text in English and Czech, in the voice described in the design system (sentence case, plain words,
   no em dashes or en dashes).
5. A database change is a new file in `packages/supabase/migrations/`, never an edit of an applied one. List it in
   `packages/supabase/README.md`.
6. A new environment variable goes into `packages/nextjs/.env.example` and the table in the README.
7. Commit messages follow the history: a type, an optional scope and a short summary, for example
   `fix(cron): refuse cron runs without CRON_SECRET` or `docs: update the Signal relay guide`.
8. Describe what changed and why in the pull request, with a screenshot for UI changes.

## Secrets

Never commit `.env` files, API keys, bot tokens, session secrets or private keys. The templates
(`packages/nextjs/.env.example`, `packages/hardhat/.env.example`) hold no secrets.
