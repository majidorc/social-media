-- CreateEnum
CREATE TYPE "AiImageModel" AS ENUM ('IMAGEN_3_PRO', 'IMAGEN_3_FAST', 'DALL_E_3');

-- AlterTable
ALTER TABLE "ContentWorkspace" ADD COLUMN "imageModel" "AiImageModel";
