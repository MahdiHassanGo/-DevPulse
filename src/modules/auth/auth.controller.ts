import { Request, Response } from "express";
import { authService } from "./auth.service.js";

const loginUser = async (req: Request, res: Response) => {
   
    try {
        
        const result = await authService.loginUserIntoDB(req.body)
      const {refreshToken}=result
      res.cookie("RefreshToken",refreshToken),{
        secure:false,
        httpOnly:true,
        sameSite:'lax'
      }
      
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

const refreshToken = async(req: Request, res: Response)=>{
 try {
        
        const result = await authService.generatedFreshToken(req.cookies.refreshToken,
            
        )
     
      
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
    loginUser,
    refreshToken
}