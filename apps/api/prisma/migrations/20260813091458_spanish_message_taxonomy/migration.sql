-- Translates MessageCategory and Tone enum values to Spanish, preserving existing rows.
-- Postgres can't rename/remove individual enum values in place, so each type is recreated
-- and every column using it is cast through an explicit CASE mapping (not just relying on
-- position/ordinal, which would silently corrupt data if the two enums ever drift).

-- ── MessageCategory ─────────────────────────────────────────────────────
CREATE TYPE "MessageCategory_new" AS ENUM (
  'animo', 'empatia', 'reflexion', 'anticipacion', 'logro', 'resiliencia',
  'identidad', 'autocontrol', 'esperanza', 'compania', 'recordatorio',
  'intervencion_impulso', 'recuperacion_recaida'
);

ALTER TABLE "MessageTemplate" ALTER COLUMN "category" TYPE "MessageCategory_new" USING (
  CASE "category"::text
    WHEN 'encouragement' THEN 'animo'
    WHEN 'empathy' THEN 'empatia'
    WHEN 'reflection' THEN 'reflexion'
    WHEN 'anticipation' THEN 'anticipacion'
    WHEN 'achievement' THEN 'logro'
    WHEN 'resilience' THEN 'resiliencia'
    WHEN 'identity' THEN 'identidad'
    WHEN 'self_control' THEN 'autocontrol'
    WHEN 'hope' THEN 'esperanza'
    WHEN 'companionship' THEN 'compania'
    WHEN 'reminder' THEN 'recordatorio'
    WHEN 'craving_intervention' THEN 'intervencion_impulso'
    WHEN 'relapse_recovery' THEN 'recuperacion_recaida'
  END
)::"MessageCategory_new";

ALTER TABLE "Notification" ALTER COLUMN "category" TYPE "MessageCategory_new" USING (
  CASE "category"::text
    WHEN 'encouragement' THEN 'animo'
    WHEN 'empathy' THEN 'empatia'
    WHEN 'reflection' THEN 'reflexion'
    WHEN 'anticipation' THEN 'anticipacion'
    WHEN 'achievement' THEN 'logro'
    WHEN 'resilience' THEN 'resiliencia'
    WHEN 'identity' THEN 'identidad'
    WHEN 'self_control' THEN 'autocontrol'
    WHEN 'hope' THEN 'esperanza'
    WHEN 'companionship' THEN 'compania'
    WHEN 'reminder' THEN 'recordatorio'
    WHEN 'craving_intervention' THEN 'intervencion_impulso'
    WHEN 'relapse_recovery' THEN 'recuperacion_recaida'
  END
)::"MessageCategory_new";

DROP TYPE "MessageCategory";
ALTER TYPE "MessageCategory_new" RENAME TO "MessageCategory";

-- ── Tone ─────────────────────────────────────────────────────────────────
ALTER TABLE "MessageTemplate" ALTER COLUMN "tone" DROP DEFAULT;

CREATE TYPE "Tone_new" AS ENUM ('CALIDO', 'CALMADO', 'DIRECTO', 'JUGUETON', 'SERIO');

ALTER TABLE "MessageTemplate" ALTER COLUMN "tone" TYPE "Tone_new" USING (
  CASE "tone"::text
    WHEN 'WARM' THEN 'CALIDO'
    WHEN 'CALM' THEN 'CALMADO'
    WHEN 'DIRECT' THEN 'DIRECTO'
    WHEN 'PLAYFUL' THEN 'JUGUETON'
    WHEN 'SERIOUS' THEN 'SERIO'
  END
)::"Tone_new";

ALTER TABLE "Notification" ALTER COLUMN "tone" TYPE "Tone_new" USING (
  CASE "tone"::text
    WHEN 'WARM' THEN 'CALIDO'
    WHEN 'CALM' THEN 'CALMADO'
    WHEN 'DIRECT' THEN 'DIRECTO'
    WHEN 'PLAYFUL' THEN 'JUGUETON'
    WHEN 'SERIOUS' THEN 'SERIO'
  END
)::"Tone_new";

DROP TYPE "Tone";
ALTER TYPE "Tone_new" RENAME TO "Tone";

ALTER TABLE "MessageTemplate" ALTER COLUMN "tone" SET DEFAULT 'CALIDO';
