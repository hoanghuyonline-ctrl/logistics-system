-- CreateTable
CREATE TABLE "ChinaWarehouse" (
    "id" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "addressVi" TEXT NOT NULL,
    "addressZh" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChinaWarehouse_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "chinaWarehouseId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_chinaWarehouseId_fkey" FOREIGN KEY ("chinaWarehouseId") REFERENCES "ChinaWarehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
