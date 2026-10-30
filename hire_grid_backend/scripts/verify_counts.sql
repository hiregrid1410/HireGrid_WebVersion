-- ==============================================================================
-- HireGrid Database Table Row Count Verification Script
-- Dynamically prints exact row count for EVERY public base table.
-- Run with: psql "$DATABASE_URL" -f scripts/verify_counts.sql
-- ==============================================================================

SELECT 
    table_name,
    (xpath('/row/cnt/text()', xml_count))[1]::text::bigint AS total_rows
FROM (
  SELECT 
    table_name, 
    query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;
