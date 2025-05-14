import express from "express";
import settings from "./settings";
const router = express.Router();

router.use("/settings", settings);

export default router;
