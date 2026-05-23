import { NextFunction, Request, Response } from "express";

const globalErrorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const message = error instanceof Error ? error.message : "Internal server error";

    res.status(500).json({
        success: false,
        message,
        errors: error,
    });
};

export default globalErrorHandler;
