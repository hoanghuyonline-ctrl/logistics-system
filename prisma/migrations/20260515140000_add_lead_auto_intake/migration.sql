-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "zaloSenderId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "facebookSenderId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "isAutoCreated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_zaloSenderId_key" ON "Lead"("zaloSenderId");
CREATE UNIQUE INDEX "Lead_facebookSenderId_key" ON "Lead"("facebookSenderId");
