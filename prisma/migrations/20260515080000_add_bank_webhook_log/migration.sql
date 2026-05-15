-- CreateTable
CREATE TABLE "BankWebhookLog" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "transferReference" TEXT,
    "amount" DECIMAL(15,2),
    "accountNumber" TEXT,
    "transactionTime" TIMESTAMP(3),
    "errorReason" TEXT,
    "topUpRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankWebhookLog_provider_transactionId_key" ON "BankWebhookLog"("provider", "transactionId");
