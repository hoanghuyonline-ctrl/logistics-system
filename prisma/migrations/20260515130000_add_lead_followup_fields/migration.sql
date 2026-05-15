-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "nextFollowUpAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lastContactedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "followUpNote" TEXT;
