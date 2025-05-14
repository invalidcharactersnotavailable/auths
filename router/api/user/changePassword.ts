import express, { Request, Response } from "express"; // Corrected import
import { MongoClient, ObjectId } from "mongodb";
import * as config from "../../../config.json";
import * as bcrypt from "bcrypt";
import { authenticateToken } from "../../../middleware/authenticateToken";

interface AuthenticatedRequest extends Request {
    user?: { uuid: string; username: string };
}

const client = new MongoClient(config.uri.mongodb);
const router = express.Router(); // Corrected: Use express.Router()
const saltRounds = 10;

router.put("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userUUID = req.user?.uuid;

        if (!userUUID) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated" });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        if (newPassword.length < 8 || newPassword.length > 32) {
            return res.status(400).json({ message: "New password must be between 8-32 characters" });
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

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(401).json({ message: "Invalid current password" });
        }
        
        if (await bcrypt.compare(newPassword, user.password)) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(400).json({ message: "New password cannot be the same as the old password" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        const currentTime = Date.now();

        const result = await usersCollection.updateOne(
            { uuid: userUUID },
            { 
                $set: {
                    password: hashedNewPassword,
                    lastPasswordChange: currentTime
                }
            }
        );

        if (result.modifiedCount === 0) {
            if (client && client.topology && client.topology.isConnected()) {
                await client.close();
            }
            return res.status(500).json({ message: "Failed to update password, please try again." });
        }

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        if (client && client.topology && client.topology.isConnected()) {
            await client.close();
        }
    }
});

export default router;
