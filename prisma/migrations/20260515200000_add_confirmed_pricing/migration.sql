-- AlterTable
ALTER TABLE "Order" ADD COLUMN "confirmedProductCost" DECIMAL(15,2),
ADD COLUMN "confirmedShippingCost" DECIMAL(15,2),
ADD COLUMN "confirmedServiceFee" DECIMAL(15,2),
ADD COLUMN "confirmedTotalCost" DECIMAL(15,2),
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "confirmedById" TEXT;
