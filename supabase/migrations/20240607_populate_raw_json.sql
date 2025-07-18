-- Migration: Add and populate raw_json for contacts and deals tables only, using correct columns

-- 1. contacts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    EXECUTE 'ALTER TABLE "public"."contacts" ADD COLUMN IF NOT EXISTS raw_json JSONB';
    EXECUTE $upd$UPDATE "public"."contacts" SET raw_json = jsonb_build_object(
      ''id'', id,
      ''hubspotId'', "hubspotId",
      ''userId'', "userId",
      ''companyId'', "companyId",
      ''email'', email,
      ''firstName'', "firstName",
      ''lastName'', "lastName",
      ''phone'', phone,
      ''properties'', properties,
      ''isPotentialVAR'', "isPotentialVAR",
      ''lastSyncedAt'', "lastSyncedAt"
    ) WHERE raw_json IS NULL$upd$;
  END IF;
END$$;

-- 2. deals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    EXECUTE 'ALTER TABLE "public"."deals" ADD COLUMN IF NOT EXISTS raw_json JSONB';
    EXECUTE $upd$UPDATE "public"."deals" SET raw_json = jsonb_build_object(
      ''id'', id,
      ''hubspotId'', "hubspotId",
      ''name'', name,
      ''pipeline'', pipeline,
      ''stage'', stage,
      ''amount'', amount,
      ''closeDate'', "closeDate",
      ''properties'', properties,
      ''lastSyncedAt'', "lastSyncedAt"
    ) WHERE raw_json IS NULL$upd$;
  END IF;
END$$; 