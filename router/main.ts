import express from "express";
import apiRouter from "./api/main";
import user from "./user/main";
const router = express.Router();

router.use("/api", apiRouter);
router.use("/user", user);

export default router;
