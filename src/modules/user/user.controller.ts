import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service.js";
import sendResponse from "../../utility/sendResponse.js";

const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await userService.createUserIntoDB(req.body);

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "User registered successfully",
            data: result.rows[0],
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const userController = {
    createUser,
};
