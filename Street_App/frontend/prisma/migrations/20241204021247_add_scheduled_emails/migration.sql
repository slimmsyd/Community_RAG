-- CreateTable
CREATE TABLE "ScheduledEmail" (
    "id" TEXT NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProposal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMPTZ(6),
    "is_sent" BOOLEAN DEFAULT false,
    "sent_at" TIMESTAMPTZ(6),
    "email" TEXT,
    "user_id" UUID NOT NULL,
    "link_id" UUID NOT NULL,

    CONSTRAINT "SavedProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledEmail_proposalId_idx" ON "ScheduledEmail"("proposalId");

-- CreateIndex
CREATE INDEX "SavedProposal_link_id_idx" ON "SavedProposal"("link_id");

-- CreateIndex
CREATE INDEX "SavedProposal_user_id_idx" ON "SavedProposal"("user_id");
