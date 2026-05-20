-- CreateEnum
CREATE TYPE "SalesRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'PRICE_CONFIRMED', 'PAID', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SALES_PAYMENT';

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "estimatedPrice" DECIMAL(15,2),
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRequest" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedTotal" DECIMAL(15,2),
    "confirmedPrice" DECIMAL(15,2),
    "status" "SalesRequestStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "customerNote" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidFromWallet" BOOLEAN NOT NULL DEFAULT false,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesRequest_requestCode_key" ON "SalesRequest"("requestCode");

-- CreateIndex
CREATE INDEX "SalesRequest_customerId_createdAt_idx" ON "SalesRequest"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesRequest_status_idx" ON "SalesRequest"("status");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRequest" ADD CONSTRAINT "SalesRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRequest" ADD CONSTRAINT "SalesRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRequest" ADD CONSTRAINT "SalesRequest_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
