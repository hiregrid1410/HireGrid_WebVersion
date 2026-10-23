-- ==============================================================================
-- HireGrid Database Table Row Count Verification Script
-- Prints row count for every table in the schema in a clean table format.
-- Run with: psql "$DATABASE_URL" -f scripts/verify_counts.sql
-- ==============================================================================

SELECT 
    table_name,
    total_rows
FROM (
    SELECT 'users' AS table_name, count(*)::bigint AS total_rows FROM users UNION ALL
    SELECT 'admin_users', count(*)::bigint FROM admin_users UNION ALL
    SELECT 'content_managers', count(*)::bigint FROM content_managers UNION ALL
    SELECT 'companies', count(*)::bigint FROM companies UNION ALL
    SELECT 'branches', count(*)::bigint FROM branches UNION ALL
    SELECT 'hierarchy_nodes', count(*)::bigint FROM hierarchy_nodes UNION ALL
    SELECT 'modules', count(*)::bigint FROM modules UNION ALL
    SELECT 'questions', count(*)::bigint FROM questions UNION ALL
    SELECT 'plans', count(*)::bigint FROM plans UNION ALL
    SELECT 'plan_mappings', count(*)::bigint FROM plan_mappings UNION ALL
    SELECT 'revision_modules', count(*)::bigint FROM revision_modules UNION ALL
    SELECT 'user_revision_schedules', count(*)::bigint FROM user_revision_schedules UNION ALL
    SELECT 'user_revision_attempts', count(*)::bigint FROM user_revision_attempts UNION ALL
    SELECT 'placement_mission_cycles', count(*)::bigint FROM placement_mission_cycles UNION ALL
    SELECT 'placement_mission_attempts', count(*)::bigint FROM placement_mission_attempts UNION ALL
    SELECT 'leaderboard_snapshots', count(*)::bigint FROM leaderboard_snapshots UNION ALL
    SELECT 'leaderboard_job_runs', count(*)::bigint FROM leaderboard_job_runs UNION ALL
    SELECT 'exams', count(*)::bigint FROM exams UNION ALL
    SELECT 'exam_questions', count(*)::bigint FROM exam_questions UNION ALL
    SELECT 'exam_attempts', count(*)::bigint FROM exam_attempts UNION ALL
    SELECT 'first_attempts', count(*)::bigint FROM first_attempts UNION ALL
    SELECT 'purchases', count(*)::bigint FROM purchases UNION ALL
    SELECT 'payment_requests', count(*)::bigint FROM payment_requests UNION ALL
    SELECT 'access_requests', count(*)::bigint FROM access_requests UNION ALL
    SELECT 'device_requests', count(*)::bigint FROM device_requests UNION ALL
    SELECT 'feedbacks', count(*)::bigint FROM feedbacks UNION ALL
    SELECT 'security_logs', count(*)::bigint FROM security_logs UNION ALL
    SELECT 'settings', count(*)::bigint FROM settings UNION ALL
    SELECT 'otps', count(*)::bigint FROM otps UNION ALL
    SELECT 'login_otps', count(*)::bigint FROM login_otps UNION ALL
    SELECT 'company_branch_mappings', count(*)::bigint FROM company_branch_mappings UNION ALL
    SELECT 'content_branch_mappings', count(*)::bigint FROM content_branch_mappings UNION ALL
    SELECT 'notifications', count(*)::bigint FROM notifications UNION ALL
    SELECT 'gate_branches', count(*)::bigint FROM gate_branches UNION ALL
    SELECT 'gate_papers', count(*)::bigint FROM gate_papers UNION ALL
    SELECT 'schema_migrations', count(*)::bigint FROM schema_migrations
) sub
ORDER BY table_name ASC;
