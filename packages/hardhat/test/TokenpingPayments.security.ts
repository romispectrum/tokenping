import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenpingPayments (security)", function () {
  let payments: Awaited<ReturnType<ReturnType<typeof ethers.getContractFactory>["deploy"]>>;
  let paymentsAsProxy: Awaited<ReturnType<ReturnType<typeof ethers.getContractAt>>>;
  let mockUsdc: Awaited<ReturnType<ReturnType<typeof ethers.getContractFactory>["deploy"]>>;
  let owner: { address: string };
  let user: { address: string };
  const PLAN_PRICE = ethers.parseUnits("3", 6);
  const PLAN_DURATION = 216000n; // ~30 days @ 12s blocks

  before(async function () {
    const [deployer, userSigner] = await ethers.getSigners();
    owner = deployer;
    user = userSigner;

    const TokenpingPaymentsFactory = await ethers.getContractFactory("TokenpingPayments");
    const implementation = await TokenpingPaymentsFactory.deploy();
    await implementation.waitForDeployment();
    const initData = TokenpingPaymentsFactory.interface.encodeFunctionData("initialize", [owner.address]);
    const ERC1967Proxy = await ethers.getContractFactory(
      "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
    );
    const proxy = await ERC1967Proxy.deploy(await implementation.getAddress(), initData);
    await proxy.waitForDeployment();
    paymentsAsProxy = await ethers.getContractAt("TokenpingPayments", await proxy.getAddress(), owner);
    payments = paymentsAsProxy;

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    await mockUsdc.mint(user.address, ethers.parseUnits("10000", 6));
  });

  describe("withdrawTokens", function () {
    it("reverts with Unknown token when token has no plan", async function () {
      const randomToken = "0x0000000000000000000000000000000000000001";
      await expect(payments.withdrawTokens(randomToken, owner.address, 1n)).to.be.revertedWith("Unknown token");
    });

    it("allows withdrawing a token that has a plan", async function () {
      await payments.setPlan(await mockUsdc.getAddress(), PLAN_PRICE, PLAN_DURATION, true);
      await mockUsdc.connect(user).approve(await payments.getAddress(), PLAN_PRICE);
      await payments.connect(user).pay(await mockUsdc.getAddress());
      const balanceBefore = await mockUsdc.balanceOf(owner.address);
      await payments.withdrawTokens(await mockUsdc.getAddress(), owner.address, PLAN_PRICE);
      expect(await mockUsdc.balanceOf(owner.address)).to.equal(balanceBefore + PLAN_PRICE);
    });
  });

  describe("setPlan (MAX_DURATION_BLOCKS)", function () {
    it("reverts with Duration too long when durationBlocks exceeds MAX_DURATION_BLOCKS", async function () {
      const maxDuration = await payments.MAX_DURATION_BLOCKS();
      await expect(
        payments.setPlan(await mockUsdc.getAddress(), PLAN_PRICE, maxDuration + 1n, true),
      ).to.be.revertedWith("Duration too long");
    });

    it("accepts durationBlocks equal to MAX_DURATION_BLOCKS", async function () {
      const maxDuration = await payments.MAX_DURATION_BLOCKS();
      await expect(payments.setPlan(await mockUsdc.getAddress(), PLAN_PRICE, maxDuration, true)).to.not.be.reverted;
    });
  });
});
