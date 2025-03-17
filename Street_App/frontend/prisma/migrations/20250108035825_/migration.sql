/*
  Warnings:

  - The primary key for the `BetaSignup` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "BetaSignup" DROP CONSTRAINT "BetaSignup_pkey",
ADD COLUMN     "age" TEXT,
ADD COLUMN     "gender" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BetaSignup_pkey" PRIMARY KEY ("id");
