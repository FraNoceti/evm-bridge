// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title WrappedToken
/// @notice ERC20 token representing bridged assets on the destination chain.
/// @dev Only the bridge contract can mint and burn tokens.
contract WrappedToken is ERC20, Ownable {
    /// @notice The bridge contract that can mint/burn
    address public bridge;

    /// @notice Decimals of the token
    uint8 private immutable _decimals;

    /// @notice Address of the original token on the source chain
    address public immutable sourceToken;

    /// @notice Chain ID of the source chain
    uint256 public immutable sourceChainId;

    error OnlyBridge();
    error InvalidAddress();

    modifier onlyBridge() {
        if (msg.sender != bridge) revert OnlyBridge();
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        address _sourceToken,
        uint256 _sourceChainId,
        address _bridge
    ) ERC20(name, symbol) Ownable(msg.sender) {
        if (_bridge == address(0)) revert InvalidAddress();
        // sourceToken can be address(0) to represent native ETH
        _decimals = decimals_;
        sourceToken = _sourceToken;
        sourceChainId = _sourceChainId;
        bridge = _bridge;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Mint wrapped tokens (only callable by bridge)
    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
    }

    /// @notice Burn wrapped tokens (only callable by bridge)
    function burn(address from, uint256 amount) external onlyBridge {
        _burn(from, amount);
    }

    /// @notice Update the bridge address (only owner)
    function setBridge(address _bridge) external onlyOwner {
        if (_bridge == address(0)) revert InvalidAddress();
        bridge = _bridge;
    }
}
