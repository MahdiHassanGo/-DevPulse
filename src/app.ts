import express, { Application, Request, Response } from "express";
const app: Application = express();
import dotenv from "dotenv";
import { pool } from "./db/index.js";
import { userRoute } from "./modules/user/user.routes.js";
import { issueRoute } from "./modules/issues/issue.routes.js";
import { authRoute } from "./modules/auth/auth.route.js";
import fs from "fs"
import cors from "cors"
import CookieParser from "cookie-parser"
import logger from "./middleware/logger.js";
dotenv.config();
app.use(express.json());
app.use(CookieParser())
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server ",
    author: "Asif",
  });
});

const corsOptions = {
  origin: 'http://localhost:5000/',

}
app.use(cors(corsOptions))
app.use('/api/user', userRoute);
app.use('/api/issues', issueRoute);
app.use('/api/auth',authRoute );




export default app
