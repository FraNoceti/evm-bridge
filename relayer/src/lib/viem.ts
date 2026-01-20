import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, baseSepolia } from "viem/chains";
import { config } from "../config";

export const relayerAccount = privateKeyToAccount(config.relayerPrivateKey);

export const sepoliaPublic = createPublicClient({
  chain: sepolia,
  transport: http(config.sepoliaRpc),
});

export const sepoliaWallet = createWalletClient({
  account: relayerAccount,
  chain: sepolia,
  transport: http(config.sepoliaRpc),
});

export const baseSepoliaPublic = createPublicClient({
  chain: baseSepolia,
  transport: http(config.baseSepoliaRpc),
});

export const baseSepoliaWallet = createWalletClient({
  account: relayerAccount,
  chain: baseSepolia,
  transport: http(config.baseSepoliaRpc),
});
