import express, { Application, Request, Response } from "express";
const app: Application = express();
import dotenv from "dotenv";
import { pool } from "./db/index.js";
import { userRoute } from "./modules/user/user.routes.js";
import { issueRoute } from "./modules/issues/issue.routes.js";

dotenv.config();
app.use(express.json());

app.use(express.text());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server ",
    author: "Asif",
  });
});


app.use('/api/auth/signup', userRoute);
app.use('/api/issues', issueRoute);




export default app
