-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "logoPath" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1f6feb',
    "accentColor" TEXT NOT NULL DEFAULT '#e8c33d',
    "cardNoPrefix" TEXT NOT NULL DEFAULT 'UG',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" TEXT,
    "type" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rooms_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reg_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "cardNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "checkOutDate" DATETIME,
    "guestName" TEXT,
    "contactNo" TEXT,
    "whatsappNo" TEXT,
    "email" TEXT,
    "company" TEXT,
    "nationality" TEXT,
    "country" TEXT,
    "idType" TEXT NOT NULL DEFAULT 'TOURIST',
    "idNumber" TEXT,
    "dateOfBirth" DATETIME,
    "arrivalDate" DATETIME,
    "departureDate" DATETIME,
    "roomId" TEXT,
    "mealPlan" TEXT,
    "signatureData" TEXT,
    "passportImagePath" TEXT,
    "passportPhoto" TEXT,
    "chipPhoto" TEXT,
    "rawMrzData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reg_cards_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reg_cards_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "extension_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "regCardId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "newCheckoutTime" TEXT,
    "newDepartureDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "extension_requests_regCardId_fkey" FOREIGN KEY ("regCardId") REFERENCES "reg_cards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "extension_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "extension_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "extension_requests_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT,
    "performedById" TEXT NOT NULL,
    "metadata" JSONB,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs_archive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT,
    "performedById" TEXT NOT NULL,
    "metadata" JSONB,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "users_orgId_idx" ON "users"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "users_orgId_email_key" ON "users"("orgId", "email");

-- CreateIndex
CREATE INDEX "rooms_orgId_idx" ON "rooms"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_orgId_number_key" ON "rooms"("orgId", "number");

-- CreateIndex
CREATE INDEX "reg_cards_orgId_idx" ON "reg_cards"("orgId");

-- CreateIndex
CREATE INDEX "reg_cards_cardNo_idx" ON "reg_cards"("cardNo");

-- CreateIndex
CREATE INDEX "reg_cards_guestName_idx" ON "reg_cards"("guestName");

-- CreateIndex
CREATE INDEX "reg_cards_idNumber_idx" ON "reg_cards"("idNumber");

-- CreateIndex
CREATE INDEX "reg_cards_roomId_idx" ON "reg_cards"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "reg_cards_orgId_cardNo_key" ON "reg_cards"("orgId", "cardNo");

-- CreateIndex
CREATE INDEX "extension_requests_orgId_idx" ON "extension_requests"("orgId");

-- CreateIndex
CREATE INDEX "audit_logs_orgId_idx" ON "audit_logs"("orgId");

-- CreateIndex
CREATE INDEX "audit_logs_archive_orgId_idx" ON "audit_logs_archive"("orgId");
