// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IBridge } from "./interfaces/IBridge.sol";
import { WrappedToken } from "./WrappedToken.sol";

/// @title BridgeDestination
/// @notice Deployed on destination chain. Mints wrapped tokens when bridging in, burns when bridging out.
contract BridgeDestination is IBridge, Ownable, ReentrancyGuard {
    /// @notice Address authorized to mint tokens (the relayer)
    address public relayer;

    /// @notice Nonce for tracking bridge transactions
    uint256 public nonce;

    /// @notice Mapping from source chain token to wrapped token on this chain
    /// @dev sourceChainId => sourceToken => wrappedToken
    mapping(uint256 => mapping(address => address)) public tokenMappings;

    /// @notice Supported source chain IDs
    mapping(uint256 => bool) public supportedChains;

    /// @notice Processed mint nonces to prevent replay attacks
    mapping(bytes32 => bool) public processedMints;

    error InvalidAddress();
    error InvalidAmount();
    error UnsupportedChain();
    error TokenNotMapped();
    error OnlyRelayer();
    error AlreadyProcessed();
    error InsufficientAllowance();

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    constructor(address _relayer) Ownable(msg.sender) {
        if (_relayer == address(0)) revert InvalidAddress();
        relayer = _relayer;
    }

    /// @notice Mint wrapped tokens after tokens are locked on source chain (called by relayer)
    /// @param sourceToken The token address on the source chain
    /// @param recipient Address to receive wrapped tokens
    /// @param amount Amount to mint
    /// @param sourceNonce The nonce from the source chain lock event
    /// @param sourceChainId The chain ID where tokens were locked
    function mintTokens(
        address sourceToken,
        address recipient,
        uint256 amount,
        uint256 sourceNonce,
        uint256 sourceChainId
    ) external onlyRelayer nonReentrant {
        // sourceToken can be address(0) for native ETH
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!supportedChains[sourceChainId]) revert UnsupportedChain();

        address wrappedToken = tokenMappings[sourceChainId][sourceToken];
        if (wrappedToken == address(0)) revert TokenNotMapped();

        bytes32 mintId = keccak256(abi.encodePacked(sourceChainId, sourceNonce));
        if (processedMints[mintId]) revert AlreadyProcessed();

        processedMints[mintId] = true;

        WrappedToken(wrappedToken).mint(recipient, amount);

        emit TokensMinted(wrappedToken, recipient, amount, sourceNonce, sourceChainId);
    }

    /// @notice Burn wrapped tokens to bridge back to source chain
    /// @param wrappedToken The wrapped token to burn
    /// @param amount Amount to burn
    /// @param recipient Address to receive original tokens on source chain
    /// @param destinationChainId The chain ID to bridge back to
    function burnTokens(
        address wrappedToken,
        uint256 amount,
        address recipient,
        uint256 destinationChainId
    ) external nonReentrant {
        if (wrappedToken == address(0) || recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (!supportedChains[destinationChainId]) revert UnsupportedChain();

        WrappedToken token = WrappedToken(wrappedToken);

        // Verify this is a valid wrapped token by checking if source chain matches
        if (token.sourceChainId() != destinationChainId) revert UnsupportedChain();

        // Burn the tokens (requires approval from user)
        token.burn(msg.sender, amount);

        uint256 currentNonce = nonce++;

        emit TokensBurned(wrappedToken, msg.sender, recipient, amount, currentNonce, destinationChainId);
    }

    /// @notice Add a supported source chain
    function addSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = true;
    }

    /// @notice Remove a supported chain
    function removeSupportedChain(uint256 chainId) external onlyOwner {
        supportedChains[chainId] = false;
    }

    /// @notice Map a source token to a wrapped token
    /// @param sourceChainId The source chain ID
    /// @param sourceToken The token address on source chain
    /// @param wrappedToken The wrapped token address on this chain
    function setTokenMapping(uint256 sourceChainId, address sourceToken, address wrappedToken) external onlyOwner {
        // sourceToken can be address(0) for native ETH
        if (wrappedToken == address(0)) revert InvalidAddress();
        tokenMappings[sourceChainId][sourceToken] = wrappedToken;
        emit TokenMappingUpdated(sourceToken, wrappedToken);
    }

    /// @notice Update the relayer address
    function setRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert InvalidAddress();
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }
}
