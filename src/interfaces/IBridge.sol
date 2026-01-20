// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBridge {
    event TokensLocked(
        address indexed token,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 destinationChainId
    );

    event TokensUnlocked(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    );

    event TokensMinted(
        address indexed wrappedToken,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId
    );

    event TokensBurned(
        address indexed wrappedToken,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 nonce,
        uint256 destinationChainId
    );

    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event TokenMappingUpdated(address indexed sourceToken, address indexed wrappedToken);
}
