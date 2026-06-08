-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "UserSettings"
ADD COLUMN "billingInterval" "BillingInterval",
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "planActivatedAt" TIMESTAMP(3);
