import { createWalletClient, createPublicClient, http, formatEther, zeroAddress, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, baseSepolia } from "viem/chains";
import { readFileSync } from "fs";
import "dotenv/config";

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL!;

if (!RELAYER_PRIVATE_KEY) {
  console.error("Error: RELAYER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

// Load deployment info
const deployment = JSON.parse(readFileSync("deployment.json", "utf-8"));

// Load ABIs
const bridgeSourceAbi = JSON.parse(
  readFileSync("../out/BridgeSource.sol/BridgeSource.json", "utf-8")
).abi;
const bridgeDestAbi = JSON.parse(
  readFileSync("../out/BridgeDestination.sol/BridgeDestination.json", "utf-8")
).abi;

const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);

// Setup clients
const sepoliaPublic = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC),
});
const sepoliaWallet = createWalletClient({
  account: relayerAccount,
  chain: sepolia,
  transport: http(SEPOLIA_RPC),
});

const baseSepoliaPublic = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
});
const baseSepoliaWallet = createWalletClient({
  account: relayerAccount,
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
});

// Track processed events to avoid duplicates
const processedLocks = new Set<string>();
const processedBurns = new Set<string>();

async function handleEthLocked(log: any) {
  const eventId = `${log.transactionHash}-${log.logIndex}`;
  if (processedLocks.has(eventId)) return;
  processedLocks.add(eventId);

  const { sender, recipient, amount, nonce, destinationChainId } = log.args;

  console.log("\n[SEPOLIA] EthLocked event detected!");
  console.log(`  Sender: ${sender}`);
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${formatEther(amount)} ETH`);
  console.log(`  Nonce: ${nonce}`);
  console.log(`  Destination Chain: ${destinationChainId}`);
  console.log(`  TX: https://sepolia.etherscan.io/tx/${log.transactionHash}`);

  // Mint wrapped tokens on Base Sepolia
  console.log("\n[RELAYER] Minting wSepETH on Base Sepolia...");

  try {
    const mintTxHash = await baseSepoliaWallet.writeContract({
      address: deployment.baseSepolia.bridgeDestination as `0x${string}`,
      abi: bridgeDestAbi,
      functionName: "mintTokens",
      args: [zeroAddress, recipient, amount, nonce, BigInt(sepolia.id)],
    });

    console.log(`  TX sent: ${mintTxHash}`);
    const receipt = await baseSepoliaPublic.waitForTransactionReceipt({ hash: mintTxHash });
    console.log(`  Status: ${receipt.status === "success" ? "SUCCESS" : "FAILED"}`);
    console.log(`  View: https://sepolia.basescan.org/tx/${mintTxHash}`);
  } catch (error: any) {
    console.log(`  ERROR: ${error.message}`);
  }
}

async function handleTokensBurned(log: any) {
  const eventId = `${log.transactionHash}-${log.logIndex}`;
  if (processedBurns.has(eventId)) return;
  processedBurns.add(eventId);

  const { wrappedToken, sender, recipient, amount, nonce, destinationChainId } = log.args;

  console.log("\n[BASE SEPOLIA] TokensBurned event detected!");
  console.log(`  Wrapped Token: ${wrappedToken}`);
  console.log(`  Sender: ${sender}`);
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${formatEther(amount)} wSepETH`);
  console.log(`  Nonce: ${nonce}`);
  console.log(`  Destination Chain: ${destinationChainId}`);
  console.log(`  TX: https://sepolia.basescan.org/tx/${log.transactionHash}`);

  // Unlock ETH on Sepolia
  console.log("\n[RELAYER] Unlocking ETH on Sepolia...");

  try {
    const unlockTxHash = await sepoliaWallet.writeContract({
      address: deployment.sepolia.bridgeSource as `0x${string}`,
      abi: bridgeSourceAbi,
      functionName: "unlockEth",
      args: [recipient, amount, nonce, BigInt(baseSepolia.id)],
    });

    console.log(`  TX sent: ${unlockTxHash}`);
    const receipt = await sepoliaPublic.waitForTransactionReceipt({ hash: unlockTxHash });
    console.log(`  Status: ${receipt.status === "success" ? "SUCCESS" : "FAILED"}`);
    console.log(`  View: https://sepolia.etherscan.io/tx/${unlockTxHash}`);
  } catch (error: any) {
    console.log(`  ERROR: ${error.message}`);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  EVM Bridge Relayer");
  console.log("=".repeat(60));
  console.log(`\nRelayer address: ${relayerAccount.address}`);
  console.log(`\nWatching for events...`);
  console.log(`  - BridgeSource (Sepolia): ${deployment.sepolia.bridgeSource}`);
  console.log(`  - BridgeDestination (Base Sepolia): ${deployment.baseSepolia.bridgeDestination}`);
  console.log("\nPress Ctrl+C to stop\n");
  console.log("-".repeat(60));

  // Watch for EthLocked events on Sepolia
  sepoliaPublic.watchContractEvent({
    address: deployment.sepolia.bridgeSource as `0x${string}`,
    abi: bridgeSourceAbi,
    eventName: "EthLocked",
    onLogs: (logs) => {
      for (const log of logs) {
        handleEthLocked(log);
      }
    },
  });

  // Watch for TokensBurned events on Base Sepolia
  baseSepoliaPublic.watchContractEvent({
    address: deployment.baseSepolia.bridgeDestination as `0x${string}`,
    abi: bridgeDestAbi,
    eventName: "TokensBurned",
    onLogs: (logs) => {
      for (const log of logs) {
        handleTokensBurned(log);
      }
    },
  });

  // Keep the process running
  await new Promise(() => {});
}

main().catch(console.error);
