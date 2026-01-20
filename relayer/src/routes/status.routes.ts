import { Router } from "express";
import { getStatus, getHealth, getRetryQueue } from "../controllers/status.controller";

const router = Router();

router.get("/health", getHealth);
router.get("/status/:txHash", getStatus);
router.get("/retry-queue", getRetryQueue);

export default router;
