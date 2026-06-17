import { NextResponse } from "next/server";

import { createRedisConnection } from "@/backend/queues/deployQueue";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  let redis: ReturnType<typeof createRedisConnection> | null = null;

  try {
    redis = createRedisConnection();
    await redis.connect();
    const pong = await redis.ping();
    checks.redis = pong === "PONG";
  } catch {
    checks.redis = false;
  } finally {
    if (redis) {
      await redis.quit().catch(() => undefined);
    }
  }

  const healthy = checks.database && checks.redis;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "launchly",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
