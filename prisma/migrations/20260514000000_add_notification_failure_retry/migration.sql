-- AlterTable
ALTER TABLE "NotificationFailure" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "NotificationFailure" ADD COLUMN "lastRetryAt" TIMESTAMP(3);
ALTER TABLE "NotificationFailure" ADD COLUMN "resolved" BOOLEAN NOT NULL DEFAULT false;
