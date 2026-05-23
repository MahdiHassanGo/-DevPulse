import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/index.js";
import { pool } from "../db/index.js";
import { ROLES } from "../types/index.js";

// Higher-order function: accepts allowed roles and returns the actual middleware
const auth = (...roles: ROLES[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = req.headers.authorization;

            // Reject if no token is provided in the Authorization header
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized Access",
                });
                return;
            }

            // Verify signature and expiry — throws if invalid or expired
            const decoded = jwt.verify(
                token as string,
                config.access_token_secret as string
            ) as JwtPayload;

            // Confirm the user from the token still exists in the DB
            const userData = await pool.query(
                `SELECT * FROM users WHERE id = $1`,
                [decoded.id]
            );

            if (userData.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            const user = userData.rows[0];

            // If specific roles were passed, verify the user's role is allowed
            if (roles.length && !roles.includes(user.role as ROLES)) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden Access",
                });
                return;
            }

            // Attach decoded JWT payload to req.user for downstream use
            req.user = decoded;
            next();
        } catch (error: unknown) {
            // Passes JWT errors (TokenExpiredError, JsonWebTokenError) to global handler
            next(error);
        }
    };
};

export default auth;
