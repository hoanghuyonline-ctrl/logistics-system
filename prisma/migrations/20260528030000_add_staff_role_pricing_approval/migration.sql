-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "isPricingPendingApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "staffSubmittedPricingAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "pricingSubmittedByStaffId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_pricingSubmittedByStaffId_fkey" FOREIGN KEY ("pricingSubmittedByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
