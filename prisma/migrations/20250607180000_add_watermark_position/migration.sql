-- CreateEnum
CREATE TYPE "WatermarkPosition" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "watermarkPosition" "WatermarkPosition" NOT NULL DEFAULT 'BOTTOM_RIGHT';
