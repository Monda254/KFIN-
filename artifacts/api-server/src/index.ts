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
