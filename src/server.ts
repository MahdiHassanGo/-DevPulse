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
            await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK(type IN ('bug', 'feature_request')),
        status VARCHAR(20) NOT NULL DEFAULT 'open'
          CHECK(status IN ('open', 'in_progress', 'resolved')),
        reporter_id INTEGER NOT NULL,
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
      [id],
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

app.post("/api/issues", async (req: Request, res: Response) => {
  const { title, description, type, reporter_id } = req.body;

  if (!title || !description || !type) {
    res.status(400).json({
      success: false,

      message: "title, description, and type are required",
    });

    return;
  }

  if (title.length > 150) {
    res.status(400).json({
      success: false,

      message: "title must not exceed 150 characters",
    });

    return;
  }

  if (description.length < 20) {
    res.status(400).json({
      success: false,

      message: "description must be at least 20 characters",
    });

    return;
  }

  if (!["bug", "feature_request"].includes(type)) {
    res.status(400).json({
      success: false,

      message: "type must be bug or feature_request",
    });

    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO issues(title, description, type, reporter_id)

       VALUES ($1, $2, $3, $4)

       RETURNING *`,

      [title, description, type, reporter_id],
    );

    res.status(201).json({
      success: true,

      message: "Issue created successfully",

      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,

      message: error.message,

      errors: error,
    });
  }
});

app.get("/api/issues", async (req: Request, res: Response) => {
  const { sort = "newest", type, status } = req.query;

  let query = `SELECT * FROM issues`;

  const conditions: string[] = [];

  const values: any[] = [];

  if (type) {
    values.push(type);

    conditions.push(`type = $${values.length}`);
  }

  if (status) {
    values.push(status);

    conditions.push(`status = $${values.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}`;

  try {
    const issuesResult = await pool.query(query, values);

    const issues = issuesResult.rows;

    if (issues.length === 0) {
      res.status(200).json({
        success: true,

        data: [],
      });

      return;
    }

    const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

    const reportersResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = ANY($1)`,

      [reporterIds],
    );

    const reporterMap: Record<number, any> = {};

    reportersResult.rows.forEach((r) => {
      reporterMap[r.id] = r;
    });

    const data = issues.map((issue) => {
      const { reporter_id, ...rest } = issue;

      return {
        ...rest,

        reporter: reporterMap[reporter_id] || null,
      };
    });

    res.status(200).json({
      success: true,

      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,

      message: error.message,

      errors: error,
    });
  }
});

app.get("/api/issues/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,

        message: "Issue not found",
      });

      return;
    }

    const issue = result.rows[0];

    const reporterResult = await pool.query(
      `SELECT id, name, role FROM users WHERE id = $1`,

      [issue.reporter_id],
    );

    const { reporter_id, ...rest } = issue;

    res.status(200).json({
      success: true,

      data: {
        ...rest,

        reporter: reporterResult.rows[0] || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,

      message: error.message,

      errors: error,
    });
  }
});

app.patch("/api/issues/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const { title, description, type, status } = req.body;

  if (title && title.length > 150) {
    res.status(400).json({
      success: false,

      message: "title must not exceed 150 characters",
    });

    return;
  }

  if (description && description.length < 20) {
    res.status(400).json({
      success: false,

      message: "description must be at least 20 characters",
    });

    return;
  }

  if (type && !["bug", "feature_request"].includes(type)) {
    res.status(400).json({
      success: false,

      message: "type must be bug or feature_request",
    });

    return;
  }

  if (status && !["open", "in_progress", "resolved"].includes(status)) {
    res.status(400).json({
      success: false,

      message: "status must be open, in_progress, or resolved",
    });

    return;
  }

  try {
    const existing = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
      id,
    ]);

    if (existing.rows.length === 0) {
      res.status(404).json({
        success: false,

        message: "Issue not found",
      });

      return;
    }

    const result = await pool.query(
      `UPDATE issues

       SET

         title       = COALESCE($1, title),

         description = COALESCE($2, description),

         type        = COALESCE($3, type),

         status      = COALESCE($4, status),

         updated_at  = CURRENT_TIMESTAMP

       WHERE id = $5

       RETURNING *`,

      [title, description, type, status, id],
    );

    res.status(200).json({
      success: true,

      message: "Issue updated successfully",

      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,

      message: error.message,

      errors: error,
    });
  }
});

app.delete("/api/issues/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM issues WHERE id = $1 RETURNING *`,

      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,

        message: "Issue not found",
      });

      return;
    }

    res.status(200).json({
      success: true,

      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,

      message: error.message,

      errors: error,
    });
  }
});

app.listen(5000, () => {
  console.log("Server is running at port 5000");
});
