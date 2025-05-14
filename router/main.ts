import express from "express";
import apiRouter from "./api/main";
import user from "./user/main";
import auth from "./auth/main";
const router = express.Router();

router.use("/api", apiRouter);
router.use("/user", user);
router.use("/auth", auth);

export default router;
