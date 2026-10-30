-- ==============================================================================
-- Verification Script: verify_platform_migration.sql
-- Checks:
--   1. Column existence & default value ('web') for the 8 content tables
--   2. Check constraint existence on all 8 tables
--   3. Index existence on all 8 tables
--   4. Row counts: total vs 'web' vs 'app' vs 'both'
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

\echo '=== 4. VERIFYING ROW COUNTS & PLATFORM DISTRIBUTION ==='
SELECT 
    table_name,
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE platform = 'web') AS web_rows,
    COUNT(*) FILTER (WHERE platform = 'app') AS app_rows,
    COUNT(*) FILTER (WHERE platform = 'both') AS both_rows
FROM (
    SELECT 'companies' AS table_name, platform FROM companies
    UNION ALL SELECT 'branches', platform FROM branches
    UNION ALL SELECT 'hierarchy_nodes', platform FROM hierarchy_nodes
    UNION ALL SELECT 'modules', platform FROM modules
    UNION ALL SELECT 'plans', platform FROM plans
    UNION ALL SELECT 'revision_modules', platform FROM revision_modules
    UNION ALL SELECT 'exams', platform FROM exams
    UNION ALL SELECT 'placement_mission_cycles', platform FROM placement_mission_cycles
) t
GROUP BY table_name
ORDER BY table_name;
