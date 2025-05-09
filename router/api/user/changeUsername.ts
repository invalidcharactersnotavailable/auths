import * as express from "express"
const router = express.Router()

router.put("/", (req, res) => {
    try {
        
    } catch (error) {
        return (
            console.error(error),
            res.status(500).json({ message: "internal server error" })
        )
    };
})

export default router