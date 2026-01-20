import { Request, Response } from "express";
import { statusService } from "../services/status.service";
import { retryService } from "../services/retry.service";

export function getStatus(req: Request<{ txHash: string }>, res: Response): void {
  const { txHash } = req.params;
  const status = statusService.get(txHash);
  res.json(status);
}

export function getHealth(_req: Request, res: Response): void {
  res.json({ ok: true, timestamp: Date.now() });
}

export function getRetryQueue(_req: Request, res: Response): void {
  const queue = retryService.getQueueStatus();
  res.json(queue);
}
