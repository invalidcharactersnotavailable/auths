import express from "express"; // Corrected import
import { Request, Response, NextFunction } from "express";
import { port, hostname } from "./config.json";
import mainRouter from "./router/main";
import cookieParser from "cookie-parser";

const app = express();

// Set view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// Mount the main router
app.use("/", mainRouter);

// Centralized Error Handling Middleware
interface HttpError extends Error {
    status?: number;
}

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    console.error("[Global Error Handler]:", err.stack || err);

    const statusCode = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        status: "error",
        statusCode: statusCode,
        message: message,
    });
});

app.listen(port, hostname, () => {
    console.log(`Server listening on http://${hostname}:${port}`);
});

export default app;
