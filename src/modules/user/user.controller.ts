import { Request, Response } from "express";
import { pool } from "../../db/index.js";
import { userService } from "./user.service.js";

const createUser = async (req: Request, res: Response) => {
  try {
   const result =await userService.createUserIntoDB(req.body)
    res.status(200).json({
      message: "User Created",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
}

export const userController={
    createUser,
}