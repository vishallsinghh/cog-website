-- CreateTable
CREATE TABLE "donation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "method" TEXT,
    "failureReason" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "donation_status_createdAt_idx" ON "donation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "donation_userId_idx" ON "donation"("userId");

-- CreateIndex
CREATE INDEX "donation_phoneNumber_idx" ON "donation"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "donation_receiptNumber_key" ON "donation"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "donation_razorpayOrderId_key" ON "donation"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "donation_razorpayPaymentId_key" ON "donation"("razorpayPaymentId");
