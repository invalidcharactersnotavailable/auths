import { randomUUIDv7 } from "bun";
import * as config from "../../../config.json";
import { MongoClient } from "mongodb";
import * as express from "express";

const client = new MongoClient(config.uri.mongodb);
const router = express.Router();
router.post("/", async(req, res) => {
    try {
        const { username, password } = req.body;
        if (!username) {
            return res.status(400).json({ message: "username is required" });
        }
        if (!password) {
            return res.status(400).json({ message: "password is required" });
        }
        if (username.length < 3 || username.length > 32) {
            return res.status(400).json({ message: "username must be between 3-32 characters" });
        }
        if (password.length < 8 || password.length > 32) {
            return res.status(400).json({ message: "password must be between 8-32 characters" });
        }

        const a = Date.now();
        const user = {
            uuid: randomUUIDv7("hex", a),
            username: username,
            password: password,
            createdOn: a
        };

        await client.connect();
        const database = client.db(config.dbName);
        const users = database.collection(config.usersCollection);

        const existingUser = await users.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "username already exists" });
        }

        await users.insertOne(user);
        res.status(201).json({ message: "user registered successfully" }).redirect("/auth/login");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "internal server error" });
    } finally {
        await client.close();
    }
})

export default router;