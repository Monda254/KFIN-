import { Router, type IRouter } from "express";
import healthRouter from "./health";
import forensicsRouter from "./forensics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(forensicsRouter);

export default router;
