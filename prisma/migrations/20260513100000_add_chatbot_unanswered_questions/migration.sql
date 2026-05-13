-- CreateTable
CREATE TABLE "ChatbotUnansweredQuestion" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "senderId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotUnansweredQuestion_pkey" PRIMARY KEY ("id")
);
