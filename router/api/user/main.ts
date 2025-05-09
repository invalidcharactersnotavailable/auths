import * as express from "express"
import * as changePassword from "./changePassword"
import * as changeUsername from "./changeUsername"
import * as deleteAccount from "./deleteAccount"
const router = express.Router()

router.use("/changePassword", changePassword)
router.use("/changeUsername", changeUsername)
router.use("/deleteAccount", deleteAccount)

export default router