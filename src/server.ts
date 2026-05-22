import express, { Application, Request, Response } from "express";
import { Pool } from "pg";
const app: Application = express();
import dotenv from "dotenv";

dotenv.config();
app.use(express.json());

app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
connectionString: process.env.CONNECTION,
});
const initDB = async () => {
  try {
    await pool.query(`
       CREATE TABLE IF NOT EXISTS users(
       id SERIAL PRIMARY KEY,
       name VARCHAR(100) NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       password TEXT NOT NULL,
       role VARCHAR(20) NOT NULL DEFAULT 'contributor'
       CHECK(role IN ('contributor', 'maintainer')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
            `);
    console.log("Database connection Succesfull");
  } catch (error) {
    console.log(error);
  }
};
initDB();
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server ",
    author: "Asif",
  });
});

app.post("/", async (req: Request, res: Response) => {
  console.log(req.body);
  const { name, email, password,role } = req.body;
 try{
   const result = await pool.query(`
  INSERT INTO users(name,email,password,role)
  VALUES ($1,$2,$3,$4)
  RETURNING name,email,role  
    `,[name,email,password,role])
    console.log()
  res.status(201).json({
    message: "User Created",
    data: result.rows[0],
  });

 }catch(error:any){
res.status(500).json({
    message: error.message,
    error:error,
  });
 }
});

app.listen(5000, () => {
  console.log("Server is running at port 5000");
});
