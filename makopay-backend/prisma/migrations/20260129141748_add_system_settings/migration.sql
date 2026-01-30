-- AlterTable
ALTER TABLE "deposit_requests" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "investment_payouts" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "principal_amount" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "mlm_commissions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE DECIMAL(20,8);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);
