import "dotenv/config";
import express from "express";
import { waitForDb } from "./db";
import { migrate } from "./migrate";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";

const app = express();
app.use(express.json());

app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);

const PORT = Number(process.env.PORT) || 3000;

async function main(): Promise<void> {
  await waitForDb();
  await migrate();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
