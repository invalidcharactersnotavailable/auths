import express, { Request, Response } from "express"; // Corrected import
import { MongoClient } from "mongodb";
import * as config from "../../../config.json";
import * as bcrypt from "bcrypt";
import { authenticateToken } from "../../../middleware/authenticateToken";

interface AuthenticatedRequest extends Request {
    user?: { uuid: string; username: string };
}

const client = new MongoClient(config.uri.mongodb);
const router = express.Router(); // Corrected: Use express.Router()

router.put("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { newUsername, password } = req.body;
        const userUUID = req.user?.uuid;

        if (!userUUID) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated" });
        }

        if (!newUsername || !password) {
            return res.status(400).json({ message: "New username and current password are required" });
        }

        if (newUsername.length < 3 || newUsername.length > 32) {
            return res.status(400).json({ message: "New username must be between 3-32 characters" });
        }

        await client.connect();
        const database = client.db(config.dbName);
        const usersCollection = database.collection(config.usersCollection);

        const currentUser = await usersCollection.findOne({ uuid: userUUID });

        if (!currentUser) {
            // It's good practice to close the connection if an early return happens
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordMatch = await bcrypt.compare(password, currentUser.password);
        if (!isPasswordMatch) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(401).json({ message: "Invalid current password" });
        }

        if (newUsername === currentUser.username) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(400).json({ message: "New username cannot be the same as the current username" });
        }

        const existingUserWithNewUsername = await usersCollection.findOne({ username: newUsername });
        if (existingUserWithNewUsername) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(400).json({ message: "Username already taken" });
        }

        const currentTime = Date.now();

        const result = await usersCollection.updateOne(
            { uuid: userUUID },
            { 
                $set: {
                    username: newUsername,
                    lastUsernameChange: currentTime
                }
            }
        );

        if (result.modifiedCount === 0) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(500).json({ message: "Failed to update username, please try again." });
        }

        res.status(200).json({ message: "Username changed successfully" });

    } catch (error) {
        console.error("Error changing username:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            await client.close();
        }
    }
});

export default router;
