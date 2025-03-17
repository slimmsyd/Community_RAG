/*
  Warnings:

  - You are about to drop the `ProposalLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SavedProposal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduledEmail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proposal_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `savedLinks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `saved_proposals` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Signup" ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- DropTable
DROP TABLE "ProposalLink";

-- DropTable
DROP TABLE "SavedProposal";

-- DropTable
DROP TABLE "ScheduledEmail";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "proposal_links";

-- DropTable
DROP TABLE "savedLinks";

-- DropTable
DROP TABLE "saved_proposals";

-- CreateTable
CREATE TABLE "BetaSignup" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaSignup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaSignup_email_key" ON "BetaSignup"("email");
