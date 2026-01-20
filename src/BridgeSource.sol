// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IBridge } from "./interfaces/IBridge.sol";

/// @title BridgeSource
/// @notice Deployed on the source chain. Locks tokens when bridging out, unlocks when bridging back.
contract BridgeSource is IBridge, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Address authorized to unlock tokens (the relayer)
    address public relayer;

    /// @notice Nonce for tracking bridge transactions
    uint256 public nonce;

    /// @notice Supported destination chain IDs
    mapping(uint256 => bool) public supportedChains;

    /// @notice Tokens that can be bridged
    mapping(address => bool) public supportedTokens;

    /// @notice Processed unlock nonces to prevent replay attacks
    mapping(bytes32 => bool) public processedUnlocks;

    error InvalidAddress();
    error InvalidAmount();
    error UnsupportedChain();
    error UnsupportedToken();
    error OnlyRelayer();
    error AlreadyProcessed();
    error TransferFailed();

    event EthLocked(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 destinationChainId
    );

    event EthUnlocked(
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    );

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    constructor(address _relayer) Ownable(msg.sender) {
        if (_relayer == address(0)) revert InvalidAddress();
        relayer = _relayer;
    }

    /// @notice Lock tokens to bridge them to another chain
    /// @param token The ERC20 token to bridge
    /// @param amount Amount to bridge
    /// @param recipient Address to receive tokens on destination chain
    /// @param destinationChainId The target chain ID
    function lockTokens(
        address token,
        uint256 amount,
        address recipient,
        uint256 destinationChainId
    ) external nonReentrant {
        if (token == address(0) || recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!supportedChains[destinationChainId]) revert UnsupportedChain();
        if (!supportedTokens[token]) revert UnsupportedToken();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 currentNonce = nonce++;

        emit TokensLocked(token, msg.sender, recipient, amount, currentNonce, destinationChainId);
    }

    /// @notice Unlock tokens when bridging back from another chain (called by relayer)
    /// @param token The ERC20 token to unlock
    /// @param recipient Address to receive the unlocked tokens
    /// @param amount Amount to unlock
    /// @param sourceNonce The nonce from the source chain burn event
    /// @param sourceChainId The chain ID where tokens were burned
    function unlockTokens(
        address token,
        address recipient,
        uint256 amount,
        uint256 sourceNonce,
        uint256 sourceChainId
    ) external onlyRelayer nonReentrant {
        if (token == address(0) || recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        bytes32 unlockId = keccak256(abi.encodePacked(sourceChainId, sourceNonce));
        if (processedUnlocks[unlockId]) revert AlreadyProcessed();

        processedUnlocks[unlockId] = true;

        IERC20(token).safeTransfer(recipient, amount);

        emit TokensUnlocked(token, recipient, amount, sourceNonce, sourceChainId);
    }

    /// @notice Lock native ETH to bridge to another chain
    /// @param recipient Address to receive wrapped ETH on destination chain
    /// @param destinationChainId The target chain ID
    function lockEth(address recipient, uint256 destinationChainId) external payable nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InvalidAmount();
        if (!supportedChains[destinationChainId]) revert UnsupportedChain();

        uint256 currentNonce = nonce++;

        emit EthLocked(msg.sender, recipient, msg.value, currentNonce, destinationChainId);
    }

    /// @notice Unlock native ETH when bridging back (called by relayer)
    /// @param recipient Address to receive ETH
    /// @param amount Amount to unlock
    /// @param sourceNonce The nonce from the burn event on destination chain
    /// @param sourceChainId The chain ID where wrapped tokens were burned
    function unlockEth(
        address recipient,
        uint256 amount,
        uint256 sourceNonce,
        uint256 sourceChainId
    ) external onlyRelayer nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        bytes32 unlockId = keccak256(abi.encodePacked("ETH", sourceChainId, sourceNonce));
        if (processedUnlocks[unlockId]) revert AlreadyProcessed();

        processedUnlocks[unlockId] = true;

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EthUnlocked(recipient, amount, sourceNonce, sourceChainId);
    }

    /// @notice Add a supported destination chain
    function addSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = true;
    }

    /// @notice Remove a supported destination chain
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = false;
    }

    /// @notice Add a supported token
    function addSupportedToken(address token) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        supportedTokens[token] = true;
    }

    /// @notice Remove a supported token
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    /// @notice Update the relayer address
    function setRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert InvalidAddress();
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }
}
