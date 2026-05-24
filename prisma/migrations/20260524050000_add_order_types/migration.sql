-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('ECOMMERCE', 'ENTRUST', 'CONSIGNMENT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderType" "OrderType" NOT NULL DEFAULT 'ECOMMERCE',
ADD COLUMN "productSpecs" TEXT,
ADD COLUMN "volume" DECIMAL(8,3),
ADD COLUMN "requiresVat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "taxCode" TEXT,
ADD COLUMN "companyName" TEXT,
ADD COLUMN "companyAddress" TEXT,
ADD COLUMN "consignmentTrackingNumber" TEXT,
ADD COLUMN "consignmentNotes" TEXT;
