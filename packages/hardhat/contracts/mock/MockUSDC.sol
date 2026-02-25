// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes
 * @notice This is a simple ERC20 token with 6 decimals (matching real USDC)
 */
contract MockUSDC is ERC20 {
    uint8 private constant _decimals = 6;

    constructor() ERC20("Mock USDC", "mUSDC") {
        // No initial supply - mint as needed
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints tokens to a specific address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in base units, 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Mints tokens to multiple addresses
     * @param recipients Array of addresses to mint tokens to
     * @param amounts Array of amounts to mint (in base units, 6 decimals)
     */
    function mintBatch(address[] calldata recipients, uint256[] calldata amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}
