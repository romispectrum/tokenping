import { expect } from "chai";
import { ethers } from "hardhat";
import type { TokenpingPaywall, MockUSDC, ReentrantERC20 } from "../typechain-types";

async function getTokenpingPaywallFixture() {
  const [owner, user, other] = await ethers.getSigners();

  const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
  const implementation = await TokenpingPaywallFactory.deploy();
  await implementation.waitForDeployment();

  const initData = TokenpingPaywallFactory.interface.encodeFunctionData("initialize", [
    owner.address,
    31_536_000, // maxDurationSeconds (365 days)
  ]);
  const ERC1967Proxy = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
  );
  const proxy = await ERC1967Proxy.deploy(await implementation.getAddress(), initData);
  await proxy.waitForDeployment();

  const paywall = TokenpingPaywallFactory.attach(await proxy.getAddress()) as unknown as TokenpingPaywall;

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = (await MockUSDC.deploy()) as unknown as MockUSDC;
  await mockUsdc.waitForDeployment();

  const price = ethers.parseUnits("3", 6);
  const durationSeconds = 2_592_000n; // 30 days
  await paywall.connect(owner).setPlan(await mockUsdc.getAddress(), price, durationSeconds, true);

  const mintAmount = ethers.parseUnits("10000", 6);
  await mockUsdc.mint(user.address, mintAmount);
  await mockUsdc.mint(owner.address, mintAmount);

  return { paywall, mockUsdc, owner, user, other, price, durationSeconds };
}

describe("TokenpingPaywall", function () {
  let fixture: Awaited<ReturnType<typeof getTokenpingPaywallFixture>>;

  beforeEach(async function () {
    fixture = await getTokenpingPaywallFixture();
  });

  describe("Deployment and initialization", function () {
    it("Should set owner and be unpaused", async function () {
      const { paywall, owner } = fixture;
      void expect(await paywall.owner()).to.equal(owner.address);
      void expect(await paywall.paused()).to.be.false;
    });

    it("Should expose configurable maxDurationSeconds", async function () {
      const { paywall } = fixture;
      void expect(await paywall.maxDurationSeconds()).to.equal(31_536_000n);
    });

    it("Should revert proxy deployment initialization with zero owner", async function () {
      const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
      const implementation = await TokenpingPaywallFactory.deploy();
      await implementation.waitForDeployment();

      const initData = TokenpingPaywallFactory.interface.encodeFunctionData("initialize", [
        ethers.ZeroAddress,
        31_536_000,
      ]);

      const ERC1967Proxy = await ethers.getContractFactory(
        "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      );

      await expect(ERC1967Proxy.deploy(await implementation.getAddress(), initData)).to.be.revertedWithCustomError(
        implementation,
        "OwnableInvalidOwner",
      );
    });
  });

  describe("setMaxDurationSeconds (admin)", function () {
    it("Should update maxDurationSeconds and emit event", async function () {
      const { paywall, owner } = fixture;
      const newMax = 1_000_000n;
      await expect(paywall.connect(owner).setMaxDurationSeconds(newMax))
        .to.emit(paywall, "MaxDurationSecondsUpdated")
        .withArgs(31_536_000n, newMax);
      void expect(await paywall.maxDurationSeconds()).to.equal(newMax);
    });

    it("Should revert setMaxDurationSeconds when called by non-owner", async function () {
      const { paywall, user } = fixture;
      await expect(paywall.connect(user).setMaxDurationSeconds(15)).to.be.revertedWithCustomError(
        paywall,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert setMaxDurationSeconds for zero", async function () {
      const { paywall, owner } = fixture;
      await expect(paywall.connect(owner).setMaxDurationSeconds(0)).to.be.revertedWith("Invalid maxDurationSeconds");
    });
  });

  describe("setPlan (admin)", function () {
    it("Should set plan and emit PlanUpdated", async function () {
      const { paywall, mockUsdc, owner } = fixture;
      const token = await mockUsdc.getAddress();
      const price = ethers.parseUnits("5", 6);
      const duration = 1000n;

      await expect(paywall.connect(owner).setPlan(token, price, duration, true))
        .to.emit(paywall, "PlanUpdated")
        .withArgs(token, price, duration, true);

      const plan = await paywall.plans(token);
      void expect(plan.price).to.equal(price);
      void expect(plan.durationSeconds).to.equal(duration);
      void expect(plan.enabled).to.be.true;
    });

    it("Should revert when called by non-owner", async function () {
      const { paywall, mockUsdc, user } = fixture;
      await expect(
        paywall.connect(user).setPlan(await mockUsdc.getAddress(), 1n, 1n, true),
      ).to.be.revertedWithCustomError(paywall, "OwnableUnauthorizedAccount");
    });

    it("Should revert for zero token address", async function () {
      const { paywall, owner } = fixture;
      await expect(paywall.connect(owner).setPlan(ethers.ZeroAddress, 1n, 1n, true)).to.be.revertedWith(
        "Invalid token",
      );
    });

    it("Should revert for zero price", async function () {
      const { paywall, mockUsdc, owner } = fixture;
      await expect(paywall.connect(owner).setPlan(await mockUsdc.getAddress(), 0n, 1n, true)).to.be.revertedWith(
        "Price must be > 0",
      );
    });

    it("Should revert for zero duration", async function () {
      const { paywall, mockUsdc, owner } = fixture;
      await expect(paywall.connect(owner).setPlan(await mockUsdc.getAddress(), 1n, 0n, true)).to.be.revertedWith(
        "Duration must be > 0",
      );
    });

    it("Should revert when duration exceeds maxDurationSeconds", async function () {
      const { paywall, mockUsdc, owner } = fixture;
      const tooLong = (await paywall.maxDurationSeconds()) + 1n;
      await expect(paywall.connect(owner).setPlan(await mockUsdc.getAddress(), 1n, tooLong, true)).to.be.revertedWith(
        "Duration too long",
      );
    });
  });

  describe("pay (user)", function () {
    it("Should accept payment, set expiry and emit PaymentReceived with correct args", async function () {
      const { paywall, mockUsdc, user, price, durationSeconds } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);

      const tx = await paywall.connect(user).pay(token);
      const block = await ethers.provider.getBlock(tx.blockNumber ?? 0);
      void expect(block).to.not.be.null;

      await expect(tx)
        .to.emit(paywall, "PaymentReceived")
        .withArgs(
          user.address,
          token,
          price,
          BigInt(block!.timestamp),
          durationSeconds,
          BigInt(block!.timestamp) + durationSeconds,
        );

      void expect(await paywall.isActive(user.address)).to.be.true;
      const [expiryTimestamp, active] = await paywall.getSubscription(user.address);
      void expect(expiryTimestamp).to.equal(BigInt(block!.timestamp) + durationSeconds);
      void expect(active).to.be.true;
    });

    it("Should extend subscription when paying again before expiry", async function () {
      const { paywall, mockUsdc, user, price, durationSeconds } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price * 2n);

      await paywall.connect(user).pay(token);
      const [, active1] = await paywall.getSubscription(user.address);
      void expect(active1).to.be.true;

      await paywall.connect(user).pay(token);
      const [expiryTimestamp2, active2] = await paywall.getSubscription(user.address);
      void expect(active2).to.be.true;
      const latestBlock = await ethers.provider.getBlock("latest");
      void expect(latestBlock).to.not.be.null;
      void expect(expiryTimestamp2).to.be.greaterThan(BigInt(latestBlock!.timestamp) + durationSeconds);
    });

    it("Should carry forward expiryTimestamp when renewing early", async function () {
      const { paywall, mockUsdc, user, price, durationSeconds } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price * 2n);

      await paywall.connect(user).pay(token);
      const [expiryTimestamp1] = await paywall.getSubscription(user.address);

      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine", []);

      await paywall.connect(user).pay(token);
      const [expiryTimestamp2] = await paywall.getSubscription(user.address);

      void expect(expiryTimestamp2).to.equal(expiryTimestamp1 + durationSeconds);
    });

    it("Should expire after duration and allow renewal from current time", async function () {
      const { paywall, mockUsdc, owner, user } = fixture;
      const token = await mockUsdc.getAddress();
      const shortPrice = ethers.parseUnits("1", 6);
      const shortDuration = 2n;
      await paywall.connect(owner).setPlan(token, shortPrice, shortDuration, true);
      await mockUsdc.connect(user).approve(await paywall.getAddress(), shortPrice * 2n);

      await paywall.connect(user).pay(token);
      const [expiryAfterPay] = await paywall.getSubscription(user.address);

      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      void expect(await paywall.isActive(user.address)).to.be.false;
      const [, activeExpired] = await paywall.getSubscription(user.address);
      void expect(activeExpired).to.be.false;

      await paywall.connect(user).pay(token);
      const [expiryAfterRenewal, activeRenewed] = await paywall.getSubscription(user.address);
      const currentBlock = await ethers.provider.getBlock("latest");
      void expect(currentBlock).to.not.be.null;
      void expect(activeRenewed).to.be.true;
      void expect(expiryAfterRenewal).to.equal(BigInt(currentBlock!.timestamp) + shortDuration);
      void expect(BigInt(currentBlock!.timestamp)).to.be.greaterThan(expiryAfterPay);
    });

    it("Should revert when token not supported (disabled plan)", async function () {
      const { paywall, mockUsdc, owner, user } = fixture;
      await paywall.connect(owner).setPlan(await mockUsdc.getAddress(), 1n, 1n, false);
      await mockUsdc.connect(user).approve(await paywall.getAddress(), 1n);
      await expect(paywall.connect(user).pay(await mockUsdc.getAddress())).to.be.revertedWith("Token not supported");
    });

    it("Should revert when plan not set (zero price)", async function () {
      const { paywall, user } = fixture;
      const UnknownToken = await ethers.getContractFactory("MockUSDC");
      const unknown = await UnknownToken.deploy();
      await unknown.waitForDeployment();
      await unknown.mint(user.address, ethers.parseUnits("1", 6));
      await unknown.connect(user).approve(await paywall.getAddress(), ethers.parseUnits("1", 6));
      await expect(paywall.connect(user).pay(await unknown.getAddress())).to.be.revertedWith("Plan not set");
    });

    it("Should revert when paused", async function () {
      const { paywall, mockUsdc, owner, user, price } = fixture;
      await paywall.connect(owner).pause();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await expect(paywall.connect(user).pay(await mockUsdc.getAddress())).to.be.revertedWithCustomError(
        paywall,
        "EnforcedPause",
      );
    });

    it("Should revert when insufficient allowance", async function () {
      const { paywall, mockUsdc, user } = fixture;
      await expect(paywall.connect(user).pay(await mockUsdc.getAddress())).to.be.reverted;
    });
  });

  describe("setPlan overwrite", function () {
    it("Should update existing plan and next pay uses new price and duration", async function () {
      const { paywall, mockUsdc, owner, user } = fixture;
      const token = await mockUsdc.getAddress();

      const newPrice = ethers.parseUnits("10", 6);
      const newDuration = 1000n;
      await paywall.connect(owner).setPlan(token, newPrice, newDuration, true);

      const plan = await paywall.plans(token);
      void expect(plan.price).to.equal(newPrice);
      void expect(plan.durationSeconds).to.equal(newDuration);
      void expect(plan.enabled).to.be.true;

      await mockUsdc.connect(user).approve(await paywall.getAddress(), newPrice);
      await paywall.connect(user).pay(token);

      const [expiryTimestamp] = await paywall.getSubscription(user.address);
      const currentBlock = await ethers.provider.getBlock("latest");
      void expect(currentBlock).to.not.be.null;
      void expect(expiryTimestamp).to.equal(BigInt(currentBlock!.timestamp) + newDuration);
      void expect(await mockUsdc.balanceOf(await paywall.getAddress())).to.equal(newPrice);
    });
  });

  describe("withdrawTokens (admin)", function () {
    it("Should transfer tokens to recipient and emit TokensWithdrawn", async function () {
      const { paywall, mockUsdc, owner, user, other, price } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(token);

      const balanceBefore = await mockUsdc.balanceOf(other.address);
      await expect(paywall.connect(owner).withdrawTokens(token, other.address, price))
        .to.emit(paywall, "TokensWithdrawn")
        .withArgs(token, other.address, price);
      void expect(await mockUsdc.balanceOf(other.address)).to.equal(balanceBefore + price);
    });

    it("Should revert when called by non-owner", async function () {
      const { paywall, mockUsdc, user, other, price } = fixture;
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(await mockUsdc.getAddress());
      await expect(
        paywall.connect(user).withdrawTokens(await mockUsdc.getAddress(), other.address, price),
      ).to.be.revertedWithCustomError(paywall, "OwnableUnauthorizedAccount");
    });

    it("Should revert for zero recipient", async function () {
      const { paywall, mockUsdc, owner, user, price } = fixture;
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(await mockUsdc.getAddress());
      await expect(
        paywall.connect(owner).withdrawTokens(await mockUsdc.getAddress(), ethers.ZeroAddress, price),
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should allow owner to rescue unknown token (no plan) when balance exists", async function () {
      const { paywall, owner, other } = fixture;
      const UnknownToken = await ethers.getContractFactory("MockUSDC");
      const unknown = await UnknownToken.deploy();
      await unknown.waitForDeployment();

      await unknown.mint(await paywall.getAddress(), 1n);

      await expect(paywall.connect(owner).withdrawTokens(await unknown.getAddress(), other.address, 1n))
        .to.emit(paywall, "TokensWithdrawn")
        .withArgs(await unknown.getAddress(), other.address, 1n);
      void expect(await unknown.balanceOf(other.address)).to.equal(1n);
    });

    it("Should allow owner to withdraw when paused (emergency)", async function () {
      const { paywall, mockUsdc, owner, user, other, price } = fixture;
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price * 2n);
      await paywall.connect(user).pay(await mockUsdc.getAddress());
      await paywall.connect(owner).pause();
      const balanceBefore = await mockUsdc.balanceOf(other.address);
      await expect(paywall.connect(owner).withdrawTokens(await mockUsdc.getAddress(), other.address, price)).to.emit(
        paywall,
        "TokensWithdrawn",
      );
      void expect(await mockUsdc.balanceOf(other.address)).to.equal(balanceBefore + price);
    });

    it("Should revert for zero amount", async function () {
      const { paywall, mockUsdc, owner, user, other, price } = fixture;
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(await mockUsdc.getAddress());
      await expect(
        paywall.connect(owner).withdrawTokens(await mockUsdc.getAddress(), other.address, 0n),
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should revert for zero token address", async function () {
      const { paywall, owner, other, price } = fixture;
      await expect(paywall.connect(owner).withdrawTokens(ethers.ZeroAddress, other.address, price)).to.be.revertedWith(
        "Invalid token",
      );
    });

    it("Should revert when amount exceeds contract balance", async function () {
      const { paywall, mockUsdc, owner, user, other, price } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(token);

      const balance = await mockUsdc.balanceOf(await paywall.getAddress());
      await expect(paywall.connect(owner).withdrawTokens(token, other.address, balance + 1n)).to.be.reverted;
    });
  });

  describe("withdrawNative (admin)", function () {
    it("Should withdraw native balance to recipient and emit NativeWithdrawn", async function () {
      const { paywall, owner, other } = fixture;
      const paywallAddress = await paywall.getAddress();
      const amount = ethers.parseEther("1");

      await ethers.provider.send("hardhat_setBalance", [paywallAddress, `0x${amount.toString(16)}`]);

      const before = await ethers.provider.getBalance(other.address);
      await expect(paywall.connect(owner).withdrawNative(other.address, amount))
        .to.emit(paywall, "NativeWithdrawn")
        .withArgs(other.address, amount);
      const after = await ethers.provider.getBalance(other.address);
      void expect(after - before).to.equal(amount);
    });

    it("Should revert when called by non-owner", async function () {
      const { paywall, user, other } = fixture;
      await expect(paywall.connect(user).withdrawNative(other.address, 1n)).to.be.revertedWithCustomError(
        paywall,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert for zero recipient", async function () {
      const { paywall, owner } = fixture;
      await expect(paywall.connect(owner).withdrawNative(ethers.ZeroAddress, 1n)).to.be.revertedWith(
        "Invalid recipient",
      );
    });

    it("Should revert for zero amount", async function () {
      const { paywall, owner, other } = fixture;
      await expect(paywall.connect(owner).withdrawNative(other.address, 0n)).to.be.revertedWith("Amount must be > 0");
    });

    it("Should revert when amount exceeds native balance", async function () {
      const { paywall, owner, other } = fixture;
      await expect(paywall.connect(owner).withdrawNative(other.address, 1n)).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Pause / unpause", function () {
    it("Only owner can pause and unpause", async function () {
      const { paywall, owner, user } = fixture;
      await paywall.connect(owner).pause();
      void expect(await paywall.paused()).to.be.true;
      await expect(paywall.connect(user).unpause()).to.be.revertedWithCustomError(
        paywall,
        "OwnableUnauthorizedAccount",
      );
      await paywall.connect(owner).unpause();
      void expect(await paywall.paused()).to.be.false;
    });
  });

  describe("View functions", function () {
    it("isActive and getSubscription reflect expiry correctly", async function () {
      const { paywall, user } = fixture;
      void expect(await paywall.isActive(user.address)).to.be.false;
      const [expiryTimestamp, active] = await paywall.getSubscription(user.address);
      void expect(expiryTimestamp).to.equal(0n);
      void expect(active).to.be.false;
    });
  });

  describe("Security: Reentrancy (ReentrantERC20)", function () {
    // pay() and withdrawTokens() use nonReentrant. ReentrantERC20 reenters into pay() during transferFrom;
    // the reentrant call is blocked, so only the initial payment completes.

    async function getReentrantFixture() {
      const [owner, user, other] = await ethers.getSigners();

      const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
      const implementation = await TokenpingPaywallFactory.deploy();
      await implementation.waitForDeployment();

      const initData = TokenpingPaywallFactory.interface.encodeFunctionData("initialize", [owner.address, 31_536_000]);
      const ERC1967Proxy = await ethers.getContractFactory(
        "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      );
      const proxy = await ERC1967Proxy.deploy(await implementation.getAddress(), initData);
      await proxy.waitForDeployment();

      const paywall = TokenpingPaywallFactory.attach(await proxy.getAddress()) as unknown as TokenpingPaywall;

      const ReentrantERC20Factory = await ethers.getContractFactory("ReentrantERC20");
      const reentrantToken = (await ReentrantERC20Factory.deploy()) as unknown as ReentrantERC20;
      await reentrantToken.waitForDeployment();

      const price = ethers.parseUnits("3", 6);
      const durationSeconds = 2_592_000n;
      await paywall.connect(owner).setPlan(await reentrantToken.getAddress(), price, durationSeconds, true);

      reentrantToken.setPaywall(await paywall.getAddress());
      reentrantToken.approvePaywall();

      const mintAmount = ethers.parseUnits("10000", 6);
      await reentrantToken.mint(user.address, mintAmount);
      // Token needs balance so it can be the "from" in reentrant pay(); with only 1*price the nested
      // callback reverts (token has 0), token swallows it and returns true, so only user payment completes.
      await reentrantToken.mint(await reentrantToken.getAddress(), price);

      return { paywall, reentrantToken, owner, user, other, price, durationSeconds };
    }

    it("Completes when paying with ReentrantERC20 (reentrant pay is on token contract, not user)", async function () {
      const { paywall, reentrantToken, user, price, durationSeconds } = await getReentrantFixture();
      const tokenAddr = await reentrantToken.getAddress();
      await reentrantToken.connect(user).approve(await paywall.getAddress(), price);

      await expect(paywall.connect(user).pay(tokenAddr)).to.not.be.reverted;

      const [userExpiryTimestamp, userActive] = await paywall.getSubscription(user.address);
      const latestBlock = await ethers.provider.getBlock("latest");
      void expect(latestBlock).to.not.be.null;
      void expect(userActive).to.be.true;
      void expect(userExpiryTimestamp).to.equal(BigInt(latestBlock!.timestamp) + durationSeconds);
    });

    it("User subscription is extended exactly once per pay() call (no double-credit to user)", async function () {
      const { paywall, reentrantToken, user, price, durationSeconds } = await getReentrantFixture();
      const tokenAddr = await reentrantToken.getAddress();
      await reentrantToken.connect(user).approve(await paywall.getAddress(), price);

      void (await ethers.provider.getBlock("latest"));
      await paywall.connect(user).pay(tokenAddr);
      const blockAfter = await ethers.provider.getBlock("latest");
      void expect(blockAfter).to.not.be.null;

      const [userExpiryTimestamp] = await paywall.getSubscription(user.address);
      const expectedExpiry = BigInt(blockAfter!.timestamp) + durationSeconds;
      void expect(userExpiryTimestamp).to.equal(expectedExpiry);
    });

    it("Paywall receives correct token balance after reentrant pay (reentrant path reverts, only user payment)", async function () {
      const { paywall, reentrantToken, user, price } = await getReentrantFixture();
      const tokenAddr = await reentrantToken.getAddress();
      await reentrantToken.connect(user).approve(await paywall.getAddress(), price);

      await paywall.connect(user).pay(tokenAddr);

      // nonReentrant blocks the reentrant pay(); token swallows the failed .call() and returns true, so outer pay() completes.
      const paywallBalance = await reentrantToken.balanceOf(await paywall.getAddress());
      void expect(paywallBalance).to.equal(price);
    });

    it("Reentrant pay() is blocked: token contract does not get a subscription", async function () {
      const { paywall, reentrantToken, user, price } = await getReentrantFixture();
      const tokenAddr = await reentrantToken.getAddress();
      await reentrantToken.connect(user).approve(await paywall.getAddress(), price);

      await paywall.connect(user).pay(tokenAddr);

      // With nonReentrant, the reentrant pay() reverts, so the token contract never gets expiry updated.
      const tokenContractAddress = await reentrantToken.getAddress();
      void expect(await paywall.isActive(tokenContractAddress)).to.be.false;
      const [, active] = await paywall.getSubscription(tokenContractAddress);
      void expect(active).to.be.false;
    });

    it("WithdrawTokens with ReentrantERC20 does not reenter (transfer path, not transferFrom)", async function () {
      const { paywall, reentrantToken, owner, user, other, price } = await getReentrantFixture();
      const tokenAddr = await reentrantToken.getAddress();
      await reentrantToken.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(tokenAddr);

      const balanceBefore = await reentrantToken.balanceOf(other.address);
      await expect(paywall.connect(owner).withdrawTokens(tokenAddr, other.address, price))
        .to.emit(paywall, "TokensWithdrawn")
        .withArgs(tokenAddr, other.address, price);
      void expect(await reentrantToken.balanceOf(other.address)).to.equal(balanceBefore + price);
    });
  });

  describe("Security: UUPS upgrade", function () {
    it("Only owner can upgrade", async function () {
      const { paywall, owner, user } = fixture;
      const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
      const impl2 = await TokenpingPaywallFactory.deploy();
      await impl2.waitForDeployment();
      await expect(
        paywall.connect(user).upgradeToAndCall(await impl2.getAddress(), "0x"),
      ).to.be.revertedWithCustomError(paywall, "OwnableUnauthorizedAccount");
      await paywall.connect(owner).upgradeToAndCall(await impl2.getAddress(), "0x");
    });

    it("Preserves owner, plan and subscription state after upgrade", async function () {
      const { paywall, mockUsdc, owner, user, price } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price);
      await paywall.connect(user).pay(token);

      const ownerBefore = await paywall.owner();
      const planBefore = await paywall.plans(token);
      const [expiryTimestampBefore, activeBefore] = await paywall.getSubscription(user.address);

      const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
      const impl2 = await TokenpingPaywallFactory.deploy();
      await impl2.waitForDeployment();
      await paywall.connect(owner).upgradeToAndCall(await impl2.getAddress(), "0x");

      void expect(await paywall.owner()).to.equal(ownerBefore);
      const planAfter = await paywall.plans(token);
      void expect(planAfter.price).to.equal(planBefore.price);
      void expect(planAfter.durationSeconds).to.equal(planBefore.durationSeconds);
      void expect(planAfter.enabled).to.equal(planBefore.enabled);

      const [expiryTimestampAfter, activeAfter] = await paywall.getSubscription(user.address);
      void expect(expiryTimestampAfter).to.equal(expiryTimestampBefore);
      void expect(activeAfter).to.equal(activeBefore);
    });
  });
});
