-- Merge firstName + lastName into guestName
ALTER TABLE "reg_cards" ADD COLUMN "guestName" TEXT;

-- Combine existing data
UPDATE "reg_cards" SET "guestName" = TRIM(CONCAT(COALESCE("firstName", ''), ' ', COALESCE("lastName", '')));

-- Clean up empty strings
UPDATE "reg_cards" SET "guestName" = NULL WHERE "guestName" = '' OR "guestName" = ' ';

-- Drop old columns
ALTER TABLE "reg_cards" DROP COLUMN "firstName";
ALTER TABLE "reg_cards" DROP COLUMN "lastName";

-- Drop old index and create new one
DROP INDEX IF EXISTS "reg_cards_lastName_idx";
CREATE INDEX "reg_cards_guestName_idx" ON "reg_cards"("guestName");
