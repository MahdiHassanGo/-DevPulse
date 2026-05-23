import { pool } from "../../db/index.js";
import { IIssue } from "./issue.interface.js";

const createIssueIntoDB= async(payload:IIssue)=>{
    const {title, description, type, reporter_id}=payload
    const result = await pool.query(
      `INSERT INTO issues(title, description, type, reporter_id)

       VALUES ($1, $2, $3, $4)

       RETURNING *`,

      [title, description, type, reporter_id],
    );
    return result
}

const getIssuesFromDB = async (sort: string = "newest", type?: string, status?: string) => {
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

  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;

  if (issues.length === 0) {
    return [];
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

  return data;
};

const getIssueByIdFromDB = async (id: string) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const issue = result.rows[0];

  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const { reporter_id, ...rest } = issue;

  return {
    ...rest,
    reporter: reporterResult.rows[0] || null,
  };
};

const updateIssueInDB = async (
  id: string,
  payload:IIssue
) => {
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
    [title, description, type, status, id],
  );
  return result.rows[0] || null;
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] || null;
};

export const issueService={
    createIssueIntoDB,
    getIssuesFromDB,
    getIssueByIdFromDB,
    updateIssueInDB,
    deleteIssueFromDB
}