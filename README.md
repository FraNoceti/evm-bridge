# EVM Bridge

A cross-chain bridge for transferring ETH between Sepolia and Base Sepolia testnets.

**Live App:** https://evm-bridge-nine.vercel.app/docs

**Relayer Health:** https://evm-bridge-production.up.railway.app/health

## Overview

This bridge allows users to:
- **Lock ETH** on Sepolia and receive wrapped tokens (wSepETH) on Base Sepolia
- **Burn wSepETH** on Base Sepolia and unlock ETH back on Sepolia

The relayer service monitors blockchain events and automatically processes cross-chain transactions.

## Architecture

| Component | Description | Deployment |
|-----------|-------------|------------|
| Frontend | Next.js web app for bridge UI | Vercel |
| Relayer | Node.js service that watches events and relays transactions | Railway |
| Smart Contracts | Solidity contracts for locking/minting tokens | Sepolia & Base Sepolia |

## Deployed Contracts

| Contract | Chain | Address |
|----------|-------|---------|
| BridgeSource | Sepolia | `0x05b315e576cbd50a5d3f4313a00ba31be20e495d` |
| BridgeDestination | Base Sepolia | `0xe0af9d805d6cd555bd1e24627e6358ff45be9986` |
| wSepETH | Base Sepolia | `0xd70ca8b2bb138ced7cc886d123dfb6ac559d2ab0` |

## Tech Stack

- **Contracts:** Solidity 0.8.24, Foundry, OpenZeppelin
- **Frontend:** Next.js 16, React 19, Wagmi, Viem, Tailwind CSS
- **Relayer:** Node.js, Express, Viem, TypeScript

## Local Development

```bash
# Install dependencies
cd frontend && npm install
cd ../relayer && npm install

# Configure environment
cp frontend/.env.example frontend/.env.local
cp relayer/.env.example relayer/.env

# Run both services
./start.sh
```

## Smart Contract Commands

```bash
forge build    # Build contracts
forge test     # Run tests
forge fmt      # Format code
```
