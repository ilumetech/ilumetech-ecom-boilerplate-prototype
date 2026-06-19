-- AlterTable
ALTER TABLE "CustomerAddress"
ADD COLUMN "shippingDestinationCode" TEXT,
ADD COLUMN "shippingDestinationLabel" TEXT;

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "originCode" TEXT NOT NULL,
    "originLabel" TEXT NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "destinationLabel" TEXT NOT NULL,
    "weightKg" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "shipmentType" TEXT NOT NULL,
    "tariffIdr" INTEGER NOT NULL,
    "etd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingRate_originCode_destinationCode_weightKg_service_shipmentType_key"
ON "ShippingRate"("originCode", "destinationCode", "weightKg", "service", "shipmentType");

-- CreateIndex
CREATE INDEX "ShippingRate_destinationCode_idx" ON "ShippingRate"("destinationCode");

-- CreateIndex
CREATE INDEX "ShippingRate_destinationLabel_idx" ON "ShippingRate"("destinationLabel");
