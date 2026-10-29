-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "dailyCalorieGoal" INTEGER NOT NULL DEFAULT 2000,
    "dailyProteinGoal" INTEGER NOT NULL DEFAULT 150,
    "dailyCarbGoal" INTEGER NOT NULL DEFAULT 200,
    "dailyFatGoal" INTEGER NOT NULL DEFAULT 67,
    "currentWeightKg" REAL,
    "goalWeightKg" REAL,
    "heightCm" REAL,
    "age" INTEGER,
    "gender" TEXT,
    "activityLevel" TEXT,
    "onboardedAt" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("activityLevel", "age", "createdAt", "currentWeightKg", "dailyCalorieGoal", "dailyCarbGoal", "dailyFatGoal", "dailyProteinGoal", "gender", "goalWeightKg", "heightCm", "id", "name", "onboardedAt", "updatedAt") SELECT "activityLevel", "age", "createdAt", "currentWeightKg", "dailyCalorieGoal", "dailyCarbGoal", "dailyFatGoal", "dailyProteinGoal", "gender", "goalWeightKg", "heightCm", "id", "name", "onboardedAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
