-- AlterTable
ALTER TABLE "support_messages" ADD COLUMN     "attachment_type" TEXT,
ADD COLUMN     "attachment_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kyc_data" JSONB,
ADD COLUMN     "kyc_submitted_at" TIMESTAMP(3);
