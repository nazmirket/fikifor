ALTER TABLE "User"
ADD COLUMN "displayName" TEXT;

CREATE INDEX "Session_quizId_ended_favoriteId_idx"
ON "Session"("quizId", "ended", "favoriteId");
