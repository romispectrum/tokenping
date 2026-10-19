# Hardhat: the paywall contract

`TokenpingPaywall` sells access to Tokenping's alerts for an ERC-20 payment (USDC on Arbitrum One), plus its tests and
deploy scripts. The frontend reads the deployed address and ABI from `packages/nextjs/contracts/deployedContracts.ts`,
which every `yarn deploy` rewrites.

## The contract

`contracts/TokenpingPaywall.sol` is an upgradeable contract (OpenZeppelin `Initializable`, `PausableUpgradeable`,
`OwnableUpgradeable`, `UUPSUpgradeable`, `ReentrancyGuard`) behind `contracts/proxy/TokenpingERC1967Proxy.sol`.

- `pay(token)` takes the token's plan price from the caller with `transferFrom` (so the caller approves the price first)
  and extends the caller's single subscription by the plan's duration. Paying while active adds to the current expiry.
  Fee-on-transfer tokens are rejected.
- `isActive(user)` and `getSubscription(user)` tell whether a wallet has access and until when. The app calls
  `isActive` on every alert write.
- `plans(token)` holds the price, duration and enabled flag per token.
- The owner can set plans (`setPlan`), change the longest allowed plan (`setMaxDurationSeconds`), pause and unpause,
  withdraw tokens and native currency, and upgrade the implementation. Nothing refunds a payment.

`contracts/mock/MockUSDC.sol` is deployed on the local chain only. `contracts/test/ReentrantERC20.sol` is a test helper.

## Commands

Run from the repo root.

| Command                                                   | What it does                                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `yarn chain`                                              | Starts a local Hardhat node on `127.0.0.1:8545`, without deploying anything.                  |
| `yarn deploy --deploy-mode local`                         | Deploys MockUSDC and the paywall to that node (the default network, `localhost`).             |
| `yarn deploy --network arbitrum --deploy-mode production` | Deploys the paywall on Arbitrum One with Circle's USDC.                                       |
| `yarn compile`                                            | Compiles the contracts (Solidity 0.8.30).                                                     |
| `yarn test`                                               | Runs the tests in `test/` on the in-memory Hardhat network, with a gas report.                |
| `yarn hardhat:lint`, `yarn hardhat:format`                | ESLint and Prettier for this package only (`yarn lint` and `yarn format` also cover the app). |
| `yarn verify --network arbitrum`                          | Verifies the deployed contracts with hardhat-deploy's Etherscan verifier.                     |
| `yarn generate`, `yarn account:import`                    | Creates or imports the deployer key, encrypted with a password into `.env`.                   |
| `yarn account`, `yarn account:reveal-pk`                  | Shows the deployer address, or reveals its private key.                                       |

Do not pass `--network hardhat` to `yarn deploy` for a local deploy: that is an in-memory network that disappears when
the command ends, so the frontend would find nothing on the node from `yarn chain`.

## Deploying

`--deploy-mode` is `local` (network `localhost` or `hardhat` only) or `production` (any other network). Without it the
mode follows the network. The runner adds the mode's tag (`TokenpingPaywallLocal` or `TokenpingPaywallProduction`) to
the deploy.

- **Local.** Deploys MockUSDC, mints 10,000 of it to the address in `deploy/00_deploy_tokenping_paywall_local.ts` (change it
  to your wallet to pay locally), deploys the implementation and proxy, and sets a plan of 3 USDC for 30 days.
- **Production.** Supports Ethereum Mainnet (chain id 1) and Arbitrum One (42161), each with its Circle USDC address from
  `deploy/network-config`. On Arbitrum it refuses any other token. It prompts for the password of
  `DEPLOYER_PRIVATE_KEY_ENCRYPTED`, decrypts the key for that run only, and sets a plan of 3 USDC for 30 days with
  a longest plan of 365 days. The deployer becomes the owner.
- **Running it again.** An existing deployment recorded in `deployments/<network>` is kept. The script still compares the
  on-chain plan with its own (3 USDC, 30 days, enabled) and calls `setPlan` when they differ, which would undo a price
  the owner changed.

## Upgrading the implementation

`deploy/01_upgrade_tokenping_paywall_implementation.ts` (tag `TokenpingPaywallUpgrade`) deploys the current contract
code as a new implementation, calls `upgradeToAndCall` from the owner and checks the implementation slot afterwards. It
skips the transaction when the code is unchanged.

```bash
yarn deploy --network arbitrum --deploy-mode production --tags TokenpingPaywallUpgrade
```

Because the runner adds the mode's tag to yours, the production script runs in the same command, so check the plan
first (see "Running it again"). If the owner changed the price, change it back afterwards, or set the new price in
`deploy/00_deploy_tokenping_paywall_production.ts` before upgrading.

## Environment

`packages/hardhat/.env` (template: `.env.example`):

- `ALCHEMY_API_KEY`: your Alchemy key for the networks in `hardhat.config.ts`. Defaults to Scaffold-ETH's shared key.
- `ETHERSCAN_V2_API_KEY`: for `yarn verify`. Defaults to Scaffold-ETH's shared key.
- `DEPLOYER_PRIVATE_KEY_ENCRYPTED`: written by `yarn generate` or `yarn account:import`. Never commit the file.

## Verified deployment

The proxy `0x79872d7529cfE1c062838fACDA004Ce4BFB16553` and its implementation are verified on
[Sourcify](https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553). `deployments/arbitrum` records
both addresses for the deploy scripts.
