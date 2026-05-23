import { NextFunction, Request, Response } from "express";

// Centralized error handler — catches anything passed via next(error)
// Must have 4 parameters for Express to recognize it as an error handler
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
