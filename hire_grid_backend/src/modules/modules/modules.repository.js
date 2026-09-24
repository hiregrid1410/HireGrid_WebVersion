const { pool } = require("../../database/connection");
const crypto = require("crypto");
const { applyQueryModifiers } = require("../../utils/queryBuilder");
const { getUserBranchId } = require("../../services/accessChecker.service");
const cacheService = require("../../services/cache.service");
const { dbCache } = require("../../services/accessChecker.service");

class ModulesRepository {
  async getModules(query, user) {
    let role = "student";
    let userBranchId = null;
    if (user) {
      role = user.role || "student";
      if (role !== "admin" && role !== "content_manager") {
        userBranchId = await getUserBranchId(user.id);
      }
    }

    const cacheKey = `modules:role:${role}:branch:${userBranchId}:query:${JSON.stringify(query)}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    let filterClause = "";
    if (role !== "admin" && role !== "content_manager") {
      filterClause = " WHERE (m.publication_status = 'PUBLISHED' OR m.publication_status IS NULL)";
    }

    const baseQuery = `
      SELECT 
        m.id, 
        m.title, 
        m.module_type AS "moduleType", 
        m.parent_id AS "parentId", 
        m.description, 
        m.category, 
        m.time_limit AS "timeLimit", 
        m.pass_percentage AS "passPercentage", 
        m.marks_per_question AS "marksPerQuestion", 
        m.negative_marks AS "negativeMarks", 
        m.total_marks AS "totalMarks", 
        m.access_mode AS "accessMode", 
        m.access_type AS "accessType", 
        m.is_premium AS "isPremium", 
        m.price, 
        m.display_order AS "displayOrder", 
        m.is_master AS "isMaster", 
        m.sub_tests AS "subTests", 
        m.created_at AS "createdAt",
        m.created_by AS "createdBy",
        m.branch_id AS "branchId",
        m.publication_status AS "publicationStatus",
        m.is_placement_mission AS "isPlacementMission",
        m.cycle_id AS "cycleId",
        (SELECT COUNT(*) FROM questions q WHERE q.module_id = m.id) AS "questionCount"
      FROM modules m
      ${filterClause}
    `;
    const { sql, values } = applyQueryModifiers(baseQuery, query, 'COALESCE(m.display_order, 999999) ASC, m.created_at ASC', userBranchId);
    const result = await pool.query(sql, values);
    
    const formattedModules = result.rows.map(r => ({
      ...r,
      questions: []
    }));
    
    cacheService.set(cacheKey, formattedModules, 300);
    return formattedModules;
  }

  async saveModules(modulesList) {
    await pool.query("BEGIN");
    try {
      for (const m of modulesList) {
        await pool.query(
          `INSERT INTO modules (
            id, title, module_type, parent_id,
            description, category, time_limit, pass_percentage,
            marks_per_question, negative_marks, total_marks,
            access_mode, access_type, is_premium, price,
            display_order, is_master, sub_tests, created_by, branch_id,
            publication_status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
           ON CONFLICT (id) DO UPDATE 
           SET title = EXCLUDED.title, 
               module_type = EXCLUDED.module_type, 
               parent_id = EXCLUDED.parent_id,
               description = EXCLUDED.description,
               category = EXCLUDED.category,
               time_limit = EXCLUDED.time_limit,
               pass_percentage = EXCLUDED.pass_percentage,
               marks_per_question = EXCLUDED.marks_per_question,
               negative_marks = EXCLUDED.negative_marks,
               total_marks = EXCLUDED.total_marks,
               access_mode = EXCLUDED.access_mode,
               access_type = EXCLUDED.access_type,
               is_premium = EXCLUDED.is_premium,
               price = EXCLUDED.price,
               display_order = EXCLUDED.display_order,
               is_master = EXCLUDED.is_master,
               sub_tests = EXCLUDED.sub_tests,
               created_by = COALESCE(modules.created_by, EXCLUDED.created_by),
               branch_id = EXCLUDED.branch_id,
               publication_status = EXCLUDED.publication_status`,
          [
            m.id || crypto.randomUUID(), 
            m.title, 
            m.moduleType || 'general', 
            m.parentId || null,
            m.description || null,
            m.category || null,
            m.timeLimit || null,
            m.passPercentage || null,
            m.marksPerQuestion !== undefined ? m.marksPerQuestion : null,
            m.negativeMarks !== undefined ? m.negativeMarks : null,
            m.totalMarks || null,
            m.accessMode || null,
            m.accessType || null,
            m.isPremium !== undefined ? m.isPremium : null,
            m.price || null,
            m.displayOrder !== undefined ? m.displayOrder : (m.display_order !== undefined ? m.display_order : Math.floor(Date.now() / 1000)),
            m.isMaster !== undefined ? m.isMaster : false,
            JSON.stringify(m.subTestests || m.subTests || []),
            m.createdBy || null,
            m.branchId || m.branch_id || null,
            m.publicationStatus || m.publication_status || 'PUBLISHED'
          ]
        );

        if (m.questions && Array.isArray(m.questions) && m.questions.length > 0) {
          await pool.query("DELETE FROM questions WHERE module_id = $1", [m.id]);
          const BATCH_SIZE = 50;
          for (let i = 0; i < m.questions.length; i += BATCH_SIZE) {
            const chunk = m.questions.slice(i, i + BATCH_SIZE);
            const valueClauses = [];
            const values = [];
            let paramIdx = 1;

            chunk.forEach((q, idx) => {
              const qId = (q.id && typeof q.id === "string" && q.id.length > 20) ? q.id : crypto.randomUUID();
              const correctIndex = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : (q.correct_answer_index !== undefined ? q.correct_answer_index : null);
              const svgCode = q.image || q.svgCode || q.svg_code || null;
              const dispOrder = q.displayOrder !== undefined ? q.displayOrder : (i + idx);

              valueClauses.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
              values.push(qId, m.id, q.question, JSON.stringify(q.options || []), correctIndex, svgCode, dispOrder);
            });

            await pool.query(
              `INSERT INTO questions (
                id, module_id, question, options, correct_answer_index, svg_code, display_order
              ) VALUES ${valueClauses.join(", ")}
              ON CONFLICT (id) DO UPDATE
              SET module_id = EXCLUDED.module_id,
                  question = EXCLUDED.question,
                  options = EXCLUDED.options,
                  correct_answer_index = EXCLUDED.correct_answer_index,
                  svg_code = EXCLUDED.svg_code,
                  display_order = EXCLUDED.display_order`,
              values
            );
          }
        }
      }
      await pool.query("COMMIT");
      dbCache.clear();
      cacheService.invalidatePattern("modules");
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }

  async deleteModule(id) {
    await pool.query("DELETE FROM modules WHERE id = $1", [id]);
    dbCache.clear();
    cacheService.invalidatePattern("modules");
  }

  async getQuestionsAdmin(query) {
    const limit = parseInt(query.limit, 10) || 50;
    const offset = parseInt(query.offset, 10) || 0;
    const search = query.search ? String(query.search).trim() : null;

    let baseQuery = `
      SELECT q.id, q.module_id AS "moduleId", q.question, q.options, 
             q.correct_answer_index AS "correctAnswerIndex", q.svg_code AS "svgCode", 
             q.display_order AS "displayOrder", q.explanation, q.difficulty, q.status, 
             q.created_by AS "createdBy", q.updated_at AS "updatedAt", q.image_key AS "imageKey",
             m.title AS "moduleTitle",
             COUNT(*) OVER() AS "totalCount"
      FROM questions q
      LEFT JOIN modules m ON q.module_id = m.id
    `;

    const whereClauses = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`q.question ILIKE $${paramIndex++}`);
      values.push(`%${search}%`);
    }

    for (const key of Object.keys(query)) {
      if (key.startsWith('where_')) {
        const field = key.replace('where_', '');
        const valStr = query[key];
        const colonIdx = valStr.indexOf(':');
        if (colonIdx !== -1) {
          const op = valStr.substring(0, colonIdx);
          const val = valStr.substring(colonIdx + 1);
          let sqlOp = '=';
          if (op === '==') sqlOp = '=';
          else if (op === '!=') sqlOp = '!=';
          
          const colName = field === 'moduleId' ? 'module_id' : field;
          whereClauses.push(`q.${colName} ${sqlOp} $${paramIndex++}`);
          values.push(val);
        }
      }
    }

    if (whereClauses.length > 0) {
      baseQuery += " WHERE " + whereClauses.join(" AND ");
    }

    baseQuery += ` ORDER BY q.created_at DESC, q.id ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const result = await pool.query(baseQuery, values);
    const total = result.rows.length > 0 ? parseInt(result.rows[0].totalCount, 10) : 0;
    
    const questions = result.rows.map(r => {
      delete r.totalCount;
      return r;
    });

    return { questions, total };
  }
}

module.exports = new ModulesRepository();
