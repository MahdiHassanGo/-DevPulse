import { Request, Response, Router } from "express";
import { pool } from "../../db/index.js";
import { userController } from "./user.controller.js";

const router = Router()

router.post("/signup",userController.createUser);
export const userRoute= router