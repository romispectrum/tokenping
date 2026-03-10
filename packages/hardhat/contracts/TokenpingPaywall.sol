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

    /// @param _maxDurationSeconds Max allowed plan duration in seconds. Must be > 0.
    function initialize(address initialOwner, uint256 _maxDurationSeconds) public initializer {
        __Pausable_init();
        __Ownable_init(initialOwner);
        require(initialOwner != address(0), "Invalid owner");
        require(_maxDurationSeconds > 0, "Invalid maxDurationSeconds");
        maxDurationSeconds = _maxDurationSeconds;
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

    /// @dev Maximum allowed duration in seconds. Prevents extreme durations. Configurable by owner.
    uint256 public maxDurationSeconds;

    struct Plan {
        uint256 price; // token base units (e.g. USDC has 6 decimals)
        uint256 durationSeconds;
        bool enabled;
    }

    /// token => plan
    mapping(address => Plan) public plans;

    mapping(address => uint256) public expiryTimestampByUser;

    /// EVENTS

    event PlanUpdated(address indexed token, uint256 price, uint256 durationSeconds, bool enabled);

    event PaymentReceived(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 paidAtTimestamp,
        uint256 durationSeconds,
        uint256 newExpiryTimestamp
    );

    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event NativeWithdrawn(address indexed to, uint256 amount);

    event MaxDurationSecondsUpdated(uint256 oldValue, uint256 newValue);

    /// ADMIN (custom)

    function setPlan(address token, uint256 price, uint256 durationSeconds, bool enabled) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Price must be > 0");
        require(durationSeconds > 0, "Duration must be > 0");
        require(durationSeconds <= maxDurationSeconds, "Duration too long");

        plans[token] = Plan({ price: price, durationSeconds: durationSeconds, enabled: enabled });

        emit PlanUpdated(token, price, durationSeconds, enabled);
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

    function setMaxDurationSeconds(uint256 newMaxDurationSeconds) external onlyOwner {
        require(newMaxDurationSeconds > 0, "Invalid maxDurationSeconds");
        uint256 oldValue = maxDurationSeconds;
        maxDurationSeconds = newMaxDurationSeconds;
        emit MaxDurationSecondsUpdated(oldValue, newMaxDurationSeconds);
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

        uint256 startTimestamp = expiryTimestampByUser[msg.sender] > block.timestamp
            ? expiryTimestampByUser[msg.sender]
            : block.timestamp;
        // Overflow prevented by maxDurationSeconds and Solidity 0.8+ checked arithmetic
        uint256 newExpiryTimestamp = startTimestamp + plan.durationSeconds;

        expiryTimestampByUser[msg.sender] = newExpiryTimestamp;

        emit PaymentReceived(
            msg.sender,
            token,
            plan.price,
            block.timestamp,
            plan.durationSeconds,
            newExpiryTimestamp
        );
    }

    // VIEW FUNCTIONS

    function isActive(address user) external view returns (bool) {
        return expiryTimestampByUser[user] > block.timestamp;
    }

    function getSubscription(address user) external view returns (uint256 expiryTimestamp, bool active) {
        expiryTimestamp = expiryTimestampByUser[user];
        active = expiryTimestamp > block.timestamp;
    }

    /// STORAGE GAP
    uint256[50] private __gap;
}
