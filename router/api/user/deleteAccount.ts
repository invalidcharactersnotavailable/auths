import express, { Request, Response } from "express"; // Corrected import
import { MongoClient } from "mongodb";
import * as config from "../../../config.json";
import * as bcrypt from "bcrypt";
import { authenticateToken } from "../../../middleware/authenticateToken";
import { randomBytes } from "crypto";

interface AuthenticatedRequest extends Request {
    user?: { uuid: string; username: string };
}

const client = new MongoClient(config.uri.mongodb);
const router = express.Router(); // Corrected: Use express.Router()
const DELETION_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// Step 1: Request account deletion
router.post("/delete-request", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userUUID = req.user?.uuid;
        if (!userUUID) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated" });
        }

        await client.connect();
        const database = client.db(config.dbName);
        const usersCollection = database.collection(config.usersCollection);

        const user = await usersCollection.findOne({ uuid: userUUID });
        if (!user) {
            // It's good practice to close the connection if an early return happens
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(404).json({ message: "User not found" });
        }

        const deletionToken = randomBytes(32).toString("hex");
        const deletionTokenExpiry = Date.now() + DELETION_TOKEN_EXPIRY_MS;

        await usersCollection.updateOne(
            { uuid: userUUID },
            { $set: { deletionToken, deletionTokenExpiry } }
        );

        res.status(200).json({
            message: `Account deletion initiated. Please confirm within ${DELETION_TOKEN_EXPIRY_MS / 60000} minutes. Use the provided token.`,
            confirmationToken: deletionToken
        });

    } catch (error) {
        console.error("Error requesting account deletion:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            await client.close();
        }
    }
});

// Step 2: Confirm account deletion
router.post("/delete-confirm", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { confirmationToken, password } = req.body;
        const userUUID = req.user?.uuid;

        if (!userUUID) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated" });
        }

        if (!confirmationToken || !password) {
            return res.status(400).json({ message: "Confirmation token and password are required" });
        }

        await client.connect();
        const database = client.db(config.dbName);
        const usersCollection = database.collection(config.usersCollection);

        const user = await usersCollection.findOne({ uuid: userUUID });

        if (!user) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(401).json({ message: "Invalid password" });
        }

        if (user.deletionToken !== confirmationToken) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(400).json({ message: "Invalid confirmation token" });
        }

        if (Date.now() > user.deletionTokenExpiry) {
            await usersCollection.updateOne({ uuid: userUUID }, { $unset: { deletionToken: "", deletionTokenExpiry: "" } });
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(400).json({ message: "Confirmation token expired. Please request deletion again." });
        }

        const deleteResult = await usersCollection.deleteOne({ uuid: userUUID });

        if (deleteResult.deletedCount === 0) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(500).json({ message: "Failed to delete account. Please try again." });
        }

        res.status(200).json({ message: "Account deleted successfully" });

    } catch (error) {
        console.error("Error confirming account deletion:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            await client.close();
        }
    }
});

export default router;
