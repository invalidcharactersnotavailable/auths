import * as express from "express"
import * as api from "./api/main"
const router = express.Router()

router.use("/api", api)

export default router