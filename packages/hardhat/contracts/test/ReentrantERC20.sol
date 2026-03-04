// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ReentrantERC20
 * @dev ERC20 that reenters a target contract when transferFrom is called (for security tests only).
 */
contract ReentrantERC20 is ERC20 {
    address public paywall;
    uint8 private constant _decimals = 6;

    constructor() ERC20("Reentrant Token", "RENT") {}

    function setPaywall(address _paywall) external {
        paywall = _paywall;
    }

    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        bool success = super.transferFrom(from, to, amount);
        if (paywall != address(0) && to == paywall) {
            (bool ok,) = paywall.call(abi.encodeWithSignature("pay(address)", address(this)));
            if (ok) {}
        }
        return success;
    }
}
