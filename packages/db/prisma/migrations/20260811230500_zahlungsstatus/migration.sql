-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('atPickup', 'pending', 'paid', 'failed');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'atPickup';

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentIntentId_key" ON "Order"("paymentIntentId");

