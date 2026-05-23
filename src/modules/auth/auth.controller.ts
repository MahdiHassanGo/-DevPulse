import { NextFunction, Request, Response } from "express";
import { DatabaseError } from "pg";
import { authService } from "./auth.service.js";
import { userService } from "../user/user.service.js";
import sendResponse from "../../utility/sendResponse.js";

const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, password, role } = req.body as {
        name: string;
        email: string;
        password: string;
        role: string;
    };

    if (!name || !email || !password) {
        res.status(400).json({
            success: false,
            message: "name, email, and password are required",
        });
        return;
    }

    if (role && !["contributor", "maintainer"].includes(role)) {
        res.status(400).json({
            success: false,
            message: "role must be contributor or maintainer",
        });
        return;
    }

    try {
        const result = await userService.createUserIntoDB(req.body);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "User registered successfully",
            data: result.rows[0],
        });
    } catch (error: unknown) {
        if (error instanceof DatabaseError && error.code === "23505") {
            res.status(400).json({
                success: false,
                message: "Email already exists",
                errors: error.detail,
            });
            return;
        }
        next(error);
    }
};

const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await authService.loginUserIntoDB(req.body);
        const { refreshToken, accessToken, user } = result;

        res.cookie("RefreshToken", refreshToken, {
            secure: false,
            httpOnly: true,
            sameSite: "lax",
        });

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Login successful",
            data: {
                token: accessToken,
                user,
            },
        });
    } catch (error: unknown) {
        next(error);
    }
};

const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await authService.generatedFreshToken(req.cookies.RefreshToken);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Token refreshed successfully",
            data: result,
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const authController = {
    signup,
    loginUser,
    refreshToken,
};
