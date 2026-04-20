-- CreateEnum
CREATE TYPE "public"."DeploymentEnvironment" AS ENUM ('development', 'preview', 'production');

-- CreateEnum
CREATE TYPE "public"."DeploymentRuntime" AS ENUM ('static', 'nextjs', 'node', 'unknown');

-- AlterTable
ALTER TABLE "public"."Deployment"
ADD COLUMN "environment" "public"."DeploymentEnvironment" NOT NULL DEFAULT 'production',
ADD COLUMN "runtime" "public"."DeploymentRuntime" NOT NULL DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "public"."UserGithubConnection"
ADD COLUMN "githubAccessTokenIv" TEXT,
ADD COLUMN "githubAccessTokenKeyVer" INTEGER,
ADD COLUMN "githubAccessTokenTag" TEXT;

-- CreateTable
CREATE TABLE "public"."ProjectEnvironmentVariable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stackUserId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueIv" TEXT NOT NULL,
    "valueTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "environment" "public"."DeploymentEnvironment" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEnvironmentVariable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectEnvironmentVariable_stackUserId_projectId_idx" ON "public"."ProjectEnvironmentVariable"("stackUserId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEnvironmentVariable_stackUserId_projectId_environment_key_key" ON "public"."ProjectEnvironmentVariable"("stackUserId", "projectId", "environment", "key");

-- AddForeignKey
ALTER TABLE "public"."ProjectEnvironmentVariable"
ADD CONSTRAINT "ProjectEnvironmentVariable_stackUserId_fkey"
FOREIGN KEY ("stackUserId") REFERENCES "public"."StackUser"("stackUserId") ON DELETE CASCADE ON UPDATE CASCADE;
