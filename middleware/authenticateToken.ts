import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as config from "../config.json";

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
    user?: { uuid: string; username: string }; // Add other user properties if needed from token
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, config.secret, (err: any, user: any) => {
        if (err) {
            // Differentiate between token expiration and other errors if needed
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized: Token expired" });
            }
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        // Token is valid, attach user payload to request object
        // Ensure the payload structure matches what you sign in login.ts
        req.user = user as { uuid: string; username: string }; 
        next();
    });
};
