-- CreateEnum
CREATE TYPE "QuotationServiceType" AS ENUM ('IMPORT_EXPORT', 'CUSTOMS_CLEARANCE', 'DOMESTIC_TRANSPORT', 'WAREHOUSE_STORAGE', 'INTERNATIONAL_TRADE', 'OTHER');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "QuotationRequest" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'NEW',
    "serviceType" "QuotationServiceType" NOT NULL,
    "serviceDetail" TEXT,
    "cargoDescription" TEXT,
    "cargoWeight" DECIMAL(10,3),
    "cargoVolume" DECIMAL(10,3),
    "originCity" TEXT,
    "destinationCity" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "companyName" TEXT,
    "quotedPrice" DECIMAL(15,2),
    "quotedNote" TEXT,
    "quotedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRequest_requestCode_key" ON "QuotationRequest"("requestCode");

-- CreateIndex
CREATE INDEX "QuotationRequest_status_idx" ON "QuotationRequest"("status");

-- CreateIndex
CREATE INDEX "QuotationRequest_serviceType_idx" ON "QuotationRequest"("serviceType");

-- CreateIndex
CREATE INDEX "QuotationRequest_contactEmail_idx" ON "QuotationRequest"("contactEmail");

-- AddForeignKey
ALTER TABLE "QuotationRequest" ADD CONSTRAINT "QuotationRequest_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
