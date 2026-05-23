import { Response } from "express"

type TResponse<T> = {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    error?: unknown;
}

const sendResponse = <T>(res: Response, data: TResponse<T>): void => {
    res.status(data.statusCode).json({
        success: data.success,
        message: data.message,
        data: data.data,
        errors: data.error
    })
}

export default sendResponse
