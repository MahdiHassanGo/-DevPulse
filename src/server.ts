import express, { Application, Request, Response } from "express";
import { Pool } from "pg";
const app: Application = express();
import dotenv from "dotenv";
import config from "./config/index.js";

dotenv.config();
app.use(express.json());

app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: config.connection_string,
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

app.post("/api/auth/signup", async (req: Request, res: Response) => {
  console.log(req.body);
  const { name, email, password, role } = req.body;
  try {
    const result = await pool.query(
      `
  INSERT INTO users(name,email,password,role)
  VALUES ($1,$2,$3,$4)
  RETURNING name,email,role  
    `,
      [name, email, password, role],
    );
    console.log();
    res.status(201).json({
      message: "User Created",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
});

app.get("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
    SELECT * FROM users
  `);
    res.status(200).json({
      success: true,
      message: "Users retrived succesfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

app.get("/api/auth/signup/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
   SELECT * FROM users WHERE id=$1 
  

  `,
      [id],
    );

    if (result.rows.length == 0) {
      res.status(404).json({
        success: false,
        message: "User not found ",
        data: {},
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User  found ",
        data: result.rows[0],
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

app.put("/api/auth/signup/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, password, role } = req.body;

    const result = await pool.query(
      `
      UPDATE users 
      SET 
      name=COALESCE($1,name),
      password=COALESCE($2,password), 
      role=COALESCE($3,role)
      WHERE id=$4
      RETURNING *
      `,
      [name, password, role, id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
        data: {},
      });
    }

    res.status(200).json({
      success: true,
      message: "User Updated",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});

app.delete("/api/auth/signup/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
       res.status(404).json({
        success: false,
        message: "User not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "User Deleted",
      data: {},
    });

  } catch (error: any) {
     res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
});
app.listen(5000, () => {
  console.log("Server is running at port 5000");
});
