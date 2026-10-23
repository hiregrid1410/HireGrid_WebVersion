-- ==============================================================================
-- Verification Script: verify_platform_migration.sql
-- Checks:
--   1. Column existence & default value for the 8 content tables
--   2. Check constraint existence on all 8 tables
--   3. Index existence on all 8 tables
--   4. Row counts: total vs 'both' vs != 'both' (must be 0 non-'both' right after migration)
-- ==============================================================================

\echo '=== 1. VERIFYING COLUMN DEFINITIONS ==='
SELECT 
    table_name, 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN (
    'companies', 
    'branches', 
    'hierarchy_nodes', 
    'modules', 
    'plans', 
    'revision_modules', 
    'exams', 
    'placement_mission_cycles'
) AND column_name = 'platform'
ORDER BY table_name;

\echo '=== 2. VERIFYING CONSTRAINTS ==='
SELECT 
    conrelid::regclass AS table_name, 
    conname AS constraint_name, 
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint 
WHERE conname IN (
    'chk_companies_platform', 
    'chk_branches_platform', 
    'chk_hierarchy_nodes_platform', 
    'chk_modules_platform', 
    'chk_plans_platform', 
    'chk_revision_modules_platform', 
    'chk_exams_platform', 
    'chk_placement_mission_cycles_platform'
)
ORDER BY table_name;

\echo '=== 3. VERIFYING INDEXES ==='
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE indexname IN (
    'idx_companies_platform',
    'idx_branches_platform',
    'idx_hierarchy_nodes_platform',
    'idx_modules_platform',
    'idx_plans_platform',
    'idx_revision_modules_platform',
    'idx_exams_platform',
    'idx_placement_mission_cycles_platform'
)
ORDER BY tablename;

\echo '=== 4. VERIFYING ROW COUNTS & DATA INTEGRITY ==='
SELECT 'companies' AS table_name, COUNT(*) AS total_rows, COUNT(*) FILTER (WHERE platform = 'both') AS both_rows, COUNT(*) FILTER (WHERE platform != 'both') AS non_both_rows FROM companies
UNION ALL
SELECT 'branches', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM branches
UNION ALL
SELECT 'hierarchy_nodes', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM hierarchy_nodes
UNION ALL
SELECT 'modules', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM modules
UNION ALL
SELECT 'plans', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM plans
UNION ALL
SELECT 'revision_modules', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM revision_modules
UNION ALL
SELECT 'exams', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM exams
UNION ALL
SELECT 'placement_mission_cycles', COUNT(*), COUNT(*) FILTER (WHERE platform = 'both'), COUNT(*) FILTER (WHERE platform != 'both') FROM placement_mission_cycles;
