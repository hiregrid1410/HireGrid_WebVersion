-- ==============================================================================
-- Rollback: rollback_v8_platform_control.sql
-- Description: Safely removes platform column, constraints, and indexes added by v8.
-- Safety:
--   - Wrapped in a single transaction (BEGIN ... COMMIT)
--   - Drops ONLY the platform columns, constraints, and indexes added in v8
--   - Leaves all other columns and tables completely intact
-- ==============================================================================

BEGIN;

-- 1. companies
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_companies_platform;
DROP INDEX IF EXISTS idx_companies_platform;
ALTER TABLE companies DROP COLUMN IF EXISTS platform;

-- 2. branches
ALTER TABLE branches DROP CONSTRAINT IF EXISTS chk_branches_platform;
DROP INDEX IF EXISTS idx_branches_platform;
ALTER TABLE branches DROP COLUMN IF EXISTS platform;

-- 3. hierarchy_nodes
ALTER TABLE hierarchy_nodes DROP CONSTRAINT IF EXISTS chk_hierarchy_nodes_platform;
DROP INDEX IF EXISTS idx_hierarchy_nodes_platform;
ALTER TABLE hierarchy_nodes DROP COLUMN IF EXISTS platform;

-- 4. modules
ALTER TABLE modules DROP CONSTRAINT IF EXISTS chk_modules_platform;
DROP INDEX IF EXISTS idx_modules_platform;
ALTER TABLE modules DROP COLUMN IF EXISTS platform;

-- 5. plans
ALTER TABLE plans DROP CONSTRAINT IF EXISTS chk_plans_platform;
DROP INDEX IF EXISTS idx_plans_platform;
ALTER TABLE plans DROP COLUMN IF EXISTS platform;

-- 6. revision_modules
ALTER TABLE revision_modules DROP CONSTRAINT IF EXISTS chk_revision_modules_platform;
DROP INDEX IF EXISTS idx_revision_modules_platform;
ALTER TABLE revision_modules DROP COLUMN IF EXISTS platform;

-- 7. exams
ALTER TABLE exams DROP CONSTRAINT IF EXISTS chk_exams_platform;
DROP INDEX IF EXISTS idx_exams_platform;
ALTER TABLE exams DROP COLUMN IF EXISTS platform;

-- 8. placement_mission_cycles
ALTER TABLE placement_mission_cycles DROP CONSTRAINT IF EXISTS chk_placement_mission_cycles_platform;
DROP INDEX IF EXISTS idx_placement_mission_cycles_platform;
ALTER TABLE placement_mission_cycles DROP COLUMN IF EXISTS platform;

-- Revert schema migration entry
DELETE FROM schema_migrations WHERE version = 'v8_platform_control';

COMMIT;
