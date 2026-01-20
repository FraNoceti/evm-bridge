export const bridgeSourceAbi = [
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
  {
    type: "function",
    name: "unlockEth",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "sourceNonce", type: "uint256" },
      { name: "sourceChainId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const bridgeDestAbi = [
  {
    type: "event",
    name: "TokensBurned",
    inputs: [
      { name: "wrappedToken", type: "address", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
      { name: "destinationChainId", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "mintTokens",
    inputs: [
      { name: "sourceToken", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "sourceNonce", type: "uint256" },
      { name: "sourceChainId", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
