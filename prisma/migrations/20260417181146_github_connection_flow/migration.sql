-- CreateTable
CREATE TABLE "public"."UserGithubConnection" (
    "id" TEXT NOT NULL,
    "stackUserId" TEXT NOT NULL,
    "githubConnected" BOOLEAN NOT NULL DEFAULT false,
    "githubAccountId" TEXT,
    "githubUsername" TEXT,
    "githubAvatar" TEXT,
    "githubAccessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGithubConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StackUser" (
    "id" TEXT NOT NULL,
    "stackUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "primaryEmail" TEXT,
    "profileImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StackUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGithubConnection_stackUserId_key" ON "public"."UserGithubConnection"("stackUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGithubConnection_githubAccountId_key" ON "public"."UserGithubConnection"("githubAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "StackUser_stackUserId_key" ON "public"."StackUser"("stackUserId");

-- AddForeignKey
ALTER TABLE "public"."UserGithubConnection" ADD CONSTRAINT "UserGithubConnection_stackUserId_fkey" FOREIGN KEY ("stackUserId") REFERENCES "public"."StackUser"("stackUserId") ON DELETE CASCADE ON UPDATE CASCADE;
