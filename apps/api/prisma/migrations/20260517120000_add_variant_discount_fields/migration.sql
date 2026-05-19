-- Add variant-level ERP discount fields and remove default-variant state.
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE "DiscountMode" AS ENUM ('AUTOMATIC', 'MANUAL');

ALTER TABLE "ProductVariant"
ADD COLUMN "finalPrice" DECIMAL(65,30);

UPDATE "ProductVariant"
SET "finalPrice" = "price"
WHERE "finalPrice" IS NULL;

ALTER TABLE "ProductVariant"
ALTER COLUMN "finalPrice" SET NOT NULL,
ADD COLUMN "discountType" "DiscountType",
ADD COLUMN "discountValue" DECIMAL(65,30),
ADD COLUMN "discountMode" "DiscountMode",
DROP COLUMN "isDefault";
