-- Map legacy enum values to provider-native model IDs, then store as text.

ALTER TABLE "UserSettings" ALTER COLUMN "defaultAiModel" DROP DEFAULT;

ALTER TABLE "UserSettings"
ALTER COLUMN "defaultAiModel" TYPE TEXT USING (
  CASE "defaultAiModel"::text
    WHEN 'GPT_4O' THEN 'gpt-4o'
    WHEN 'GPT_4O_MINI' THEN 'gpt-4o-mini'
    WHEN 'CLAUDE_35_SONNET' THEN 'claude-sonnet-4-20250514'
    WHEN 'GEMINI_25_PRO' THEN 'gemini-2.5-pro'
    WHEN 'GEMINI_25_FLASH' THEN 'gemini-2.5-flash'
    ELSE "defaultAiModel"::text
  END
);

ALTER TABLE "UserSettings" ALTER COLUMN "defaultAiModel" SET DEFAULT 'gpt-4o';

ALTER TABLE "ContentWorkspace"
ALTER COLUMN "aiModel" TYPE TEXT USING (
  CASE "aiModel"::text
    WHEN 'GPT_4O' THEN 'gpt-4o'
    WHEN 'GPT_4O_MINI' THEN 'gpt-4o-mini'
    WHEN 'CLAUDE_35_SONNET' THEN 'claude-sonnet-4-20250514'
    WHEN 'GEMINI_25_PRO' THEN 'gemini-2.5-pro'
    WHEN 'GEMINI_25_FLASH' THEN 'gemini-2.5-flash'
    ELSE "aiModel"::text
  END
);

ALTER TABLE "ContentWorkspace"
ALTER COLUMN "imageModel" TYPE TEXT USING (
  CASE
    WHEN "imageModel" IS NULL THEN NULL
    WHEN "imageModel"::text = 'IMAGEN_3_PRO' THEN 'imagen-3.0-generate-002'
    WHEN "imageModel"::text = 'IMAGEN_3_FAST' THEN 'imagen-3.0-fast-generate-001'
    WHEN "imageModel"::text = 'DALL_E_3' THEN 'dall-e-3'
    ELSE "imageModel"::text
  END
);

DROP TYPE "AiImageModel";
DROP TYPE "AiModel";
