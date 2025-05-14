import express from "express";
import { authenticateToken } from "../../middleware/authenticateToken";

const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
    res.render("user/settings");
});

export default router;
