-- Remove synthetic PK and unique index
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
DROP INDEX "User_clerkId_key";

-- Drop the generated cuid column
ALTER TABLE "User" DROP COLUMN "id";

-- Promote clerkId to primary key
ALTER TABLE "User" RENAME COLUMN "clerkId" TO "id";
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
