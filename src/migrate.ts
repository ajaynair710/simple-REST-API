import pool from "./db";

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      budget NUMERIC,
      description TEXT,
      hours_used NUMERIC DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT[] DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, task_id)
    );
  `);
  console.log("Database migrated");
}
