-- CreateTable
CREATE TABLE "ChatbotQualityLog" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "senderId" TEXT,
    "question" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "detail" TEXT,
    "knowledgeId" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotQualityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotQualityLog_channel_createdAt_idx" ON "ChatbotQualityLog"("channel", "createdAt");
