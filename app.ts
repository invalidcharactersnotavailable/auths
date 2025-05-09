import * as express from "express"
import { port, hostname } from "./config.json"
import * as main from "./router/main"
const app = express()

app.use("/", main)

app.listen(port, hostname, () => {
    console.log(`listening on ${hostname}:${port}`)
})