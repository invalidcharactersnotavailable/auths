import { randomUUIDv7 } from "bun";
import * as config from "../../../config.json";
import { MongoClient } from "mongodb";
import express from "express";
import * as bcrypt from "bcrypt";

// Helper function to generate a random alphanumeric string of a given length
function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Helper function to generate a recovery key in xxx-xxxx-xxx format
function generateRecoveryKey(): string {
    return `${generateRandomString(3)}-${generateRandomString(4)}-${generateRandomString(3)}`;
}

const client = new MongoClient(config.uri.mongodb);
const router = express.Router();
const saltRounds = 10;

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

        const currentTime = Date.now();
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = {
            uuid: randomUUIDv7("hex", currentTime),
            username: username,
            password: hashedPassword,
            recoveryKeys: [generateRecoveryKey(), generateRecoveryKey(), generateRecoveryKey(), generateRecoveryKey(), generateRecoveryKey()],
            recoveryKeyUsed: false,
            recoveryKeyUsedCount: 0,
            recoveryKeyUsedAt: [null, null, null, null, null],
            createdOn: currentTime,
            lastPasswordChange: currentTime,
            lastUsernameChange: currentTime
        };

        await client.connect();
        const database = client.db(config.dbName);
        const users = database.collection(config.usersCollection);

        const existingUser = await users.findOne({ username });
        if (existingUser) {
            // It's good practice to close the connection if an early return happens
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(400).json({ message: "username already exists" });
        }

        await users.insertOne(user);
        res.status(201).json({ message: "user registered successfully" });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "internal server error" });
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            await client.close();
        }
    }
});

export default router;
