

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";
import dotenv2 from "dotenv";
import cors from "cors";
import CookieParser from "cookie-parser";

// src/modules/user/user.routes.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTION,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  refresh_token_secret: process.env.REFRESH_TOKEN_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
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

// src/modules/user/user.service.ts
import bcrypt from "bcrypt";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
  INSERT INTO users(name,email,password,role)
  VALUES ($1,$2,$3,$4)
  RETURNING id, name, email, role, created_at, updated_at  
    `,
    [name, email, hashPassword, role]
  );
  return result;
};
var userService = {
  createUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/user/user.controller.ts
var createUser = async (req, res, next) => {
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var userController = {
  createUser
};

// src/modules/user/user.routes.ts
var router = Router();
router.post("/signup", userController.createUser);
var userRoute = router;

// src/modules/issues/issue.routes.ts
import { Router as Router2 } from "express";

// src/modules/issues/issue.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await pool.query(
    `INSERT INTO issues(title, description, type, reporter_id)

       VALUES ($1, $2, $3, $4)

       RETURNING *`,
    [title, description, type, reporter_id]
  );
  return result;
};
var getIssuesFromDB = async (sort = "newest", type, status) => {
  let query = `SELECT * FROM issues`;
  const conditions = [];
  const values = [];
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
  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const reporterMap = {};
  reportersResult.rows.forEach((r) => {
    reporterMap[r.id] = r;
  });
  const data = issues.map((issue) => {
    const { reporter_id, created_at, updated_at, ...rest } = issue;
    return {
      ...rest,
      reporter: reporterMap[reporter_id] || null,
      created_at,
      updated_at
    };
  });
  return data;
};
var getIssueByIdFromDB = async (id) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (result.rows.length === 0) {
    return null;
  }
  const issue = result.rows[0];
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const { created_at, updated_at, reporter_id, ...rest } = issue;
  return {
    ...rest,
    reporter: reporterResult.rows[0] || null,
    created_at,
    updated_at
  };
};
var updateIssueInDB = async (id, payload) => {
  const { title, description, type, status } = payload;
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
    [title, description, type, status, id]
  );
  return result.rows[0] || null;
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};
var issueService = {
  createIssueIntoDB,
  getIssuesFromDB,
  getIssueByIdFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/types/index.ts
var USER_ROLE = {
  maintainer: "maintainer",
  contributor: "contributor"
};

// src/modules/issues/issue.controller.ts
var createIssue = async (req, res, next) => {
  const { title, description, type } = req.body;
  if (!title || !description || !type) {
    res.status(400).json({
      success: false,
      message: "title, description, and type are required"
    });
    return;
  }
  if (title.length > 150) {
    res.status(400).json({
      success: false,
      message: "title must not exceed 150 characters"
    });
    return;
  }
  if (description.length < 20) {
    res.status(400).json({
      success: false,
      message: "description must be at least 20 characters"
    });
    return;
  }
  if (!["bug", "feature_request"].includes(type)) {
    res.status(400).json({
      success: false,
      message: "type must be bug or feature_request"
    });
    return;
  }
  try {
    const reporter_id = req.user.id;
    const result = await issueService.createIssueIntoDB({ ...req.body, reporter_id });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var getIssues = async (req, res, next) => {
  const { sort = "newest", type, status } = req.query;
  try {
    const data = await issueService.getIssuesFromDB(
      sort,
      type,
      status
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var getIssueById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const data = await issueService.getIssueByIdFromDB(id);
    if (!data) {
      res.status(404).json({
        success: false,
        message: "Issue not found"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  const id = req.params.id;
  const { title, description, type, status } = req.body;
  const requestingUser = req.user;
  if (title && title.length > 150) {
    res.status(400).json({
      success: false,
      message: "title must not exceed 150 characters"
    });
    return;
  }
  if (description && description.length < 20) {
    res.status(400).json({
      success: false,
      message: "description must be at least 20 characters"
    });
    return;
  }
  if (type && !["bug", "feature_request"].includes(type)) {
    res.status(400).json({
      success: false,
      message: "type must be bug or feature_request"
    });
    return;
  }
  try {
    const existing = await issueService.getIssueByIdFromDB(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Issue not found"
      });
      return;
    }
    if (requestingUser.role === USER_ROLE.contributor) {
      if (existing.reporter.id !== requestingUser.id) {
        res.status(403).json({
          success: false,
          message: "Forbidden Access"
        });
        return;
      }
      if (existing.status !== "open") {
        res.status(409).json({
          success: false,
          message: "Contributors can only update issues with open status"
        });
        return;
      }
      if (status) {
        res.status(403).json({
          success: false,
          message: "Contributors cannot change issue status"
        });
        return;
      }
    }
    const result = await issueService.updateIssueInDB(id, req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  const id = req.params.id;
  try {
    const result = await issueService.deleteIssueFromDB(id);
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var issueController = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized Access"
        });
        return;
      }
      const decoded = jwt.verify(
        token,
        config_default.access_token_secret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [decoded.id]
      );
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
        return;
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden Access"
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issue.routes.ts
var router2 = Router2();
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);
router2.get("/", issueController.getIssues);
router2.get("/:id", issueController.getIssueById);
router2.patch("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteIssue);
var issueRoute = router2;

// src/modules/auth/auth.route.ts
import { Router as Router3 } from "express";

// src/modules/auth/auth.controller.ts
import { DatabaseError } from "pg";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcrypt";
import jwt2 from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const accessToken = jwt2.sign(
    jwtPayload,
    config_default.access_token_secret,
    { expiresIn: "1d" }
  );
  const refreshToken2 = jwt2.sign(
    jwtPayload,
    config_default.refresh_token_secret,
    { expiresIn: "7d" }
  );
  const { password: _password, ...userWithoutPassword } = user;
  return { accessToken, refreshToken: refreshToken2, user: userWithoutPassword };
};
var generatedFreshToken = async (token) => {
};
var authService = {
  loginUserIntoDB,
  generatedFreshToken
};

// src/modules/auth/auth.controller.ts
var signup = async (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      message: "name, email, and password are required"
    });
    return;
  }
  if (role && !["contributor", "maintainer"].includes(role)) {
    res.status(400).json({
      success: false,
      message: "role must be contributor or maintainer"
    });
    return;
  }
  try {
    const result = await userService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof DatabaseError && error.code === "23505") {
      res.status(400).json({
        success: false,
        message: "Email already exists",
        errors: error.detail
      });
      return;
    }
    next(error);
  }
};
var loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { refreshToken: refreshToken2, accessToken, user } = result;
    res.cookie("RefreshToken", refreshToken2, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user
      }
    });
  } catch (error) {
    next(error);
  }
};
var refreshToken = async (req, res, next) => {
  try {
    const result = await authService.generatedFreshToken(req.cookies.RefreshToken);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Token refreshed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var authController = {
  signup,
  loginUser,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router3 = Router3();
router3.post("/signup", authController.signup);
router3.post("/login", authController.loginUser);
router3.post("/refresh-token", authController.refreshToken);
var authRoute = router3;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Time:", req.method, req.url, Date.now());
  const log = `
Method ->${req.method} - Time -> ${Date.now()} - URL${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
    console.log(err);
  });
  next();
};
var logger_default = logger;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (error, req, res, next) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    success: false,
    message,
    errors: error
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
dotenv2.config();
var app = express();
app.use(express.json());
app.use(CookieParser());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "Asif"
  });
});
app.use("/api/auth", userRoute);
app.use("/api/issues", issueRoute);
app.use("/api/auth", authRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(5e3, () => {
    console.log("Server is running at port 5000");
  });
};
main();
//# sourceMappingURL=server.js.map