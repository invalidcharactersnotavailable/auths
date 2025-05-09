import * as express from "express"
import type { Request, Response } from "express";
import { Router } from "express";
import { MongoClient } from "mongodb";
import * as config from "../../../config.json";
import * as jwt from "jsonwebtoken";

const client = new MongoClient(config.uri.mongodb);
const router = Router();

router.post("/", async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username) {
            return res.status(400).json({ message: "username is required" });
        }
        if (!password) {
            return res.status(400).json({ message: "password is required" });
        }

        await client.connect();
        const db = client.db(config.dbName);
        const users = db.collection(config.usersCollection);

        const user = await users.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "invalid username" });
        }
        if (user.password !== password) {
            return res.status(401).json({ message: "invalid password" });
        }
        const token = jwt.sign(
            { 
                uuid: user.uuid,
                username: user.username
            },
            config.secret,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: "login successful", token: token }).redirect("/user/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "internal server error" });
    } finally {
        await client.close();
    }
});

export default router;