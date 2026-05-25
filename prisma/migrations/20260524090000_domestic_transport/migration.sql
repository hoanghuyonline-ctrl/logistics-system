-- CreateEnum
CREATE TYPE "TransportServiceType" AS ENUM ('TRUCK_NORTH_SOUTH', 'INNER_CITY_DELIVERY', 'TRANSIT_WAREHOUSE');

-- CreateEnum
CREATE TYPE "TransportRequestStatus" AS ENUM ('PENDING', 'REVIEWING', 'QUOTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TransportRequest" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceType" "TransportServiceType" NOT NULL,
    "status" "TransportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "pickupAddress" TEXT,
    "pickupCity" TEXT,
    "pickupContactName" TEXT,
    "pickupContactPhone" TEXT,
    "pickupDate" TIMESTAMP(3),
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryContactName" TEXT,
    "deliveryContactPhone" TEXT,
    "cargoDescription" TEXT,
    "cargoWeight" DECIMAL(10,3),
    "cargoVolume" DECIMAL(10,3),
    "cargoQuantity" INTEGER,
    "cargoType" TEXT,
    "requiresRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "warehouseCity" TEXT,
    "storageDuration" INTEGER,
    "storageNote" TEXT,
    "quotedPrice" DECIMAL(15,2),
    "quotedAt" TIMESTAMP(3),
    "customerNote" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportRequest_requestCode_key" ON "TransportRequest"("requestCode");

-- CreateIndex
CREATE INDEX "TransportRequest_customerId_createdAt_idx" ON "TransportRequest"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "TransportRequest_status_idx" ON "TransportRequest"("status");

-- CreateIndex
CREATE INDEX "TransportRequest_serviceType_idx" ON "TransportRequest"("serviceType");

-- AddForeignKey
ALTER TABLE "TransportRequest" ADD CONSTRAINT "TransportRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
