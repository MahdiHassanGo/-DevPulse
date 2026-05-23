import { Request, Response, Router } from "express";
import { pool } from "../../db/index.js";
import { userController } from "./user.controller.js";

const router = Router()
const auth = (res,req,next)=>{

}
router.post("/signup",userController.createUser);
export const userRoute= router