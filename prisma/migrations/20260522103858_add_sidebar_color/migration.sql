-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "logoPath" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1f6feb',
    "accentColor" TEXT NOT NULL DEFAULT '#e8c33d',
    "sidebarColor" TEXT NOT NULL DEFAULT '#0f1a2e',
    "cardNoPrefix" TEXT NOT NULL DEFAULT 'UG',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_organizations" ("accentColor", "cardNoPrefix", "createdAt", "id", "logoPath", "name", "primaryColor", "slug", "status", "updatedAt") SELECT "accentColor", "cardNoPrefix", "createdAt", "id", "logoPath", "name", "primaryColor", "slug", "status", "updatedAt" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
