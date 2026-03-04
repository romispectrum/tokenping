import { expect } from "chai";
import { ethers } from "hardhat";
import type { TokenpingPaywall, MockUSDC } from "../typechain-types";

async function getTokenpingPaywallFixture() {
  const [owner, user, other] = await ethers.getSigners();

  const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
  const implementation = await TokenpingPaywallFactory.deploy();
  await implementation.waitForDeployment();

  const initData = TokenpingPaywallFactory.interface.encodeFunctionData("initialize", [owner.address]);
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
  const durationBlocks = 216000n; // ~30 days @ 12s/block
  await paywall.connect(owner).setPlan(await mockUsdc.getAddress(), price, durationBlocks, true);

  const mintAmount = ethers.parseUnits("10000", 6);
  await mockUsdc.mint(user.address, mintAmount);
  await mockUsdc.mint(owner.address, mintAmount);

  return { paywall, mockUsdc, owner, user, other, price, durationBlocks };
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

    it("Should expose constants", async function () {
      const { paywall } = fixture;
      void expect(await paywall.AVERAGE_BLOCK_TIME()).to.equal(12n);
      void expect(await paywall.MAX_DURATION_BLOCKS()).to.equal(2_628_000n);
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
      void expect(plan.durationBlocks).to.equal(duration);
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

    it("Should revert when duration exceeds MAX_DURATION_BLOCKS", async function () {
      const { paywall, mockUsdc, owner } = fixture;
      const tooLong = (await paywall.MAX_DURATION_BLOCKS()) + 1n;
      await expect(paywall.connect(owner).setPlan(await mockUsdc.getAddress(), 1n, tooLong, true)).to.be.revertedWith(
        "Duration too long",
      );
    });
  });

  describe("pay (user)", function () {
    it("Should accept payment, set expiry and emit PaymentReceived with correct args", async function () {
      const { paywall, mockUsdc, user, price, durationBlocks } = fixture;
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
          BigInt(block!.number),
          BigInt(block!.timestamp),
          durationBlocks,
          BigInt(block!.number) + durationBlocks,
          BigInt(block!.timestamp) + durationBlocks * 12n,
        );

      void expect(await paywall.isActive(user.address)).to.be.true;
      const [expiryBlock, , active] = await paywall.getSubscription(user.address);
      const blockNum = await ethers.provider.getBlockNumber();
      void expect(expiryBlock).to.equal(BigInt(blockNum) + durationBlocks);
      void expect(active).to.be.true;
    });

    it("Should extend subscription when paying again before expiry", async function () {
      const { paywall, mockUsdc, user, price, durationBlocks } = fixture;
      const token = await mockUsdc.getAddress();
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price * 2n);

      await paywall.connect(user).pay(token);
      const [, , active1] = await paywall.getSubscription(user.address);
      void expect(active1).to.be.true;

      await paywall.connect(user).pay(token);
      const [expiryBlock2, , active2] = await paywall.getSubscription(user.address);
      void expect(active2).to.be.true;
      const blockNum = await ethers.provider.getBlockNumber();
      void expect(expiryBlock2).to.be.greaterThan(BigInt(blockNum) + durationBlocks);
    });

    it("Should expire after durationBlocks and allow renewal from current block", async function () {
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
      const [, , activeExpired] = await paywall.getSubscription(user.address);
      void expect(activeExpired).to.be.false;

      await paywall.connect(user).pay(token);
      const [expiryAfterRenewal, , activeRenewed] = await paywall.getSubscription(user.address);
      const blockNum = await ethers.provider.getBlockNumber();
      void expect(activeRenewed).to.be.true;
      void expect(expiryAfterRenewal).to.equal(BigInt(blockNum) + shortDuration);
      void expect(BigInt(blockNum)).to.be.greaterThan(expiryAfterPay);
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
      void expect(plan.durationBlocks).to.equal(newDuration);
      void expect(plan.enabled).to.be.true;

      await mockUsdc.connect(user).approve(await paywall.getAddress(), newPrice);
      await paywall.connect(user).pay(token);

      const [expiryBlock] = await paywall.getSubscription(user.address);
      const blockNum = await ethers.provider.getBlockNumber();
      void expect(expiryBlock).to.equal(BigInt(blockNum) + newDuration);
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

    it("Should revert for unknown token (no plan)", async function () {
      const { paywall, owner, other } = fixture;
      const UnknownToken = await ethers.getContractFactory("MockUSDC");
      const unknown = await UnknownToken.deploy();
      await unknown.waitForDeployment();
      await expect(
        paywall.connect(owner).withdrawTokens(await unknown.getAddress(), other.address, 1n),
      ).to.be.revertedWith("Unknown token");
    });

    it("Should revert when paused", async function () {
      const { paywall, mockUsdc, owner, user, other, price } = fixture;
      await mockUsdc.connect(user).approve(await paywall.getAddress(), price * 2n);
      await paywall.connect(user).pay(await mockUsdc.getAddress());
      await paywall.connect(owner).pause();
      await expect(
        paywall.connect(owner).withdrawTokens(await mockUsdc.getAddress(), other.address, price),
      ).to.be.revertedWithCustomError(paywall, "EnforcedPause");
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
      const [expiryBlock, expiryTimestamp, active] = await paywall.getSubscription(user.address);
      void expect(expiryBlock).to.equal(0n);
      void expect(expiryTimestamp).to.equal(0n);
      void expect(active).to.be.false;
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
      const [expiryBlockBefore, expiryTimestampBefore, activeBefore] = await paywall.getSubscription(user.address);

      const TokenpingPaywallFactory = await ethers.getContractFactory("TokenpingPaywall");
      const impl2 = await TokenpingPaywallFactory.deploy();
      await impl2.waitForDeployment();
      await paywall.connect(owner).upgradeToAndCall(await impl2.getAddress(), "0x");

      void expect(await paywall.owner()).to.equal(ownerBefore);
      const planAfter = await paywall.plans(token);
      void expect(planAfter.price).to.equal(planBefore.price);
      void expect(planAfter.durationBlocks).to.equal(planBefore.durationBlocks);
      void expect(planAfter.enabled).to.equal(planBefore.enabled);

      const [expiryBlockAfter, expiryTimestampAfter, activeAfter] = await paywall.getSubscription(user.address);
      void expect(expiryBlockAfter).to.equal(expiryBlockBefore);
      void expect(expiryTimestampAfter).to.equal(expiryTimestampBefore);
      void expect(activeAfter).to.equal(activeBefore);
    });
  });
});
