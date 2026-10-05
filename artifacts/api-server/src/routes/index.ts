import { Router, type IRouter } from "express";
import healthRouter from "./health";
import forensicsRouter from "./forensics";
import authRouter from "./auth";
import casesRouter from "./cases";
import evidenceRouter from "./evidence";
import dnaRouter from "./dna";
import kinshipRouter from "./kinship";
import intelligenceRouter from "./intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(casesRouter);
router.use(evidenceRouter);
router.use(dnaRouter);
router.use(kinshipRouter);
router.use(intelligenceRouter);
router.use(forensicsRouter);

export default router;
