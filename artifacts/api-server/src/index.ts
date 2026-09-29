import express from "express";
import app from "./app";
import { logger } from "./lib/logger";

try {
  process.loadEnvFile();
} catch {
  // local .env optional
}
try {
  process.loadEnvFile("../../.env");
} catch {
  // root .env optional
}

const isServerless = Boolean(process.env["VERCEL"] || process.env["AWS_LAMBDA_FUNCTION_NAME"]);

if (!isServerless && process.env["NODE_ENV"] !== "test") {
  const rawPort = process.env["PORT"] ?? "5000";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

export default app;
