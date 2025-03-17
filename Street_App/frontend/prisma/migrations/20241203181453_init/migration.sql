-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "username" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN,
    "birthday" TIMESTAMP(3),
    "stripeKey" TEXT,
    "paymentIntentId" TEXT,
    "invoicesSent" INTEGER DEFAULT 0,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionEndDate" TIMESTAMP(3),
    "plan" TEXT NOT NULL DEFAULT 'NONE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalLink" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "email" TEXT,
    "sendTo" TEXT,

    CONSTRAINT "ProposalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signup" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "interests" TEXT[],
    "lastEmailSent" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "Signup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savedLinks" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "email" TEXT,
    "userId" UUID NOT NULL,
    "id" SERIAL NOT NULL,
    "linkId" UUID NOT NULL,

    CONSTRAINT "savedLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_links" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMPTZ(6),
    "user_id" UUID NOT NULL,
    "email" TEXT,
    "is_sent" BOOLEAN DEFAULT false,
    "sent_at" TIMESTAMPTZ(6),

    CONSTRAINT "proposal_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_proposals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMPTZ(6),
    "is_sent" BOOLEAN DEFAULT false,
    "sent_at" TIMESTAMPTZ(6),
    "email" TEXT,
    "user_id" UUID NOT NULL,
    "link_id" UUID NOT NULL,

    CONSTRAINT "saved_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_paymentIntentId_key" ON "User"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "User"("subscriptionId");

-- CreateIndex
CREATE INDEX "ProposalLink_userId_idx" ON "ProposalLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Signup_email_key" ON "Signup"("email");

-- CreateIndex
CREATE INDEX "savedLinks_userId_idx" ON "savedLinks"("userId");

-- CreateIndex
CREATE INDEX "savedLinks_linkId_idx" ON "savedLinks"("linkId");

-- CreateIndex
CREATE INDEX "proposal_links_user_id_idx" ON "proposal_links"("user_id");

-- CreateIndex
CREATE INDEX "saved_proposals_link_id_idx" ON "saved_proposals"("link_id");

-- CreateIndex
CREATE INDEX "saved_proposals_user_id_idx" ON "saved_proposals"("user_id");
