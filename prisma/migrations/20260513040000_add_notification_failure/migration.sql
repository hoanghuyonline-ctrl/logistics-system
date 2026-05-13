-- CreateTable
CREATE TABLE "NotificationFailure" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "orderCode" TEXT,
    "customerId" TEXT,
    "recipient" TEXT,
    "failureCategory" TEXT,
    "shortReason" TEXT,
    "payloadSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationFailure_pkey" PRIMARY KEY ("id")
);
