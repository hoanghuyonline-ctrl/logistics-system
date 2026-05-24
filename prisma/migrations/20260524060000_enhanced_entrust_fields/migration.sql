-- AlterTable: Add enhanced entrust XNK fields
ALTER TABLE "Order"
ADD COLUMN "entrustShipmentType" TEXT,
ADD COLUMN "entrustServices" TEXT,
ADD COLUMN "cargoValueCurrency" TEXT,
ADD COLUMN "cargoValueAmount" DECIMAL(15,2),
ADD COLUMN "cargoValueVND" DECIMAL(15,2),
ADD COLUMN "dimensionLength" DECIMAL(8,2),
ADD COLUMN "dimensionWidth" DECIMAL(8,2),
ADD COLUMN "dimensionHeight" DECIMAL(8,2),
ADD COLUMN "cbm" DECIMAL(10,4),
ADD COLUMN "entrustQuantity" INTEGER,
ADD COLUMN "waybillCode" TEXT,
ADD COLUMN "waybillImages" TEXT,
ADD COLUMN "relatedDocuments" TEXT,
ADD COLUMN "cnTruckPlate" TEXT,
ADD COLUMN "cnDriverName" TEXT,
ADD COLUMN "cnDriverPhone" TEXT,
ADD COLUMN "cnTruckImages" TEXT;
