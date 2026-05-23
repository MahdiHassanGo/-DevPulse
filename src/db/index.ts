import { Pool } from "pg";
import config from "../config/index.js";

export const pool = new Pool({
  connectionString: config.connection_string,
});
export const initDB = async () => {
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