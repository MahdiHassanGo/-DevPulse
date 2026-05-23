import { Request, Response } from "express";
import { authService } from "./auth.service.js";

const loginUser = async (req: Request, res: Response) => {
   
    try {
        
        const result = await authService.loginUserIntoDB(req.body)
        res.status(200).json({
             success: true,
             message: "Login successful",
             data: result,
        });
    } catch (error:any) {
        res.status(500).json({
            success: false,
            message: "Login failed",
            errors: error,
        });
    }
}

export const authController ={
    loginUser
}