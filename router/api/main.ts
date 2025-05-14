import express from "express";
import authRouter from "./auth/main";
import userRouter from "./user/main";
const router = express.Router();

router.use("/user", userRouter);
router.use("/auth", authRouter);

export default router;
