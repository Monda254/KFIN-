import { Router, type IRouter } from "express";
import healthRouter from "./health";
import forensicsRouter from "./forensics";
import authRouter from "./auth";
import casesRouter from "./cases";
import evidenceRouter from "./evidence";
import dnaRouter from "./dna";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(casesRouter);
router.use(evidenceRouter);
router.use(dnaRouter);
router.use(forensicsRouter);

export default router;
