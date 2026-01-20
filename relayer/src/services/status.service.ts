import { TxStatus } from "../types";

class StatusService {
  private statusMap = new Map<string, TxStatus>();

  constructor() {
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(txHash: string, status: TxStatus): void {
    this.statusMap.set(txHash.toLowerCase(), status);
  }

  get(txHash: string): TxStatus {
    return this.statusMap.get(txHash.toLowerCase()) || { status: "pending", timestamp: Date.now() };
  }

  setProcessing(txHash: string): void {
    this.set(txHash, { status: "processing", timestamp: Date.now() });
  }

  setComplete(txHash: string, destTxHash: string): void {
    this.set(txHash, { status: "complete", destTxHash, timestamp: Date.now() });
  }

  setFailed(txHash: string, error: string): void {
    this.set(txHash, { status: "failed", error, timestamp: Date.now() });
  }

  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, value] of this.statusMap.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.statusMap.delete(key);
      }
    }
  }
}

export const statusService = new StatusService();
