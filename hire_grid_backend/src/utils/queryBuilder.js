const applyQueryModifiers = (baseQuery, reqQuery = {}, defaultOrder = "created_at DESC", userBranchId = null) => {
  let sql = baseQuery;
  const values = [];
  let paramIndex = 1;
  const whereClauses = [];

  // Branch-Based access filtering
  if (userBranchId) {
    if (sql.includes("FROM companies")) {
      whereClauses.push(`(
        EXISTS (
          SELECT 1 FROM company_branch_mappings cbm
          WHERE cbm.company_id = companies.id
            AND (cbm.assignment_scope = 'ALL' OR cbm.branch_id = $${paramIndex++})
        )
        OR NOT EXISTS (
          SELECT 1 FROM company_branch_mappings cbm2
          WHERE cbm2.company_id = companies.id
        )
      )`);
      values.push(userBranchId);
    } else if (sql.includes("FROM modules")) {
      whereClauses.push(`(
        (m.module_type = 'company' AND (
          EXISTS (
            SELECT 1 FROM company_branch_mappings cbm
            WHERE cbm.company_id = m.parent_id
              AND (cbm.assignment_scope = 'ALL' OR cbm.branch_id = $${paramIndex++})
          ) OR NOT EXISTS (
            SELECT 1 FROM company_branch_mappings cbm2
            WHERE cbm2.company_id = m.parent_id
          )
        ))
        OR
        (m.module_type != 'company' AND (
          EXISTS (
            SELECT 1 FROM content_branch_mappings cobm
            WHERE cobm.content_id = m.id AND cobm.content_type = 'module'
              AND (cobm.assignment_scope = 'ALL' OR cobm.branch_id = $${paramIndex++})
          ) OR NOT EXISTS (
            SELECT 1 FROM content_branch_mappings cobm2
            WHERE cobm2.content_id = m.id AND cobm2.content_type = 'module'
          )
        ))
      )`);
      values.push(userBranchId, userBranchId);
    } else if (sql.includes("FROM hierarchy_nodes")) {
      whereClauses.push(`(
        EXISTS (
          SELECT 1 FROM content_branch_mappings cobm
          WHERE cobm.content_id = hierarchy_nodes.id AND cobm.content_type = 'hierarchy_node'
            AND (cobm.assignment_scope = 'ALL' OR cobm.branch_id = $${paramIndex++})
        )
        OR NOT EXISTS (
          SELECT 1 FROM content_branch_mappings cobm2
          WHERE cobm2.content_id = hierarchy_nodes.id AND cobm2.content_type = 'hierarchy_node'
        )
      )`);
      values.push(userBranchId);
    }
  }

  // Parse where clauses
  for (const key of Object.keys(reqQuery)) {
    if (key.startsWith("where_")) {
      const field = key.replace("where_", "");
      const valStr = reqQuery[key];
      const colonIdx = valStr.indexOf(":");
      if (colonIdx !== -1) {
        const op = valStr.substring(0, colonIdx);
        const val = valStr.substring(colonIdx + 1);

        let sqlOp = "=";
        if (op === "==") sqlOp = "=";
        else if (op === "!=") sqlOp = "!=";
        else if (op === ">") sqlOp = ">";
        else if (op === "<") sqlOp = "<";

        // Map camelCase fields to snake_case for DB columns if necessary
        const colName = field === "parentId" ? "parent_id" :
                        field === "moduleType" ? "module_type" :
                        field === "accessType" ? "access_type" :
                        field === "isPlacementMission" ? "is_placement_mission" :
                        field === "cycleId" ? "cycle_id" : field;
        const dbField = sql.includes("FROM modules m") ? `m.${colName}` : colName;

        if (val === "null" || val === "undefined" || val === "") {
          if (sqlOp === "=") {
            whereClauses.push(`(${dbField} IS NULL OR ${dbField} = '')`);
          } else {
            whereClauses.push(`(${dbField} IS NOT NULL AND ${dbField} != '')`);
          }
        } else {
          whereClauses.push(`${dbField} ${sqlOp} $${paramIndex++}`);
          values.push(val);
        }
      }
    }
  }

  if (whereClauses.length > 0) {
    const lastFromIndex = sql.toLowerCase().lastIndexOf("from ");
    const outerWhereIndex = sql.toLowerCase().indexOf("where", lastFromIndex);

    if (outerWhereIndex !== -1) {
      sql += " AND " + whereClauses.join(" AND ");
    } else {
      sql += " WHERE " + whereClauses.join(" AND ");
    }
  }

  // Parse orderBy
  let orderBy = defaultOrder;
  if (reqQuery.orderBy) {
    const field = reqQuery.orderBy;
    const dir = reqQuery.orderDir || "asc";
    const colName = field === "createdAt" ? "created_at" : (field === "displayOrder" ? "display_order" : field);
    const dbField = sql.includes("FROM modules m") ? `m.${colName}` : colName;
    orderBy = `${dbField} ${dir}`;
  }

  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }

  // Parse limit & offset for server-side pagination
  if (reqQuery.limit !== undefined) {
    const limitVal = Math.min(Math.max(1, parseInt(reqQuery.limit, 10) || 20), 500);
    sql += ` LIMIT $${paramIndex++}`;
    values.push(limitVal);

    if (reqQuery.offset !== undefined) {
      const offsetVal = Math.max(0, parseInt(reqQuery.offset, 10) || 0);
      sql += ` OFFSET $${paramIndex++}`;
      values.push(offsetVal);
    } else if (reqQuery.page !== undefined) {
      const pageVal = Math.max(1, parseInt(reqQuery.page, 10) || 1);
      const offsetVal = (pageVal - 1) * limitVal;
      sql += ` OFFSET $${paramIndex++}`;
      values.push(offsetVal);
    }
  }

  return { sql, values };
};

module.exports = {
  applyQueryModifiers
};
