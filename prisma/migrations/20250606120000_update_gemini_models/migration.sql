-- Replace deprecated Gemini 1.5 enum values with Gemini 2.5

CREATE TYPE "AiModel_new" AS ENUM (
  'GPT_4O',
  'GPT_4O_MINI',
  'CLAUDE_35_SONNET',
  'GEMINI_25_PRO',
  'GEMINI_25_FLASH'
);

ALTER TABLE "UserSettings"
  ALTER COLUMN "defaultAiModel" DROP DEFAULT;

ALTER TABLE "UserSettings"
  ALTER COLUMN "defaultAiModel" TYPE "AiModel_new"
  USING (
    CASE "defaultAiModel"::text
      WHEN 'GEMINI_15_PRO' THEN 'GEMINI_25_PRO'
      WHEN 'GEMINI_15_FLASH' THEN 'GEMINI_25_FLASH'
      ELSE "defaultAiModel"::text
    END
  )::"AiModel_new";

ALTER TABLE "ContentWorkspace"
  ALTER COLUMN "aiModel" TYPE "AiModel_new"
  USING (
    CASE "aiModel"::text
      WHEN 'GEMINI_15_PRO' THEN 'GEMINI_25_PRO'
      WHEN 'GEMINI_15_FLASH' THEN 'GEMINI_25_FLASH'
      ELSE "aiModel"::text
    END
  )::"AiModel_new";

ALTER TABLE "UserSettings"
  ALTER COLUMN "defaultAiModel" SET DEFAULT 'GPT_4O';

DROP TYPE "AiModel";
ALTER TYPE "AiModel_new" RENAME TO "AiModel";
