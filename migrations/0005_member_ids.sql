UPDATE "user"
SET "memberId" = 'COG-' || substr('000000' || (numbered."offset" + numbered."position"), -6)
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS "position",
        (SELECT COALESCE(MAX(CAST(substr("memberId", 5) AS INTEGER)), 0) FROM "user" WHERE "memberId" LIKE 'COG-%') AS "offset"
    FROM "user"
    WHERE "status" = 'approved' AND "memberId" IS NULL AND COALESCE("role", 'member') = 'member'
) AS numbered
WHERE "user"."id" = numbered."id";

INSERT INTO "application_counter" ("key", "value")
SELECT 'member', COALESCE(MAX(CAST(substr("memberId", 5) AS INTEGER)), 0) FROM "user" WHERE "memberId" LIKE 'COG-%'
ON CONFLICT ("key") DO UPDATE SET "value" = MAX("value", excluded."value");
