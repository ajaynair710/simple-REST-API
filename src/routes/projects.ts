import { Router } from "express";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getTasksByProject,
} from "../controllers/projectsController";

const router = Router();

router.get("/", getAllProjects);
router.get("/:id/tasks", getTasksByProject);
router.get("/:id", getProjectById);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
