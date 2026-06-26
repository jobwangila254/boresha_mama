ALTER TABLE mothers ADD COLUMN IF NOT EXISTS completed_onboarding BOOLEAN DEFAULT false;
ALTER TABLE mothers ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;
