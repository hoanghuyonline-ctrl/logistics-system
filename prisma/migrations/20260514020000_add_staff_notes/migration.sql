-- CreateTable
CREATE TABLE "StaffNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "orderCode" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StaffNote" ADD CONSTRAINT "StaffNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
