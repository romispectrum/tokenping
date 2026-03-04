# TokenpingPayments.sol — Security Fix Strategy

This document outlines a step-by-step strategy to address all issues from the security audit and make the smart contract production-ready.

---

## Overview

| Priority | Issue | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Use ReentrancyGuardUpgradeable | Low | Correct proxy storage layout |
| 2 | Restrict withdrawTokens to known tokens | Low | Safety and clarity |
| 3 | Document single subscription per user | Low | Correct expectations |
| 4 | Document expiryTimestamp as approximate | Low | No wrong assumptions |
| 5 | Add max durationBlocks (optional) | Low | Guardrails |
| 6 | Document centralization (optional) | Low | Transparency |

---

## 1. Switch to ReentrancyGuardUpgradeable

**Goal:** Align reentrancy guard with upgradeable proxy pattern and avoid storage layout issues.

**Steps:**

1. **Change import**
   - Replace: `import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";`
   - With: `import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";`

2. **Change inheritance**
   - In the contract declaration, replace `ReentrancyGuard` with `ReentrancyGuardUpgradeable`.

3. **Call initializer in `initialize`**
   - In `initialize(address initialOwner)`, after `__Pausable_init();`, add:
   - `__ReentrancyGuard_init();`

4. **Verify**
   - Run `yarn compile` and fix any import path if your OZ version uses a different path (e.g. `.../utils/ReentrancyGuardUpgradeable.sol`).
   - Run existing tests to ensure behavior is unchanged.
   - If you use OpenZeppelin Upgrades plugin, run the storage layout check (e.g. `npx hardhat upgrades:validate-upgradeable`) if applicable.

5. **Existing proxy deployments**
   - If the contract is **already deployed as a UUPS proxy**, you cannot re-run `initialize()`, so `__ReentrancyGuard_init()` will not run again on that proxy (the guard’s storage typically defaults to “not entered,” so behavior is usually fine). The critical step is **storage layout**: switching from non-upgradeable `ReentrancyGuard` to `ReentrancyGuardUpgradeable` can change slot positions. Before upgrading, run storage layout validation and confirm the new implementation’s layout is compatible with the proxy’s existing storage.

**Files to touch:** `packages/hardhat/contracts/TokenpingPayments.sol`

---

## 2. Restrict withdrawTokens to Known Tokens

**Goal:** Owner can only withdraw tokens that have a plan configured, reducing mistakes and clarifying economics.

**Steps:**

1. **Add a require in `withdrawTokens`**
   - After `require(to != address(0), "Invalid recipient");`
   - Add: `require(plans[token].price > 0, "Unknown token");`
   - This ensures the token was ever set as a plan (price > 0). Disabled plans still have price > 0, so they remain withdrawable.

2. **Optional: enforce balance**
   - If you want to avoid reverts from insufficient balance, add:
   - `require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");`
   - This is optional; `safeTransfer` already reverts on failure.

3. **Optional: allow withdrawing only “surplus”**
   - If the product should protect user-paid funds until expiry, you could add a view function that computes “available to withdraw” (e.g. balance minus some reserve). Then in `withdrawTokens`, require `amount <= availableToWithdraw(token)`. Implement only if your economic model requires it.

4. **Verify**
   - Add or extend a test: set a plan for token A, withdraw token A (success), try to withdraw token B with no plan (revert with "Unknown token").

**Files to touch:** `packages/hardhat/contracts/TokenpingPayments.sol`, optionally `packages/hardhat/test/` for new tests.

---

## 3. Document Single Subscription Per User

**Goal:** Make it explicit that there is one subscription per user, regardless of which token they pay with.

**Steps:**

1. **NatSpec on state**
   - Above `mapping(address => uint256) public expiryBlock;` add:
   - `/// @dev One subscription per user; paying with any supported token updates the same expiry.`

2. **NatSpec on `pay`**
   - In the function NatSpec, add a line:
   - `@notice Extends or starts the caller's single subscription; payment in the given token.`

3. **README or docs (if you have them)**
   - Add a short section: “Subscription model: one active subscription per user. Paying with token A or B both extend the same expiry; the last payment’s plan (duration) applies from the current block.”

**Files to touch:** `packages/hardhat/contracts/TokenpingPayments.sol`, and any `README` or docs in the repo.

---

## 4. Document expiryTimestamp as Approximate

**Goal:** Prevent anyone from relying on `expiryTimestamp` for exact time-based logic; block is source of truth.

**Steps:**

1. **Constant**
   - Above `AVERAGE_BLOCK_TIME`, add or adjust:
   - `/// @dev Used only to estimate expiry time; actual access control uses expiryBlock.`

2. **State**
   - Above `mapping(address => uint256) public expiryTimestamp;` add:
   - `/// @dev Approximate expiry time (seconds); for display only. Source of truth for active is expiryBlock.`

3. **getSubscription**
   - In the view’s NatSpec, mention that `_expiryTimestamp` is an estimate and that `active` is derived from `_expiryBlock`.

**Files to touch:** `packages/hardhat/contracts/TokenpingPayments.sol`

---

## 5. Add Maximum durationBlocks (Optional)

**Goal:** Avoid extreme durations and make overflow scenarios impossible in practice.

**Steps:**

1. **Add constant**
   - Use ~1 year at 12s blocks: `uint256 public constant MAX_DURATION_BLOCKS = 365 * 24 * 60 * 60 / 12;` (≈ 2_628_000), or a round number like `2_700_000`. Do **not** use `52 * 365 * ...` — that would cap at ~52 years, not 1 year.

2. **Validate in setPlan**
   - Add: `require(durationBlocks <= MAX_DURATION_BLOCKS, "Duration too long");`

3. **Tests**
   - Test that setting a plan with `durationBlocks > MAX_DURATION_BLOCKS` reverts.

**Files to touch:** `packages/hardhat/contracts/TokenpingPayments.sol`, tests.

---

## 6. Document Centralization (Optional)

**Goal:** Transparency about owner and upgrade trust.

**Steps:**

1. **Contract-level NatSpec**
   - At the top of the contract, add a short notice:
   - `@notice Subscription payments in ERC20. Owner can set plans, pause, withdraw received tokens, and upgrade the implementation. Users trust the owner and upgrade process.`

2. **README**
   - If you have a project README, add a “Trust model” or “Security” subsection describing owner powers and upgradeability.

**Files to touch:** `packages/hardhat/contracts/TokenpingPayments.sol`, README if present.

---

## Implementation Order

1. **Phase 1 — Code and safety (do first)**
   - [ ] 1. ReentrancyGuardUpgradeable (Section 1)
   - [ ] 2. withdrawTokens restriction (Section 2)
   - [ ] 3. Compile and run full test suite

2. **Phase 2 — Documentation**
   - [ ] 4. Single subscription per user (Section 3)
   - [ ] 5. expiryTimestamp approximate (Section 4)
   - [ ] 6. Centralization (Section 6)

3. **Phase 3 — Optional hardening**
   - [ ] 7. MAX_DURATION_BLOCKS (Section 5) if you want the cap
   - [ ] 8. Any extra tests for new requires and docs

---

## Verification Checklist Before Release

- [ ] `yarn compile` succeeds.
- [ ] All existing tests pass.
- [ ] New/updated tests for: ReentrancyGuard init, withdrawTokens with unknown token (revert), and optionally max duration revert.
- [ ] Storage layout validated for upgrades: if the contract is already deployed as a proxy, run layout validation (e.g. `npx hardhat upgrades:validate-upgradeable` or equivalent) and confirm the new implementation’s storage layout is compatible with the existing proxy.
- [ ] NatSpec and README updated so subscription and timestamp semantics are clear.
- [ ] No new linter/format issues (`yarn lint`, `yarn format`).

---

## Summary

Fixing the two main code issues (ReentrancyGuardUpgradeable + withdrawTokens restriction) and adding the documentation items will make the contract correct, predictable, and auditable. The optional steps (max duration, centralization docs) further harden and clarify the design. Follow the implementation order and verification checklist to roll the changes out safely.
