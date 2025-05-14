import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as config from "../config.json";

interface AuthenticatedRequest extends Request {
    user?: { uuid: string; username: string };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check for token in both cookie and Authorization header
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader && authHeader.split(" ")[1];
    const cookieToken = req.cookies?.token;
    
    const token = bearerToken || cookieToken;
    const isApiRoute = req.path.startsWith('/api/');

    if (!token) {
        if (isApiRoute) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        return res.redirect('/auth/login');
    }

    jwt.verify(token, config.secret, (err: any, user: any) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                if (isApiRoute) {
                    return res.status(401).json({ message: "Unauthorized: Token expired" });
                }
                return res.redirect('/auth/login');
            }
            if (isApiRoute) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }
            return res.redirect('/auth/login');
        }

        req.user = user as { uuid: string; username: string };
        next();
    });
};
