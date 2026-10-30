-- ==============================================================================
-- Migration: v9_platform_control.sql
-- Description: Platform control ('web', 'app', 'both') for 8 content tables.
-- Production Rule: Existing production rows default to 'web'.
-- Safety:
--   - Wrapped in a single transaction (BEGIN ... COMMIT)
--   - Additive & Idempotent
--   - Exactly ONE UPDATE per table setting platform = 'web'
--   - Row counts stay 100% identical
-- ==============================================================================

BEGIN;

-- 1. companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE companies ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_companies_platform') THEN
        ALTER TABLE companies ADD CONSTRAINT chk_companies_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_companies_platform ON companies(platform);
UPDATE companies SET platform = 'web';

-- 2. branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE branches ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_branches_platform') THEN
        ALTER TABLE branches ADD CONSTRAINT chk_branches_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_branches_platform ON branches(platform);
UPDATE branches SET platform = 'web';

-- 3. hierarchy_nodes
ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE hierarchy_nodes ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_hierarchy_nodes_platform') THEN
        ALTER TABLE hierarchy_nodes ADD CONSTRAINT chk_hierarchy_nodes_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_platform ON hierarchy_nodes(platform);
UPDATE hierarchy_nodes SET platform = 'web';

-- 4. modules
ALTER TABLE modules ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE modules ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_modules_platform') THEN
        ALTER TABLE modules ADD CONSTRAINT chk_modules_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_modules_platform ON modules(platform);
UPDATE modules SET platform = 'web';

-- 5. plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE plans ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_plans_platform') THEN
        ALTER TABLE plans ADD CONSTRAINT chk_plans_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_plans_platform ON plans(platform);
UPDATE plans SET platform = 'web';

-- 6. revision_modules
ALTER TABLE revision_modules ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE revision_modules ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_revision_modules_platform') THEN
        ALTER TABLE revision_modules ADD CONSTRAINT chk_revision_modules_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_revision_modules_platform ON revision_modules(platform);
UPDATE revision_modules SET platform = 'web';

-- 7. exams
ALTER TABLE exams ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE exams ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_exams_platform') THEN
        ALTER TABLE exams ADD CONSTRAINT chk_exams_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_exams_platform ON exams(platform);
UPDATE exams SET platform = 'web';

-- 8. placement_mission_cycles
ALTER TABLE placement_mission_cycles ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web';
ALTER TABLE placement_mission_cycles ALTER COLUMN platform SET DEFAULT 'web';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_placement_mission_cycles_platform') THEN
        ALTER TABLE placement_mission_cycles ADD CONSTRAINT chk_placement_mission_cycles_platform CHECK (platform IN ('web', 'app', 'both'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_placement_mission_cycles_platform ON placement_mission_cycles(platform);
UPDATE placement_mission_cycles SET platform = 'web';

-- Track schema migration
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO schema_migrations (version) VALUES ('v9_platform_control') ON CONFLICT (version) DO NOTHING;

COMMIT;
