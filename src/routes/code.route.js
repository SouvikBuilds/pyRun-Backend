import { runCode, checkErrors } from "../controllers/code.controller.js";
import express, { Router } from "express";
const router = Router();

router.route("/run").post(runCode);
router.route("/check").post(checkErrors);
export default router;
