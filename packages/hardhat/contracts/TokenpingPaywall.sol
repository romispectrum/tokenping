// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0
pragma solidity ^0.8.27;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenpingPaywall is Initializable, PausableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Pausable_init();
        __Ownable_init(initialOwner);
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

    /// @dev Used only to estimate expiry time; actual access control uses expiryBlock.
    uint256 public constant AVERAGE_BLOCK_TIME = 12;

    /// @dev Maximum allowed duration in blocks (~1 year at 12s/block). Prevents extreme durations.
    uint256 public constant MAX_DURATION_BLOCKS = 2_628_000;

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

    /// ADMIN (custom)

    function setPlan(address token, uint256 price, uint256 durationBlocks, bool enabled) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Price must be > 0");
        require(durationBlocks > 0, "Duration must be > 0");
        require(durationBlocks <= MAX_DURATION_BLOCKS, "Duration too long");

        plans[token] = Plan({ price: price, durationBlocks: durationBlocks, enabled: enabled });

        emit PlanUpdated(token, price, durationBlocks, enabled);
    }

    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Invalid recipient");
        require(plans[token].price > 0, "Unknown token");

        IERC20(token).safeTransfer(to, amount);

        emit TokensWithdrawn(token, to, amount);
    }

    /// USER FUNCTION

    /// @notice Extends or starts the caller's single subscription; payment in the given token.
    function pay(address token) external whenNotPaused {
        Plan memory plan = plans[token];

        require(plan.price > 0, "Plan not set");
        require(plan.enabled, "Token not supported");

        IERC20(token).safeTransferFrom(msg.sender, address(this), plan.price);

        uint256 startBlock = expiryBlock[msg.sender] > block.number ? expiryBlock[msg.sender] : block.number;

        uint256 newExpiryBlock = startBlock + plan.durationBlocks;

        uint256 newExpiryTimestamp = block.timestamp + (plan.durationBlocks * AVERAGE_BLOCK_TIME);

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

    /// STORAGE GAP

    uint256[50] private __gap;
}
