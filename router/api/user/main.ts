import express from "express"; // Corrected import
import changePasswordRouter from "./changePassword";
import changeUsernameRouter from "./changeUsername";
import deleteAccountRouter from "./deleteAccount";
const router = express.Router();

router.use("/changePassword", changePasswordRouter);
router.use("/changeUsername", changeUsernameRouter);
router.use("/deleteAccount", deleteAccountRouter);

export default router;
