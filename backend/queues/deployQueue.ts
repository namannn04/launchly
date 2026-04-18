import { Queue } from "bullmq";
import IORedis from "ioredis";

import type { DeployJobData } from "../services/deployTypes";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export function createRedisConnection() {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: true,
  });
}

function createDeployQueue() {
  return new Queue<DeployJobData>("deploy-queue", {
    connection: createRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: false,
      removeOnFail: false,
      attempts: 1,
    },
  });
}

export async function addDeployJob(data: DeployJobData) {
  const queue = createDeployQueue();

  try {
    await queue.add(`deploy:${data.projectId}`, data);
  } finally {
    await queue.close();
  }
}
