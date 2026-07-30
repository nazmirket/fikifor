-- Enable indexed typo-tolerant discovery for published quizzes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Quiz_published_createdAt_idx"
    ON "Quiz"("published", "createdAt");

CREATE INDEX "Quiz_published_updatedAt_idx"
    ON "Quiz"("published", "updatedAt");

CREATE INDEX "Quiz_title_trgm_idx"
    ON "Quiz" USING GIN ("title" gin_trgm_ops);

CREATE INDEX "Quiz_description_trgm_idx"
    ON "Quiz" USING GIN ("description" gin_trgm_ops);
