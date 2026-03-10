// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TokenpingPaywall
/// @notice Subscription paywall: users pay in ERC20 to extend a single subscription per address.
/// @dev Only standard ERC20s are supported. Fee-on-transfer and deflationary tokens are NOT supported
///      (payment must credit this contract with at least the plan price).
///      Owner can rescue accidentally sent ERC20 and native ETH.
///      Centralization: owner can set/change plans, withdraw all received tokens, pause/unpause,
///      and upgrade the implementation (UUPS).
contract TokenpingPaywall is Initializable, PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuard {
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param _averageBlockTime Seconds per block (for expiry timestamp estimate). Must be > 0.
    /// @param _maxDurationBlocks Max allowed plan duration in blocks. Must be > 0.
    function initialize(
        address initialOwner,
        uint256 _averageBlockTime,
        uint256 _maxDurationBlocks
    ) public initializer {
        __Pausable_init();
        __Ownable_init(initialOwner);
        require(initialOwner != address(0), "Invalid owner");
        require(_averageBlockTime > 0, "Invalid averageBlockTime");
        require(_maxDurationBlocks > 0, "Invalid maxDurationBlocks");
        averageBlockTime = _averageBlockTime;
        maxDurationBlocks = _maxDurationBlocks;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    /// custom

    using SafeERC20 for IERC20;

    /// @dev Used only to estimate expiry time; actual access control uses expiryBlock. Configurable by owner.
    uint256 public averageBlockTime;

    /// @dev Maximum allowed duration in blocks. Prevents extreme durations. Configurable by owner.
    uint256 public maxDurationBlocks;

    struct Plan {
        uint256 price; // token base units (e.g. USDC has 6 decimals)
        uint256 durationBlocks; // duration granted per payment
        bool enabled;
    }

    /// token => plan
    mapping(address => Plan) public plans;

    /// @dev One subscription per user; paying with any supported token updates the same expiry.
    mapping(address => uint256) public expiryBlock;
    /// @dev Approximate expiry time (seconds); for display only. Source of truth for active is expiryBlock.
    mapping(address => uint256) public expiryTimestamp;

    /// EVENTS

    event PlanUpdated(address indexed token, uint256 price, uint256 durationBlocks, bool enabled);

    event PaymentReceived(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 paidAtBlock,
        uint256 paidAtTimestamp,
        uint256 durationBlocks,
        uint256 newExpiryBlock,
        uint256 newExpiryTimestamp
    );

    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event NativeWithdrawn(address indexed to, uint256 amount);

    event AverageBlockTimeUpdated(uint256 oldValue, uint256 newValue);
    event MaxDurationBlocksUpdated(uint256 oldValue, uint256 newValue);

    /// ADMIN (custom)

    function setPlan(address token, uint256 price, uint256 durationBlocks, bool enabled) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Price must be > 0");
        require(durationBlocks > 0, "Duration must be > 0");
        require(durationBlocks <= maxDurationBlocks, "Duration too long");

        plans[token] = Plan({ price: price, durationBlocks: durationBlocks, enabled: enabled });

        emit PlanUpdated(token, price, durationBlocks, enabled);
    }

    /// @notice Withdraws received token balance to a recipient. Callable when paused so owner can withdraw in emergencies.
    /// @param token Token to withdraw.
    /// @param to Recipient address.
    /// @param amount Amount to transfer.
    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");

        IERC20(token).safeTransfer(to, amount);

        emit TokensWithdrawn(token, to, amount);
    }

    /// @notice Withdraws native token balance to a recipient.
    /// @param to Recipient address.
    /// @param amount Native token amount to transfer.
    function withdrawNative(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(address(this).balance >= amount, "Insufficient balance");

        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Native transfer failed");

        emit NativeWithdrawn(to, amount);
    }

    function setAverageBlockTime(uint256 newAverageBlockTime) external onlyOwner {
        require(newAverageBlockTime > 0, "Invalid averageBlockTime");
        uint256 oldValue = averageBlockTime;
        averageBlockTime = newAverageBlockTime;
        emit AverageBlockTimeUpdated(oldValue, newAverageBlockTime);
    }

    function setMaxDurationBlocks(uint256 newMaxDurationBlocks) external onlyOwner {
        require(newMaxDurationBlocks > 0, "Invalid maxDurationBlocks");
        uint256 oldValue = maxDurationBlocks;
        maxDurationBlocks = newMaxDurationBlocks;
        emit MaxDurationBlocksUpdated(oldValue, newMaxDurationBlocks);
    }

    /// USER FUNCTION

    /// @notice Extends or starts the caller's single subscription; payment in the given token.
    /// @dev Integrators: do not rely on isActive() or getSubscription() in the same transaction as a payment
    ///      (e.g. inside token hooks), as state is updated after the transfer and read-only reentrancy can show stale values.
    ///      Fee-on-transfer and deflationary tokens are not supported; the contract must receive at least plan.price.
    function pay(address token) external whenNotPaused nonReentrant {
        Plan memory plan = plans[token];

        require(plan.price > 0, "Plan not set");
        require(plan.enabled, "Token not supported");

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), plan.price);
        require(
            IERC20(token).balanceOf(address(this)) - balanceBefore >= plan.price,
            "Fee-on-transfer not supported"
        );

        uint256 startBlock = expiryBlock[msg.sender] > block.number ? expiryBlock[msg.sender] : block.number;
        uint256 startTimestamp = expiryTimestamp[msg.sender] > block.timestamp ? expiryTimestamp[msg.sender] : block.timestamp;
        // Overflow prevented by maxDurationBlocks and Solidity 0.8+ checked arithmetic
        uint256 newExpiryBlock = startBlock + plan.durationBlocks;
        uint256 newExpiryTimestamp = startTimestamp + (plan.durationBlocks * averageBlockTime);

        expiryBlock[msg.sender] = newExpiryBlock;
        expiryTimestamp[msg.sender] = newExpiryTimestamp;

        emit PaymentReceived(
            msg.sender,
            token,
            plan.price,
            block.number,
            block.timestamp,
            plan.durationBlocks,
            newExpiryBlock,
            newExpiryTimestamp
        );
    }

    // VIEW FUNCTIONS

    function isActive(address user) external view returns (bool) {
        return expiryBlock[user] > block.number;
    }

    /// @dev Returns subscription state. _expiryTimestamp is an estimate for display; active is derived from _expiryBlock.
    function getSubscription(
        address user
    ) external view returns (uint256 _expiryBlock, uint256 _expiryTimestamp, bool active) {
        _expiryBlock = expiryBlock[user];
        _expiryTimestamp = expiryTimestamp[user];
        active = _expiryBlock > block.number;
    }

    /// STORAGE GAP (reduced by 2 for averageBlockTime + maxDurationBlocks)

    uint256[48] private __gap;
}
