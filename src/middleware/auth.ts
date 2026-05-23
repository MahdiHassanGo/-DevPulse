import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config/index.js";
import { pool } from "../db/index.js";
import { ROLES } from "../types/index.js";

const auth = (...roles: ROLES[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = req.headers.authorization;

            if (!token) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized Access",
                });
                return;
            }

            const decoded = jwt.verify(
                token as string,
                config.access_token_secret as string
            ) as JwtPayload;

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

            if (roles.length && !roles.includes(user.role as ROLES)) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden Access",
                });
                return;
            }

            req.user = decoded;
            next();
        } catch (error: unknown) {
            next(error);
        }
    };
};

export default auth;
