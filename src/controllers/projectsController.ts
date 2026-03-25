import { Request, Response } from "express";
import pool from "../db";

export const getAllProjects = async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM projects");
  res.json(result.rows);
};

export const getProjectById = async (req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
};

export const createProject = async (req: Request, res: Response) => {
  const { name, budget, description, hours_used } = req.body;
  const result = await pool.query(
    "INSERT INTO projects (name, budget, description, hours_used) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, budget, description, hours_used ?? 0]
  );
  res.status(201).json(result.rows[0]);
};

export const updateProject = async (req: Request, res: Response) => {
  const { name, budget, description, hours_used } = req.body;
  const result = await pool.query(
    "UPDATE projects SET name=$1, budget=$2, description=$3, hours_used=$4 WHERE id=$5 RETURNING *",
    [name, budget, description, hours_used, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
};

export const deleteProject = async (req: Request, res: Response) => {
  await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
  res.status(204).send();
};

export const getTasksByProject = async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT t.* FROM tasks t
     JOIN project_tasks pt ON pt.task_id = t.id
     WHERE pt.project_id = $1`,
    [req.params.id]
  );
  res.json(result.rows);
};
