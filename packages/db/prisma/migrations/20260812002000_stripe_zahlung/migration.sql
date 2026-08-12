-- DropIndex
DROP INDEX "Order_stripeSessionId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "stripeSessionId",
ADD COLUMN     "stripePaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentId_key" ON "Order"("stripePaymentId");

