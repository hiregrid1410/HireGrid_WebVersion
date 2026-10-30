-- ==============================================================================
-- Rollback Migration: rollback_v9_platform_control.sql
-- Description: Reverts v9_platform_control by restoring DEFAULT 'both' and updating rows.
-- Safety:
--   - Wrapped in a single transaction (BEGIN ... COMMIT)
--   - No tables or non-platform columns are dropped
-- ==============================================================================

BEGIN;

-- 1. companies
ALTER TABLE companies ALTER COLUMN platform SET DEFAULT 'both';
UPDATE companies SET platform = 'both';

-- 2. branches
ALTER TABLE branches ALTER COLUMN platform SET DEFAULT 'both';
UPDATE branches SET platform = 'both';

-- 3. hierarchy_nodes
ALTER TABLE hierarchy_nodes ALTER COLUMN platform SET DEFAULT 'both';
UPDATE hierarchy_nodes SET platform = 'both';

-- 4. modules
ALTER TABLE modules ALTER COLUMN platform SET DEFAULT 'both';
UPDATE modules SET platform = 'both';

-- 5. plans
ALTER TABLE plans ALTER COLUMN platform SET DEFAULT 'both';
UPDATE plans SET platform = 'both';

-- 6. revision_modules
ALTER TABLE revision_modules ALTER COLUMN platform SET DEFAULT 'both';
UPDATE revision_modules SET platform = 'both';

-- 7. exams
ALTER TABLE exams ALTER COLUMN platform SET DEFAULT 'both';
UPDATE exams SET platform = 'both';

-- 8. placement_mission_cycles
ALTER TABLE placement_mission_cycles ALTER COLUMN platform SET DEFAULT 'both';
UPDATE placement_mission_cycles SET platform = 'both';

-- Remove migration version record
DELETE FROM schema_migrations WHERE version = 'v9_platform_control';

COMMIT;
