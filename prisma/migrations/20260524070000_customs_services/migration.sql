-- CreateEnum
CREATE TYPE "CustomsDeclarationType" AS ENUM ('KINH_DOANH', 'GIA_CONG', 'SAN_XUAT_XUAT_KHAU', 'TAM_NHAP_TAI_XUAT', 'PHI_MAU_DICH');

-- CreateEnum
CREATE TYPE "CustomsRequestStatus" AS ENUM ('PENDING', 'REVIEWING', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CustomsRequest" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "declarationType" "CustomsDeclarationType" NOT NULL,
    "status" "CustomsRequestStatus" NOT NULL DEFAULT 'PENDING',
    "accompanyingServices" TEXT,
    "goodsDescription" TEXT,
    "hsCode" TEXT,
    "goodsValue" DECIMAL(15,2),
    "goodsCurrency" TEXT,
    "goodsWeight" DECIMAL(10,3),
    "goodsQuantity" INTEGER,
    "originCountry" TEXT,
    "destinationPort" TEXT,
    "companyName" TEXT,
    "taxCode" TEXT,
    "companyAddress" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "documents" TEXT,
    "quotedPrice" DECIMAL(15,2),
    "quotedAt" TIMESTAMP(3),
    "customerNote" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomsRequest_requestCode_key" ON "CustomsRequest"("requestCode");

-- CreateIndex
CREATE INDEX "CustomsRequest_customerId_createdAt_idx" ON "CustomsRequest"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomsRequest_status_idx" ON "CustomsRequest"("status");

-- CreateIndex
CREATE INDEX "CustomsRequest_declarationType_idx" ON "CustomsRequest"("declarationType");

-- AddForeignKey
ALTER TABLE "CustomsRequest" ADD CONSTRAINT "CustomsRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
