import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pinoHttpModule from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import router from "./routes";
import { logger } from "./lib/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pinoHttp = (
  typeof pinoHttpModule === "function"
    ? pinoHttpModule
    : (pinoHttpModule as any).default || (pinoHttpModule as any).pinoHttp || pinoHttpModule
);

const app: Express = express();

app.use(
  (pinoHttp as any)({
    logger,
    serializers: {
      req(req: IncomingMessage & { id?: unknown }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(path.resolve(__dirname, "../public/index.html"), (err) => {
    if (err) {
      res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>KFIN API Server</title><style>body{background:#090d16;color:#f3f4f6;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}h1{color:#06b6d4;}</style></head><body><div style="text-align:center;"><h1>KFIN API Gateway</h1><p>Status: OPERATIONAL</p><p><a href="/api/healthz" style="color:#38bdf8;">/api/healthz</a></p></div></body></html>`);
    }
  });
});

export default app;
