import * as express from "express"
import * as register from "./register"
import * as login from "./login"
const router = express.Router()

router.use("/register", register)
router.use("/login", login)

export default router