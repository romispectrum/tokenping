// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TokenpingPayments is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuard,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    /// @dev Average block time used for expiry timestamp estimation (seconds)
    uint256 public constant AVERAGE_BLOCK_TIME = 12;

    struct Plan {
        uint256 price;          // token base units (e.g. USDC has 6 decimals)
        uint256 durationBlocks; // duration granted per payment
        bool enabled;
    }

    /// token => plan
    mapping(address => Plan) public plans;

    /// user => subscription state
    mapping(address => uint256) public expiryBlock;
    mapping(address => uint256) public expiryTimestamp;

    /// EVENTS

    event PlanUpdated(
        address indexed token,
        uint256 price,
        uint256 durationBlocks,
        bool enabled
    );

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

    event TokensWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    /// INITIALIZER

    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
    }

    /// ADMIN FUNCTIONS

    function setPlan(
        address token,
        uint256 price,
        uint256 durationBlocks,
        bool enabled
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(price > 0, "Price must be > 0");
        require(durationBlocks > 0, "Duration must be > 0");

        plans[token] = Plan({
            price: price,
            durationBlocks: durationBlocks,
            enabled: enabled
        });

        emit PlanUpdated(token, price, durationBlocks, enabled);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner whenNotPaused nonReentrant {
        require(to != address(0), "Invalid recipient");

        IERC20(token).safeTransfer(to, amount);

        emit TokensWithdrawn(token, to, amount);
    }

    /// USER FUNCTION

    function pay(address token)
        external
        whenNotPaused
        nonReentrant
    {
        Plan memory plan = plans[token];

        require(plan.enabled, "Token not supported");
        require(plan.price > 0, "Plan not set");

        IERC20(token).safeTransferFrom(
            msg.sender,
            address(this),
            plan.price
        );

        uint256 startBlock =
            expiryBlock[msg.sender] > block.number
                ? expiryBlock[msg.sender]
                : block.number;

        uint256 newExpiryBlock =
            startBlock + plan.durationBlocks;

        uint256 newExpiryTimestamp =
            block.timestamp +
                (plan.durationBlocks * AVERAGE_BLOCK_TIME);

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

    /// VIEW FUNCTIONS

    function isActive(address user) external view returns (bool) {
        return expiryBlock[user] > block.number;
    }

    function getSubscription(address user)
        external
        view
        returns (
            uint256 _expiryBlock,
            uint256 _expiryTimestamp,
            bool active
        )
    {
        _expiryBlock = expiryBlock[user];
        _expiryTimestamp = expiryTimestamp[user];
        active = _expiryBlock > block.number;
    }

    /// UUPS

    function _authorizeUpgrade(address)
        internal
        override
        onlyOwner
    {}

    /// STORAGE GAP
    uint256[50] private __gap;
}
