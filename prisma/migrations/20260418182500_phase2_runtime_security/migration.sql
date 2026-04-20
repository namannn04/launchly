-- AlterTable
ALTER TABLE "public"."Deployment"
ADD COLUMN "runtimePid" INTEGER,
ADD COLUMN "runtimePort" INTEGER,
ADD COLUMN "runtimeStatus" TEXT;

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "stackUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SensitiveActionToken" (
    "id" TEXT NOT NULL,
    "stackUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_stackUserId_createdAt_idx" ON "public"."AuditLog"("stackUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "public"."AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveActionToken_tokenHash_key" ON "public"."SensitiveActionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "SensitiveActionToken_stackUserId_expiresAt_idx" ON "public"."SensitiveActionToken"("stackUserId", "expiresAt");

-- AddForeignKey
ALTER TABLE "public"."AuditLog"
ADD CONSTRAINT "AuditLog_stackUserId_fkey"
FOREIGN KEY ("stackUserId") REFERENCES "public"."StackUser"("stackUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SensitiveActionToken"
ADD CONSTRAINT "SensitiveActionToken_stackUserId_fkey"
FOREIGN KEY ("stackUserId") REFERENCES "public"."StackUser"("stackUserId") ON DELETE CASCADE ON UPDATE CASCADE;
