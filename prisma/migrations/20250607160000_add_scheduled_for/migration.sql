-- AlterTable
ALTER TABLE "ContentWorkspace" ADD COLUMN "scheduledFor" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ContentWorkspace_userId_scheduledFor_idx" ON "ContentWorkspace"("userId", "scheduledFor");
