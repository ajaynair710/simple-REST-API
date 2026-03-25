import { Request, Response } from "express";
import pool from "../db";

export const getAllTasks = async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM tasks");
  res.json(result.rows);
};

export const getTaskById = async (req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
};

export const createTask = async (req: Request, res: Response) => {
  const { title, description, tags } = req.body;
  const result = await pool.query(
    "INSERT INTO tasks (title, description, tags) VALUES ($1,$2,$3) RETURNING *",
    [title, description, tags ?? []]
  );
  res.status(201).json(result.rows[0]);
};

export const updateTask = async (req: Request, res: Response) => {
  const { title, description, tags } = req.body;
  const result = await pool.query(
    "UPDATE tasks SET title=$1, description=$2, tags=$3 WHERE id=$4 RETURNING *",
    [title, description, tags, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
};

export const deleteTask = async (req: Request, res: Response) => {
  await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
  res.status(204).send();
};

export const getTasksByTag = async (req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM tasks WHERE $1 = ANY(tags)", [req.params.tag]);
  res.json(result.rows);
};

export const assignTaskToProject = async (req: Request, res: Response) => {
  const { projectId } = req.body;
  await pool.query(
    "INSERT INTO project_tasks (project_id, task_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [projectId, req.params.id]
  );
  res.status(201).json({ message: "Task assigned to project" });
};
