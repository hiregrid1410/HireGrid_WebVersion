const { pool } = require("../../database/connection");
const crypto = require("crypto");
const { isValidPlatform, checkItemPlatformAccess } = require("../../utils/platformHelper");

class RevisionController {
  // ==========================================
  // ADMIN & CONTENT MANAGER: REVISION MODULES
  // ==========================================

  async getAdminRevisionModules(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          rm.id,
          rm.branch_id AS "branchId",
          rm.subject_id AS "subjectId",
          rm.topic_id AS "topicId",
          rm.title,
          rm.source_topic_id AS "sourceTopicId",
          rm.source_module_ids AS "sourceModuleIds",
          rm.mcq_count AS "mcqCount",
          rm.selection_mode AS "selectionMode",
          rm.is_active AS "isActive",
          rm.platform AS "platform",
          rm.created_at AS "createdAt",
          rm.updated_at AS "updatedAt",
          b.name AS "branchName",
          s.name AS "subjectName",
          t.name AS "topicName"
        FROM revision_modules rm
        LEFT JOIN hierarchy_nodes b ON rm.branch_id = b.id
        LEFT JOIN hierarchy_nodes s ON rm.subject_id = s.id
        LEFT JOIN hierarchy_nodes t ON rm.topic_id = t.id
        ORDER BY rm.created_at DESC
      `);

      const modulesWithPool = await Promise.all(
        result.rows.map(async (row) => {
          let poolCount = 0;
          const sourceTopicId = row.sourceTopicId || row.topicId;
          const sourceModIds = Array.isArray(row.sourceModuleIds) ? row.sourceModuleIds : [];

          if (sourceModIds.length > 0) {
            const countRes = await pool.query(
              `SELECT COUNT(*) FROM questions WHERE module_id = ANY($1::varchar[])`,
              [sourceModIds]
            );
            poolCount = parseInt(countRes.rows[0].count, 10);
          } else if (sourceTopicId) {
            const countRes = await pool.query(
              `SELECT COUNT(*) FROM questions q
               INNER JOIN modules m ON q.module_id = m.id
               WHERE m.parent_id = $1 OR q.module_id = $1`,
              [sourceTopicId]
            );
            poolCount = parseInt(countRes.rows[0].count, 10);
          }

          return {
            ...row,
            sourcePoolSize: poolCount
          };
        })
      );

      res.json({ success: true, revisionModules: modulesWithPool });
    } catch (err) {
      console.error("getAdminRevisionModules error:", err);
      res.status(500).json({ error: "Failed to fetch revision modules." });
    }
  }

  async getPoolSize(req, res) {
    const { topicId, moduleIds } = req.query;
    try {
      let poolCount = 0;
      let modIds = [];
      if (moduleIds) {
        modIds = typeof moduleIds === "string" ? moduleIds.split(",") : moduleIds;
      }

      if (modIds.length > 0) {
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM questions WHERE module_id = ANY($1::varchar[])`,
          [modIds]
        );
        poolCount = parseInt(countRes.rows[0].count, 10);
      } else if (topicId) {
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM questions q
           INNER JOIN modules m ON q.module_id = m.id
           WHERE m.parent_id = $1 OR q.module_id = $1`,
          [topicId]
        );
        poolCount = parseInt(countRes.rows[0].count, 10);
      }

      res.json({ success: true, poolCount });
    } catch (err) {
      console.error("getPoolSize error:", err);
      res.status(500).json({ error: "Failed to calculate pool size." });
    }
  }

  async saveAdminRevisionModule(req, res) {
    const {
      id,
      branchId,
      subjectId,
      topicId,
      title,
      sourceTopicId,
      sourceModuleIds,
      mcqCount,
      selectionMode,
      isActive,
      platform: rawPlatform
    } = req.body;
    const platform = rawPlatform !== undefined && rawPlatform !== null ? String(rawPlatform).toLowerCase() : "both";
    if (!isValidPlatform(platform)) {
      return res.status(400).json({ error: "Invalid platform value. Must be 'web', 'app', or 'both'." });
    }

    const rmId = id || crypto.randomUUID();
    const count = parseInt(mcqCount, 10) || 50;
    const active = isActive !== undefined ? Boolean(isActive) : true;
    const formattedSourceModuleIds = JSON.stringify(Array.isArray(sourceModuleIds) ? sourceModuleIds : []);

    if (!title) {
      return res.status(400).json({ error: "Revision module title is required." });
    }

    try {
      await pool.query(
        `INSERT INTO revision_modules (
          id, branch_id, subject_id, topic_id, title,
          source_topic_id, source_module_ids, mcq_count, selection_mode,
          is_active, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (id) DO UPDATE SET
          branch_id = EXCLUDED.branch_id,
          subject_id = EXCLUDED.subject_id,
          topic_id = EXCLUDED.topic_id,
          title = EXCLUDED.title,
          source_topic_id = EXCLUDED.source_topic_id,
          source_module_ids = EXCLUDED.source_module_ids,
          mcq_count = EXCLUDED.mcq_count,
          selection_mode = EXCLUDED.selection_mode,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()`,
        [
          rmId,
          branchId || null,
          subjectId || null,
          topicId || null,
          title,
          sourceTopicId || topicId || null,
          formattedSourceModuleIds,
          count,
          selectionMode || "random",
          active,
          platform
        ]
      );

      res.json({ success: true, message: "Revision module saved successfully.", id: rmId });
    } catch (err) {
      console.error("saveAdminRevisionModule error:", err);
      res.status(500).json({ error: "Failed to save revision module." });
    }
  }

  async deleteAdminRevisionModule(req, res) {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM revision_modules WHERE id = $1", [id]);
      res.json({ success: true, message: "Revision module deleted." });
    } catch (err) {
      console.error("deleteAdminRevisionModule error:", err);
      res.status(500).json({ error: "Failed to delete revision module." });
    }
  }

  // ==========================================
  // STUDENT / OPERATOR: REVISION FLOWS
  // ==========================================

  async getUserRevisionSchedules(req, res) {
    const userId = req.user.id;
    try {
      const result = await pool.query(
        `SELECT 
          urs.id,
          urs.user_id AS "userId",
          urs.topic_id AS "topicId",
          urs.module_id AS "moduleId",
          urs.completed_at AS "completedAt",
          urs.day1_due_at AS "day1DueAt",
          urs.day1_status AS "day1Status",
          urs.day3_due_at AS "day3DueAt",
          urs.day3_status AS "day3Status",
          urs.day7_due_at AS "day7DueAt",
          urs.day7_status AS "day7Status",
          t.name AS "topicName",
          s.name AS "subjectName",
          s.id AS "subjectId",
          b.name AS "branchName",
          b.id AS "branchId"
        FROM user_revision_schedules urs
        LEFT JOIN hierarchy_nodes t ON urs.topic_id = t.id
        LEFT JOIN hierarchy_nodes s ON t.parent_id = s.id
        LEFT JOIN hierarchy_nodes b ON s.parent_id = b.id
        WHERE urs.user_id = $1
        ORDER BY urs.completed_at DESC`,
        [userId]
      );

      const schedules = result.rows;
      const now = new Date();

      const todayDue = [];
      const upcoming = [];
      const completed = [];

      for (const sched of schedules) {
        let hasDueToday = false;
        let nextDue = null;
        let activeInterval = null;

        if (sched.day1Status === "pending" || sched.day1Status === "due") {
          const due = new Date(sched.day1DueAt);
          if (due <= now) {
            hasDueToday = true;
            activeInterval = "Day 1";
          } else if (!nextDue || due < nextDue) {
            nextDue = due;
            activeInterval = "Day 1";
          }
        }

        if (!hasDueToday && (sched.day3Status === "pending" || sched.day3Status === "due")) {
          const due = new Date(sched.day3DueAt);
          if (due <= now) {
            hasDueToday = true;
            activeInterval = "Day 3";
          } else if (!nextDue || due < nextDue) {
            nextDue = due;
            activeInterval = "Day 3";
          }
        }

        if (!hasDueToday && (sched.day7Status === "pending" || sched.day7Status === "due")) {
          const due = new Date(sched.day7DueAt);
          if (due <= now) {
            hasDueToday = true;
            activeInterval = "Day 7";
          } else if (!nextDue || due < nextDue) {
            nextDue = due;
            activeInterval = "Day 7";
          }
        }

        const isAllDone =
          sched.day1Status === "completed" &&
          sched.day3Status === "completed" &&
          sched.day7Status === "completed";

        if (hasDueToday) {
          todayDue.push({ ...sched, activeInterval, isDue: true });
        } else if (isAllDone) {
          completed.push(sched);
        } else {
          upcoming.push({ ...sched, nextDueAt: nextDue, activeInterval });
        }
      }

      res.json({
        success: true,
        schedules: {
          todayDue,
          upcoming,
          completed,
          all: schedules
        }
      });
    } catch (err) {
      console.error("getUserRevisionSchedules error:", err);
      res.status(500).json({ error: "Failed to fetch revision schedules." });
    }
  }

  async startRevisionTest(req, res) {
    const userId = req.user.id;
    const { topicId } = req.params;

    try {
      const role = req.user?.role || "student";
      const platform = req.platform;

      let rmRes;
      if (role !== "admin" && role !== "content_manager" && platform) {
        rmRes = await pool.query(
          `SELECT * FROM revision_modules WHERE topic_id = $1 AND is_active = true AND (platform = 'both' OR platform = $2) LIMIT 1`,
          [topicId, platform.toLowerCase()]
        );
      } else {
        rmRes = await pool.query(
          `SELECT * FROM revision_modules WHERE topic_id = $1 AND is_active = true LIMIT 1`,
          [topicId]
        );
      }

      let targetCount = 50;
      let sourceTopicId = topicId;
      let sourceModuleIds = [];
      let revisionModuleId = null;

      if (rmRes.rows.length > 0) {
        const rm = rmRes.rows[0];
        revisionModuleId = rm.id;
        targetCount = rm.mcq_count || 50;
        sourceTopicId = rm.source_topic_id || topicId;
        sourceModuleIds = Array.isArray(rm.source_module_ids) ? rm.source_module_ids : [];
      }

      let questionsResult;
      if (sourceModuleIds.length > 0) {
        questionsResult = await pool.query(
          `SELECT id, question_text, options, correct_option, explanation, image_key, explanation_image_key, module_id
           FROM questions
           WHERE module_id = ANY($1::varchar[])`,
          [sourceModuleIds]
        );
      } else {
        questionsResult = await pool.query(
          `SELECT q.id, q.question_text, q.options, q.correct_option, q.explanation, q.image_key, q.explanation_image_key, q.module_id
           FROM questions q
           INNER JOIN modules m ON q.module_id = m.id
           WHERE m.parent_id = $1 OR q.module_id = $1`,
          [sourceTopicId]
        );
      }

      let allQuestions = questionsResult.rows;
      if (allQuestions.length === 0) {
        return res.status(404).json({ error: "No MCQs found for this revision module pool." });
      }

      const lastAttemptRes = await pool.query(
        `SELECT mcq_ids FROM user_revision_attempts 
         WHERE user_id = $1 AND (topic_id = $2 OR revision_module_id = $3)
         ORDER BY attempted_at DESC LIMIT 1`,
        [userId, topicId, revisionModuleId]
      );

      let lastAttemptedIds = new Set();
      if (lastAttemptRes.rows.length > 0 && Array.isArray(lastAttemptRes.rows[0].mcq_ids)) {
        lastAttemptedIds = new Set(lastAttemptRes.rows[0].mcq_ids);
      }

      const unseenQuestions = [];
      const seenQuestions = [];

      for (const q of allQuestions) {
        if (lastAttemptedIds.has(q.id)) {
          seenQuestions.push(q);
        } else {
          unseenQuestions.push(q);
        }
      }

      const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      shuffle(unseenQuestions);
      shuffle(seenQuestions);

      let selectedQuestions = [];
      if (unseenQuestions.length >= targetCount) {
        selectedQuestions = unseenQuestions.slice(0, targetCount);
      } else {
        selectedQuestions = [
          ...unseenQuestions,
          ...seenQuestions.slice(0, targetCount - unseenQuestions.length)
        ];
      }

      shuffle(selectedQuestions);

      res.json({
        success: true,
        revisionModuleId,
        topicId,
        totalQuestions: selectedQuestions.length,
        targetCount,
        questions: selectedQuestions.map((q) => {
          let opts = q.options;
          if (typeof opts === "string") {
            try {
              opts = JSON.parse(opts);
            } catch (e) {
              opts = [];
            }
          }
          return {
            id: q.id,
            questionText: q.question_text,
            options: opts,
            correctOption: q.correct_option,
            explanation: q.explanation,
            imageKey: q.image_key,
            explanationImageKey: q.explanation_image_key,
            moduleId: q.module_id,
          };
        }),
      });
    } catch (err) {
      console.error("startRevisionTest error:", err);
      res.status(500).json({ error: "Failed to start revision test." });
    }
  }

  async submitRevisionTest(req, res) {
    const userId = req.user.id;
    const {
      revisionModuleId,
      topicId,
      mcqIds,
      answers,
      score,
      totalQuestions,
      timeTaken,
      intervalType
    } = req.body;

    const attemptId = crypto.randomUUID();

    try {
      await pool.query(
        `INSERT INTO user_revision_attempts (
          id, user_id, revision_module_id, topic_id, mcq_ids, answers, score, total_questions, time_taken, attempted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          attemptId,
          userId,
          revisionModuleId || "custom",
          topicId,
          JSON.stringify(Array.isArray(mcqIds) ? mcqIds : []),
          JSON.stringify(answers || {}),
          score || 0,
          totalQuestions || 50,
          timeTaken || 0
        ]
      );

      if (topicId) {
        const schedRes = await pool.query(
          `SELECT * FROM user_revision_schedules WHERE user_id = $1 AND topic_id = $2`,
          [userId, topicId]
        );

        if (schedRes.rows.length > 0) {
          const s = schedRes.rows[0];
          let updateField = null;

          if (intervalType === "Day 1" || s.day1_status !== "completed") {
            updateField = "day1_status";
          } else if (intervalType === "Day 3" || s.day3_status !== "completed") {
            updateField = "day3_status";
          } else if (intervalType === "Day 7" || s.day7_status !== "completed") {
            updateField = "day7_status";
          }

          if (updateField) {
            await pool.query(
              `UPDATE user_revision_schedules SET ${updateField} = 'completed', updated_at = NOW() WHERE id = $1`,
              [s.id]
            );
          }
        }
      }

      res.json({
        success: true,
        message: "Revision attempt submitted successfully.",
        attemptId,
        score
      });
    } catch (err) {
      console.error("submitRevisionTest error:", err);
      res.status(500).json({ error: "Failed to submit revision test." });
    }
  }

  async completeTopic(req, res) {
    const userId = req.user.id;
    const { topicId, moduleId } = req.body;

    if (!topicId) {
      return res.status(400).json({ error: "topicId is required." });
    }

    try {
      const now = new Date();
      const day1Due = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      const day3Due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const day7Due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const schedId = crypto.randomUUID();

      await pool.query(
        `INSERT INTO user_revision_schedules (
          id, user_id, topic_id, module_id, completed_at,
          day1_due_at, day1_status,
          day3_due_at, day3_status,
          day7_due_at, day7_status,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, 'pending', $8, 'pending', NOW(), NOW())
        ON CONFLICT (user_id, topic_id) DO UPDATE SET
          completed_at = EXCLUDED.completed_at,
          day1_due_at = EXCLUDED.day1_due_at,
          day3_due_at = EXCLUDED.day3_due_at,
          day7_due_at = EXCLUDED.day7_due_at,
          updated_at = NOW()`,
        [schedId, userId, topicId, moduleId || null, now, day1Due, day3Due, day7Due]
      );

      res.json({
        success: true,
        message: "Topic marked completed. Revision intervals scheduled for Day 1, 3, and 7."
      });
    } catch (err) {
      console.error("completeTopic error:", err);
      res.status(500).json({ error: "Failed to schedule topic revision." });
    }
  }
}

module.exports = new RevisionController();
