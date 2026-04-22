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
      removeOnComplete: true,
      removeOnFail: 20,
      attempts: 1,
    },
  });
}

export async function addDeployJob(data: DeployJobData) {
  const queue = createDeployQueue();
  const jobKey = `deploy-${data.projectId}`;

  try {
    const existing = await queue.getJob(jobKey);

    if (existing) {
      await existing.remove().catch(() => undefined);
    }

    await queue.add(jobKey, data, {
      jobId: jobKey,
    });
  } finally {
    await queue.close();
  }
}
