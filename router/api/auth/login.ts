import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import * as config from "../../../config.json";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";

const client = new MongoClient(config.uri.mongodb);
const router = express.Router(); // Corrected: Use express.Router()

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
        const usersCollection = db.collection(config.usersCollection);

        const user = await usersCollection.findOne({ username });
        if (!user) {
            // It's good practice to close the connection if an early return happens
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(401).json({ message: "Invalid username or password" }); // Generic message
        }

        // Compare hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(401).json({ message: "Invalid username or password" }); // Generic message
        }

        const token = jwt.sign(
            { 
                uuid: user.uuid,
                username: user.username
            },
            config.secret,
            { expiresIn: '24h' }
        );
        // Removed .redirect("/user/dashboard") as it's an API endpoint returning JSON.
        res.status(200).json({ message: "Login successful"}).cookie("token", token, { maxAge: 86400000, httpOnly: true });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            await client.close();
        }
    }
});

export default router;
