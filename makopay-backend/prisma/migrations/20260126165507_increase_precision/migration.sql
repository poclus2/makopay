-- AlterTable
ALTER TABLE "wallet_ledger" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,8),
ALTER COLUMN "balance_after" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "wallets" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(20,8);
