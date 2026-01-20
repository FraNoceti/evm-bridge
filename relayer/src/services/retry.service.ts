import { formatEther, zeroAddress, type Hash, type Address } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { config } from "../config";
import { bridgeSourceAbi, bridgeDestAbi } from "../constants/abis";
import {
  sepoliaPublic,
  sepoliaWallet,
  baseSepoliaPublic,
  baseSepoliaWallet,
} from "../lib/viem";
import { statusService } from "./status.service";

interface FailedMint {
  type: "mint";
  sourceTxHash: string;
  recipient: Address;
  amount: bigint;
  nonce: bigint;
  attempts: number;
  lastError: string;
  createdAt: number;
}

interface FailedUnlock {
  type: "unlock";
  sourceTxHash: string;
  recipient: Address;
  amount: bigint;
  nonce: bigint;
  attempts: number;
  lastError: string;
  createdAt: number;
}

type FailedOperation = FailedMint | FailedUnlock;

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_INTERVAL = 30_000; // 30 seconds
const TX_TIMEOUT = 90_000; // 90 seconds

class RetryService {
  private queue: FailedOperation[] = [];
  private isProcessing = false;

  constructor() {
    // Start retry loop
    setInterval(() => this.processQueue(), RETRY_INTERVAL);
  }

  addFailedMint(sourceTxHash: string, recipient: Address, amount: bigint, nonce: bigint, error: string): void {
    // Check if already in queue
    if (this.queue.find((op) => op.sourceTxHash === sourceTxHash)) {
      return;
    }

    console.log(`\n[RETRY] Added failed mint to retry queue: ${sourceTxHash}`);
    this.queue.push({
      type: "mint",
      sourceTxHash,
      recipient,
      amount,
      nonce,
      attempts: 1,
      lastError: error,
      createdAt: Date.now(),
    });
  }

  addFailedUnlock(sourceTxHash: string, recipient: Address, amount: bigint, nonce: bigint, error: string): void {
    // Check if already in queue
    if (this.queue.find((op) => op.sourceTxHash === sourceTxHash)) {
      return;
    }

    console.log(`\n[RETRY] Added failed unlock to retry queue: ${sourceTxHash}`);
    this.queue.push({
      type: "unlock",
      sourceTxHash,
      recipient,
      amount,
      nonce,
      attempts: 1,
      lastError: error,
      createdAt: Date.now(),
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Process oldest item first
    const operation = this.queue[0];

    console.log(`\n[RETRY] Processing ${operation.type} for ${operation.sourceTxHash} (attempt ${operation.attempts + 1}/${MAX_RETRY_ATTEMPTS})`);

    try {
      if (operation.type === "mint") {
        await this.retryMint(operation);
      } else {
        await this.retryUnlock(operation);
      }

      // Success - remove from queue
      this.queue.shift();
      console.log(`[RETRY] Success! Removed from queue. ${this.queue.length} items remaining.`);
    } catch (error: any) {
      operation.attempts++;
      operation.lastError = error.message;

      if (operation.attempts >= MAX_RETRY_ATTEMPTS) {
        console.error(`[RETRY] Max attempts reached for ${operation.sourceTxHash}. Giving up.`);
        this.queue.shift();
        statusService.setFailed(operation.sourceTxHash, `Failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`);
      } else {
        console.log(`[RETRY] Failed: ${error.message}. Will retry in ${RETRY_INTERVAL / 1000}s`);
        // Move to end of queue
        this.queue.shift();
        this.queue.push(operation);
      }
    }

    this.isProcessing = false;
  }

  private async retryMint(op: FailedMint): Promise<void> {
    console.log(`  Minting ${formatEther(op.amount)} wSepETH to ${op.recipient}...`);

    const mintTxHash = await baseSepoliaWallet.writeContract({
      address: config.bridgeDestination,
      abi: bridgeDestAbi,
      functionName: "mintTokens",
      args: [zeroAddress, op.recipient, op.amount, op.nonce, BigInt(sepolia.id)],
    });

    console.log(`  TX sent: ${mintTxHash}`);

    const receipt = await baseSepoliaPublic.waitForTransactionReceipt({
      hash: mintTxHash,
      timeout: TX_TIMEOUT,
    });

    if (receipt.status !== "success") {
      throw new Error("Transaction reverted");
    }

    console.log(`  View: https://sepolia.basescan.org/tx/${mintTxHash}`);
    statusService.setComplete(op.sourceTxHash, mintTxHash);
  }

  private async retryUnlock(op: FailedUnlock): Promise<void> {
    console.log(`  Unlocking ${formatEther(op.amount)} ETH to ${op.recipient}...`);

    const unlockTxHash = await sepoliaWallet.writeContract({
      address: config.bridgeSource,
      abi: bridgeSourceAbi,
      functionName: "unlockEth",
      args: [op.recipient, op.amount, op.nonce, BigInt(baseSepolia.id)],
    });

    console.log(`  TX sent: ${unlockTxHash}`);

    const receipt = await sepoliaPublic.waitForTransactionReceipt({
      hash: unlockTxHash,
      timeout: TX_TIMEOUT,
    });

    if (receipt.status !== "success") {
      throw new Error("Transaction reverted");
    }

    console.log(`  View: https://sepolia.etherscan.io/tx/${unlockTxHash}`);
    statusService.setComplete(op.sourceTxHash, unlockTxHash);
  }

  getQueueStatus(): { count: number; items: FailedOperation[] } {
    return { count: this.queue.length, items: [...this.queue] };
  }
}

export const retryService = new RetryService();
