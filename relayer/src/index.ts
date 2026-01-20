import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config";
import { startEventWatchers } from "./services/bridge.service";
import statusRoutes from "./routes/status.routes";

async function main(): Promise<void> {
  validateConfig();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Disable caching for all routes (status polling needs fresh data)
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  app.use(statusRoutes);

  // Start HTTP server FIRST (Railway needs this up quickly)
  await new Promise<void>((resolve) => {
    app.listen(config.port, "0.0.0.0", () => {
      console.log(`HTTP server running on port ${config.port}\n`);
      resolve();
    });
  });

  // Then start event watchers
  await startEventWatchers();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
