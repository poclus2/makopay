-- AlterTable
ALTER TABLE "investment_plans" ALTER COLUMN "min_amount" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "max_amount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE DECIMAL(14,4);
