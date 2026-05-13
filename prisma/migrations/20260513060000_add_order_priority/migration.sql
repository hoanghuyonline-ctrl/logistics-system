-- CreateEnum
CREATE TYPE "OrderPriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "priority" "OrderPriority" NOT NULL DEFAULT 'NORMAL';
