-- Persist gameplay timing so countdowns and match deadlines survive process restarts.
ALTER TABLE "Session" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "SessionMatch" ADD COLUMN "deadlineAt" TIMESTAMP(3);

UPDATE "Session"
SET "startsAt" = COALESCE("updatedAt", "createdAt")
WHERE "started" = true;

UPDATE "SessionMatch" match
SET "deadlineAt" = CURRENT_TIMESTAMP + INTERVAL '60 seconds'
FROM "Session" session
WHERE session."id" = match."sessionId"
  AND session."started" = true
  AND session."ended" = false
  AND match."completed" = false
  AND match."cluster" = session."cluster"
  AND NOT EXISTS (
      SELECT 1
      FROM "SessionMatch" earlier
      WHERE earlier."sessionId" = match."sessionId"
        AND earlier."cluster" = match."cluster"
        AND earlier."completed" = false
        AND earlier."order" < match."order"
  );

CREATE INDEX "SessionMatch_completed_deadlineAt_idx"
ON "SessionMatch"("completed", "deadlineAt");

-- Materialized leaderboard counters remove the quiz-items × completed-sessions
-- cross join from every leaderboard request.
ALTER TABLE "Quiz"
    ADD COLUMN "completedSessionCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "participantWeight" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "QuizItem"
    ADD COLUMN "sessionWins" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "weightedScore" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "weightedPlacement" INTEGER NOT NULL DEFAULT 0;

WITH "completedSessions" AS (
    SELECT
        session."id",
        session."quizId",
        session."favoriteId",
        COUNT(participant."id")::integer AS "participantCount"
    FROM "Session" session
    LEFT JOIN "Participant" participant
        ON participant."sessionId" = session."id"
    WHERE session."ended" = true
      AND session."favoriteId" IS NOT NULL
    GROUP BY session."id"
),
"quizStats" AS (
    SELECT
        "quizId",
        COUNT(*)::integer AS "completedSessionCount",
        COALESCE(SUM("participantCount"), 0)::integer AS "participantWeight"
    FROM "completedSessions"
    GROUP BY "quizId"
)
UPDATE "Quiz" quiz
SET
    "completedSessionCount" = stats."completedSessionCount",
    "participantWeight" = stats."participantWeight"
FROM "quizStats" stats
WHERE stats."quizId" = quiz."id";

WITH "completedSessions" AS (
    SELECT
        session."id",
        session."quizId",
        session."favoriteId",
        COUNT(participant."id")::integer AS "participantCount"
    FROM "Session" session
    LEFT JOIN "Participant" participant
        ON participant."sessionId" = session."id"
    WHERE session."ended" = true
      AND session."favoriteId" IS NOT NULL
    GROUP BY session."id"
),
"placements" AS (
    SELECT
        item."id" AS "itemId",
        completed."participantCount",
        quiz."size",
        CASE
            WHEN completed."favoriteId" = item."id" THEN 1
            ELSE eliminated."cluster" + 1
        END::integer AS "placement"
    FROM "QuizItem" item
    INNER JOIN "Quiz" quiz ON quiz."id" = item."quizId"
    INNER JOIN "completedSessions" completed
        ON completed."quizId" = item."quizId"
    LEFT JOIN LATERAL (
        SELECT match."cluster"
        FROM "SessionMatch" match
        WHERE match."sessionId" = completed."id"
          AND match."completed" = true
          AND match."winnerId" IS NOT NULL
          AND match."winnerId" <> item."id"
          AND (
              match."firstItemId" = item."id"
              OR match."secondItemId" = item."id"
          )
        LIMIT 1
    ) eliminated ON true
    WHERE completed."favoriteId" = item."id"
       OR eliminated."cluster" IS NOT NULL
),
"itemStats" AS (
    SELECT
        "itemId",
        COUNT(*) FILTER (WHERE "placement" = 1)::integer AS "sessionWins",
        COALESCE(
            SUM(("size" + 1 - "placement") * "participantCount"),
            0
        )::integer AS "weightedScore",
        COALESCE(
            SUM("placement" * "participantCount"),
            0
        )::integer AS "weightedPlacement"
    FROM "placements"
    GROUP BY "itemId"
)
UPDATE "QuizItem" item
SET
    "sessionWins" = stats."sessionWins",
    "weightedScore" = stats."weightedScore",
    "weightedPlacement" = stats."weightedPlacement"
FROM "itemStats" stats
WHERE stats."itemId" = item."id";
