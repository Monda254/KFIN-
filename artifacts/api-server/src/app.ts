import express, { type Express } from "express";
import cors from "cors";
import pinoHttpModule from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import router from "./routes";
import { logger } from "./lib/logger";

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

export default app;
