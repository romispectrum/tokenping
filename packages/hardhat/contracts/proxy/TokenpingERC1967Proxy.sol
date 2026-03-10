// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @dev Local wrapper around OpenZeppelin's ERC1967Proxy so Hardhat emits a local artifact
 * that hardhat-deploy can always resolve in clean CI environments.
 */
contract TokenpingERC1967Proxy is ERC1967Proxy {
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {}
}
