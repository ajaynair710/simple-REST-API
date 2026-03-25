import { Router } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByTag,
  assignTaskToProject,
} from "../controllers/tasksController";

const router = Router();

router.get("/", getAllTasks);
router.get("/tag/:tag", getTasksByTag);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/:id/projects", assignTaskToProject);

export default router;
