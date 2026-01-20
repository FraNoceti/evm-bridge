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
  app.use(statusRoutes);

  await startEventWatchers();

  app.listen(config.port, () => {
    console.log(`HTTP server running on port ${config.port}\n`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
