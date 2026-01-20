import { formatEther, zeroAddress, type Hash } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { config } from "../config";
import { bridgeSourceAbi, bridgeDestAbi } from "../constants/abis";
import {
  sepoliaPublic,
  sepoliaWallet,
  baseSepoliaPublic,
  baseSepoliaWallet,
  relayerAccount,
} from "../lib/viem";
import { statusService } from "./status.service";
import { retryService } from "./retry.service";

const processedLocks = new Set<string>();
const processedBurns = new Set<string>();

// Testnets can be slow - wait up to 3 minutes with retries
const TX_TIMEOUT = 60_000; // 60 seconds per attempt
const MAX_RETRIES = 3;

type WaitFn = (args: { hash: Hash; timeout: number }) => Promise<{ status: "success" | "reverted" }>;

async function waitForReceipt(waitFn: WaitFn, hash: Hash) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  Waiting for confirmation (attempt ${attempt}/${MAX_RETRIES})...`);
      const receipt = await waitFn({ hash, timeout: TX_TIMEOUT });
      return receipt;
    } catch (error: any) {
      if (error.message?.includes("Timed out") && attempt < MAX_RETRIES) {
        console.log(`  Timeout, retrying...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Transaction ${hash} not confirmed after ${MAX_RETRIES} attempts`);
}

async function handleEthLocked(log: any): Promise<void> {
  const eventId = `${log.transactionHash}-${log.logIndex}`;
  if (processedLocks.has(eventId)) return;
  processedLocks.add(eventId);

  const sourceTxHash = log.transactionHash as string;
  const { sender, recipient, amount, nonce } = log.args;

  statusService.setProcessing(sourceTxHash);

  console.log("\n[SEPOLIA] EthLocked event detected!");
  console.log(`  Sender: ${sender}`);
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${formatEther(amount)} ETH`);
  console.log(`  Nonce: ${nonce}`);
  console.log(`  TX: https://sepolia.etherscan.io/tx/${sourceTxHash}`);
  console.log("\n[RELAYER] Minting wSepETH on Base Sepolia...");

  try {
    const mintTxHash = await baseSepoliaWallet.writeContract({
      address: config.bridgeDestination,
      abi: bridgeDestAbi,
      functionName: "mintTokens",
      args: [zeroAddress, recipient, amount, nonce, BigInt(sepolia.id)],
    });

    console.log(`  TX sent: ${mintTxHash}`);
    const receipt = await waitForReceipt(
      (args) => baseSepoliaPublic.waitForTransactionReceipt(args),
      mintTxHash
    );
    const success = receipt.status === "success";
    console.log(`  Status: ${success ? "SUCCESS" : "FAILED"}`);
    console.log(`  View: https://sepolia.basescan.org/tx/${mintTxHash}`);

    if (success) {
      statusService.setComplete(sourceTxHash, mintTxHash);
    } else {
      statusService.setFailed(sourceTxHash, "Transaction reverted");
    }
  } catch (error: any) {
    console.error(`  ERROR: ${error.message}`);
    // AlreadyProcessed (0x57eee766) means mint succeeded previously - mark complete
    if (error.message?.includes("0x57eee766")) {
      console.log(`  Mint already processed - marking as complete`);
      statusService.setComplete(sourceTxHash, "already-processed");
    } else {
      retryService.addFailedMint(sourceTxHash, recipient, amount, nonce, error.message);
    }
  }
}

async function handleTokensBurned(log: any): Promise<void> {
  const eventId = `${log.transactionHash}-${log.logIndex}`;
  if (processedBurns.has(eventId)) return;
  processedBurns.add(eventId);

  const sourceTxHash = log.transactionHash as string;
  const { wrappedToken, sender, recipient, amount, nonce } = log.args;

  statusService.setProcessing(sourceTxHash);

  console.log("\n[BASE SEPOLIA] TokensBurned event detected!");
  console.log(`  Wrapped Token: ${wrappedToken}`);
  console.log(`  Sender: ${sender}`);
  console.log(`  Recipient: ${recipient}`);
  console.log(`  Amount: ${formatEther(amount)} wSepETH`);
  console.log(`  Nonce: ${nonce}`);
  console.log(`  TX: https://sepolia.basescan.org/tx/${sourceTxHash}`);
  console.log("\n[RELAYER] Unlocking ETH on Sepolia...");

  try {
    const unlockTxHash = await sepoliaWallet.writeContract({
      address: config.bridgeSource,
      abi: bridgeSourceAbi,
      functionName: "unlockEth",
      args: [recipient, amount, nonce, BigInt(baseSepolia.id)],
    });

    console.log(`  TX sent: ${unlockTxHash}`);
    const receipt = await waitForReceipt(
      (args) => sepoliaPublic.waitForTransactionReceipt(args),
      unlockTxHash
    );
    const success = receipt.status === "success";
    console.log(`  Status: ${success ? "SUCCESS" : "FAILED"}`);
    console.log(`  View: https://sepolia.etherscan.io/tx/${unlockTxHash}`);

    if (success) {
      statusService.setComplete(sourceTxHash, unlockTxHash);
    } else {
      statusService.setFailed(sourceTxHash, "Transaction reverted");
    }
  } catch (error: any) {
    console.error(`  ERROR: ${error.message}`);
    // AlreadyProcessed (0x57eee766) means unlock succeeded previously - mark complete
    if (error.message?.includes("0x57eee766")) {
      console.log(`  Unlock already processed - marking as complete`);
      statusService.setComplete(sourceTxHash, "already-processed");
    } else {
      retryService.addFailedUnlock(sourceTxHash, recipient, amount, nonce, error.message);
    }
  }
}

export async function startEventWatchers(): Promise<void> {
  const sepoliaBal = await sepoliaPublic.getBalance({ address: relayerAccount.address });
  const baseBal = await baseSepoliaPublic.getBalance({ address: relayerAccount.address });

  console.log("============================================================");
  console.log("  EVM Bridge Relayer");
  console.log("============================================================");
  console.log(`\nRelayer address: ${relayerAccount.address}`);
  console.log(`Sepolia balance: ${formatEther(sepoliaBal)} ETH`);
  console.log(`Base Sepolia balance: ${formatEther(baseBal)} ETH`);
  console.log(`\nWatching for events...`);
  console.log(`  - BridgeSource (Sepolia): ${config.bridgeSource}`);
  console.log(`  - BridgeDestination (Base Sepolia): ${config.bridgeDestination}`);
  console.log("------------------------------------------------------------");

  sepoliaPublic.watchContractEvent({
    address: config.bridgeSource,
    abi: bridgeSourceAbi,
    eventName: "EthLocked",
    onLogs: (logs) => logs.forEach(handleEthLocked),
  });

  baseSepoliaPublic.watchContractEvent({
    address: config.bridgeDestination,
    abi: bridgeDestAbi,
    eventName: "TokensBurned",
    onLogs: (logs) => logs.forEach(handleTokensBurned),
  });

  console.log("\nRelayer running. Waiting for bridge events...\n");
}
