-- Persist each match winner so tournament progression is deterministic and
-- idempotent after concurrent votes or process restarts.
ALTER TABLE "SessionMatch" ADD COLUMN "winnerId" INTEGER;

CREATE INDEX "Participant_sessionId_idx" ON "Participant"("sessionId");
CREATE INDEX "Session_quizId_idx" ON "Session"("quizId");
CREATE INDEX "Session_adminId_idx" ON "Session"("adminId");
CREATE INDEX "SessionMatch_sessionId_cluster_completed_order_idx"
    ON "SessionMatch"("sessionId", "cluster", "completed", "order");
CREATE INDEX "SessionVote_matchId_selectionId_idx"
    ON "SessionVote"("matchId", "selectionId");
CREATE INDEX "SessionVote_participantId_idx" ON "SessionVote"("participantId");

ALTER TABLE "SessionMatch"
    ADD CONSTRAINT "SessionMatch_winnerId_fkey"
    FOREIGN KEY ("winnerId") REFERENCES "QuizItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
