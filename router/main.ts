import express from "express"; // Corrected import
import apiRouter from "./api/main";
const router = express.Router();

router.use("/api", apiRouter);

export default router;
