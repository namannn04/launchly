import { Worker } from "bullmq";

import { createRedisConnection } from "../queues/deployQueue";
import { deployRepository } from "../services/deployService";
import type { DeployJobData } from "../services/deployTypes";

const workerConnection = createRedisConnection();

const workerConcurrency = Number.parseInt(process.env.DEPLOY_WORKER_CONCURRENCY ?? "1", 10);

const deployWorker = new Worker<DeployJobData>(
  "deploy-queue",
  async (job) => {
    await deployRepository(job.data);
  },
  {
    connection: workerConnection,
    concurrency: Number.isFinite(workerConcurrency) && workerConcurrency > 0 ? workerConcurrency : 1,
  },
);

deployWorker.on("completed", (job) => {
  console.log(`Deploy job completed: ${job.id}`);
});

deployWorker.on("failed", (job, error) => {
  console.error(`Deploy job failed: ${job?.id ?? "unknown"}`, error);
});

console.log("Deploy worker started and listening on deploy-queue");
