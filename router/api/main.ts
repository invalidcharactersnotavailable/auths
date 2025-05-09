import * as express from "express"
import * as auth from "./auth/main"
import * as user from "./user/main"
const router = express.Router()

router.use("/user", user)
router.use("/auth", auth)

export default router