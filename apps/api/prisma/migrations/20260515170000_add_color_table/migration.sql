CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

INSERT INTO "Color" ("id", "name", "createdAt", "updatedAt")
SELECT
    concat('color_', md5(trim("colorway"))),
    trim("colorway"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product"
WHERE "colorway" IS NOT NULL AND trim("colorway") <> ''
GROUP BY trim("colorway");

ALTER TABLE "Product" ADD COLUMN "colorId" TEXT;

UPDATE "Product"
SET "colorId" = "Color"."id"
FROM "Color"
WHERE trim("Product"."colorway") = "Color"."name";

ALTER TABLE "Product" DROP COLUMN "colorway";

ALTER TABLE "Product" ADD CONSTRAINT "Product_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;
