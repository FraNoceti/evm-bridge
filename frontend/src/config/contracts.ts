import { sepolia, baseSepolia } from "wagmi/chains";

export const CONTRACTS = {
  bridgeSource: {
    address: "0x05b315e576cbd50a5d3f4313a00ba31be20e495d" as const,
    chainId: sepolia.id,
  },
  bridgeDestination: {
    address: "0xe0af9d805d6cd555bd1e24627e6358ff45be9986" as const,
    chainId: baseSepolia.id,
  },
  wrappedToken: {
    address: "0xd70ca8b2bb138ced7cc886d123dfb6ac559d2ab0" as const,
    chainId: baseSepolia.id,
  },
} as const;

export const BRIDGE_SOURCE_ABI = [
  {
    type: "function",
    name: "lockEth",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "destinationChainId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "event",
    name: "EthLocked",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
      { name: "destinationChainId", type: "uint256", indexed: false },
    ],
  },
] as const;

export const BRIDGE_DESTINATION_ABI = [
  {
    type: "function",
    name: "burnTokens",
    inputs: [
      { name: "wrappedToken", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "destinationChainId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "TokensBurned",
    inputs: [
      { name: "wrappedToken", type: "address", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
      { name: "destinationChainId", type: "uint256", indexed: false },
    ],
  },
] as const;

export const WRAPPED_TOKEN_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;
