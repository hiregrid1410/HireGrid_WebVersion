const { pool } = require("../config/db");
const crypto = require("crypto");

// ==========================================
// ADMIN & CONTENT MANAGER: REVISION MODULES
// ==========================================

exports.getAdminRevisionModules = async (req, res) => {
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

    // For each revision module, compute source MCQ pool size
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
};

exports.getPoolSize = async (req, res) => {
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
};

exports.saveAdminRevisionModule = async (req, res) => {
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
    isActive
  } = req.body;

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
        active
      ]
    );

    res.json({ success: true, id: rmId, message: "Revision module saved successfully." });
  } catch (err) {
    console.error("saveAdminRevisionModule error:", err);
    res.status(500).json({ error: "Failed to save revision module." });
  }
};

exports.deleteAdminRevisionModule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM revision_modules WHERE id = $1", [id]);
    res.json({ success: true, message: "Revision module deleted successfully." });
  } catch (err) {
    console.error("deleteAdminRevisionModule error:", err);
    res.status(500).json({ error: "Failed to delete revision module." });
  }
};

// ==========================================
// STUDENT REVISION SCHEDULER & FLOW
// ==========================================

// Complete a topic/module and initialize/refresh spaced repetition schedule (+1, +3, +7 days)
exports.completeTopic = async (req, res) => {
  const { topicId, topicName, subjectId, moduleId, score } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!userId || !topicId) {
    return res.status(400).json({ error: "User ID and Topic ID are required." });
  }

  try {
    const schedId = crypto.randomUUID();
    const now = new Date();
    const day1Due = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const day3Due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const day7Due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO user_revision_schedules (
        id, user_id, topic_id, module_id, completed_at,
        day1_due_at, day1_status,
        day3_due_at, day3_status,
        day7_due_at, day7_status,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, 'pending', $8, 'pending', NOW())
      ON CONFLICT (user_id, topic_id) DO UPDATE SET
        module_id = COALESCE(EXCLUDED.module_id, user_revision_schedules.module_id),
        completed_at = EXCLUDED.completed_at,
        day1_due_at = EXCLUDED.day1_due_at,
        day1_status = 'pending',
        day3_due_at = EXCLUDED.day3_due_at,
        day3_status = 'pending',
        day7_due_at = EXCLUDED.day7_due_at,
        day7_status = 'pending',
        updated_at = NOW()`,
      [schedId, userId, topicId, moduleId || null, now, day1Due, day3Due, day7Due]
    );

    res.json({ success: true, message: "Topic completion logged and spaced repetition scheduled." });
  } catch (err) {
    console.error("completeTopic error:", err);
    res.status(500).json({ error: "Failed to record topic completion." });
  }
};

// Fetch Student's Revision Overview (Today's Due, Upcoming, Completed, and Subject Unlocks)
exports.getUserRevisionSchedules = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    // 1. Fetch all active revision modules
    const revModsRes = await pool.query(`
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
        b.name AS "branchName",
        s.name AS "subjectName",
        t.name AS "topicName"
      FROM revision_modules rm
      LEFT JOIN hierarchy_nodes b ON rm.branch_id = b.id
      LEFT JOIN hierarchy_nodes s ON rm.subject_id = s.id
      LEFT JOIN hierarchy_nodes t ON rm.topic_id = t.id
      WHERE rm.is_active = true
      ORDER BY rm.created_at ASC
    `);
    const revisionModules = revModsRes.rows;

    // 2. Fetch user's revision schedules
    const schedulesRes = await pool.query(
      `SELECT * FROM user_revision_schedules WHERE user_id = $1`,
      [userId]
    );
    const scheduleMap = {};
    schedulesRes.rows.forEach((s) => {
      scheduleMap[s.topic_id] = s;
    });

    // 3. Fetch user's completed modules from first_attempts & users.module_scores
    const userScoresRes = await pool.query(
      `SELECT module_scores FROM users WHERE id = $1`,
      [userId]
    );
    let userModuleScores = {};
    if (userScoresRes.rows.length > 0 && userScoresRes.rows[0].module_scores) {
      userModuleScores = typeof userScoresRes.rows[0].module_scores === "string" 
        ? JSON.parse(userScoresRes.rows[0].module_scores) 
        : userScoresRes.rows[0].module_scores;
    }

    const firstAttemptsRes = await pool.query(
      `SELECT module_id FROM first_attempts WHERE user_id = $1`,
      [userId]
    );
    const completedModuleIds = new Set(firstAttemptsRes.rows.map((r) => r.module_id));
    Object.keys(userModuleScores).forEach((mId) => completedModuleIds.add(mId));

    // 4. Fetch all modules per subject to evaluate subject completion / unlock status
    const allModulesRes = await pool.query(`
      SELECT m.id, m.parent_id AS "parentId", hn.parent_id AS "subjectParentId"
      FROM modules m
      LEFT JOIN hierarchy_nodes hn ON m.parent_id = hn.id
      WHERE m.publication_status = 'PUBLISHED' OR m.publication_status IS NULL
    `);

    // Map subject_id -> array of module IDs under that subject (direct modules or under topic children)
    const subjectModulesMap = {};
    allModulesRes.rows.forEach((mod) => {
      // If direct child of subject
      if (mod.parentId) {
        if (!subjectModulesMap[mod.parentId]) subjectModulesMap[mod.parentId] = [];
        subjectModulesMap[mod.parentId].push(mod.id);
      }
      // If child of a topic under subject
      if (mod.subjectParentId) {
        if (!subjectModulesMap[mod.subjectParentId]) subjectModulesMap[mod.subjectParentId] = [];
        subjectModulesMap[mod.subjectParentId].push(mod.id);
      }
    });

    const now = new Date();
    const todayDue = [];
    const upcoming = [];
    const completed = [];
    const allCards = [];

    for (const rm of revisionModules) {
      const subjectId = rm.subjectId;
      const topicId = rm.topicId || rm.sourceTopicId;
      
      // Determine Subject Completion / Unlock Status
      const subjectModList = subjectModulesMap[subjectId] || [];
      let totalSubjectMods = subjectModList.length;
      let completedSubjectMods = subjectModList.filter((mId) => completedModuleIds.has(mId)).length;
      
      // If no modules registered under subject, consider unlocked by default
      let isUnlocked = totalSubjectMods === 0 || completedSubjectMods >= totalSubjectMods;
      
      const sched = scheduleMap[topicId];

      const itemBase = {
        revisionModuleId: rm.id,
        title: rm.title,
        branchId: rm.branchId,
        branchName: rm.branchName || "General Branch",
        subjectId: rm.subjectId,
        subjectName: rm.subjectName || "General Subject",
        topicId: topicId,
        topicName: rm.topicName || "Topic",
        mcqCount: rm.mcqCount || 50,
        isUnlocked,
        progress: {
          completedModules: completedSubjectMods,
          totalModules: totalSubjectMods,
          percentage: totalSubjectMods > 0 ? Math.round((completedSubjectMods / totalSubjectMods) * 100) : 100
        }
      };

      if (sched) {
        // Evaluate Day 1
        const d1Due = new Date(sched.day1_due_at);
        const d3Due = new Date(sched.day3_due_at);
        const d7Due = new Date(sched.day7_due_at);

        const stages = [
          { stage: "day1", label: "Day 1", dueAt: d1Due, status: sched.day1_status },
          { stage: "day3", label: "Day 3", dueAt: d3Due, status: sched.day3_status },
          { stage: "day7", label: "Day 7", dueAt: d7Due, status: sched.day7_status }
        ];

        stages.forEach((st) => {
          const entry = {
            ...itemBase,
            scheduleId: sched.id,
            stage: st.stage,
            stageLabel: st.label,
            dueAt: st.dueAt,
            status: st.status
          };

          if (st.status === "completed") {
            completed.push(entry);
          } else if (st.dueAt <= now) {
            todayDue.push(entry);
          } else {
            upcoming.push(entry);
          }
        });
      } else {
        // Has not started yet; add default Day 1 entry
        const entry = {
          ...itemBase,
          stage: "day1",
          stageLabel: "Day 1",
          dueAt: now,
          status: "pending"
        };
        if (isUnlocked) {
          todayDue.push(entry);
        } else {
          upcoming.push(entry);
        }
      }

      allCards.push(itemBase);
    }

    res.json({
      success: true,
      todayDue,
      upcoming,
      completed,
      revisionModules: allCards
    });
  } catch (err) {
    console.error("getUserRevisionSchedules error:", err);
    res.status(500).json({ error: "Failed to fetch revision schedules." });
  }
};

// Start Revision Test with Random Sampling & Un-seen MCQ Preference
exports.startRevisionTest = async (req, res) => {
  const { topicId } = req.params; // Can be revision_module_id or topic_id
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    // 1. Locate Revision Module
    let revMod = null;
    const revModRes = await pool.query(
      `SELECT * FROM revision_modules WHERE id = $1 OR topic_id = $1 OR source_topic_id = $1 LIMIT 1`,
      [topicId]
    );
    if (revModRes.rows.length > 0) {
      revMod = revModRes.rows[0];
    }

    const targetTopicId = revMod ? (revMod.source_topic_id || revMod.topic_id) : topicId;
    const targetCount = revMod ? (revMod.mcq_count || 50) : 50;
    const sourceModuleIds = revMod && Array.isArray(revMod.source_module_ids) ? revMod.source_module_ids : [];

    // 2. Fetch candidate questions from pool
    let qRes;
    if (sourceModuleIds.length > 0) {
      qRes = await pool.query(
        `SELECT id, question, options, correct_answer_index AS "correctAnswerIndex", svg_code AS "svgCode", explanation
         FROM questions WHERE module_id = ANY($1::varchar[])`,
        [sourceModuleIds]
      );
    } else {
      qRes = await pool.query(
        `SELECT q.id, q.question, q.options, q.correct_answer_index AS "correctAnswerIndex", q.svg_code AS "svgCode", q.explanation
         FROM questions q
         INNER JOIN modules m ON q.module_id = m.id
         WHERE m.parent_id = $1 OR q.module_id = $1`,
        [targetTopicId]
      );
    }

    // Fallback to revision_questions table if present
    if (qRes.rows.length === 0) {
      qRes = await pool.query(
        `SELECT id, question, options, correct_answer_index AS "correctAnswerIndex", svg_code AS "svgCode", explanation
         FROM revision_questions WHERE topic_id = $1 OR module_id = $1`,
        [targetTopicId]
      );
    }

    const allPoolQuestions = qRes.rows;
    if (allPoolQuestions.length === 0) {
      return res.status(404).json({ error: "No revision MCQs available for this topic yet." });
    }

    // 3. Get MCQ IDs seen in user's last revision attempt to prioritize un-seen questions
    const lastAttemptRes = await pool.query(
      `SELECT mcq_ids FROM user_revision_attempts 
       WHERE user_id = $1 AND (revision_module_id = $2 OR topic_id = $3)
       ORDER BY attempted_at DESC LIMIT 1`,
      [userId, revMod ? revMod.id : targetTopicId, targetTopicId]
    );
    let lastSeenIds = new Set();
    if (lastAttemptRes.rows.length > 0 && lastAttemptRes.rows[0].mcq_ids) {
      const raw = lastAttemptRes.rows[0].mcq_ids;
      const parsed = Array.isArray(raw) ? raw : JSON.parse(raw);
      parsed.forEach((id) => lastSeenIds.add(id));
    }

    // Partition candidate questions into unseen vs seen
    const unseenQuestions = [];
    const seenQuestions = [];
    allPoolQuestions.forEach((q) => {
      if (lastSeenIds.has(q.id)) {
        seenQuestions.push(q);
      } else {
        unseenQuestions.push(q);
      }
    });

    // Shuffle helper (Fisher-Yates)
    const shuffle = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const shuffledUnseen = shuffle(unseenQuestions);
    const shuffledSeen = shuffle(seenQuestions);

    let selectedQuestions = [];
    if (shuffledUnseen.length >= targetCount) {
      selectedQuestions = shuffledUnseen.slice(0, targetCount);
    } else {
      selectedQuestions = [...shuffledUnseen, ...shuffledSeen.slice(0, targetCount - shuffledUnseen.length)];
    }

    if (selectedQuestions.length === 0) {
      selectedQuestions = shuffle(allPoolQuestions).slice(0, targetCount);
    }

    // 4. Create session in exam_attempts
    const attemptId = crypto.randomUUID();
    const now = Date.now();
    const durationMinutes = Math.max(15, Math.ceil(selectedQuestions.length * 1.5));
    const expiresAt = now + (durationMinutes * 60 * 1000);
    const questionIds = selectedQuestions.map((q) => q.id);

    await pool.query(
      `INSERT INTO exam_attempts (
        id, user_id, module_id, started_at, expires_at, status, violation_count, last_activity, answers
      ) VALUES ($1, $2, $3, $4, $5, 'active', 0, $6, $7)`,
      [
        attemptId,
        userId,
        revMod ? revMod.id : targetTopicId,
        now,
        expiresAt,
        now,
        JSON.stringify({ 
          _question_order: questionIds,
          _revision_module_id: revMod ? revMod.id : null,
          _topic_id: targetTopicId,
          _stage: req.body.stage || "day1"
        })
      ]
    );

    // Return safe questions without revealing correct answer index upfront
    const safeQuestions = selectedQuestions.map((q) => {
      let opts = q.options;
      if (typeof opts === "string") {
        try { opts = JSON.parse(opts); } catch (_) {}
      }
      return {
        id: q.id,
        question: q.question,
        options: opts,
        svgCode: q.svgCode,
        correctAnswerIndex: null
      };
    });

    res.json({
      success: true,
      attemptId,
      revisionModuleId: revMod ? revMod.id : null,
      topicId: targetTopicId,
      testTitle: revMod ? revMod.title : "Module Revision Assessment",
      totalQuestions: safeQuestions.length,
      timeLeft: durationMinutes * 60,
      questions: safeQuestions
    });
  } catch (err) {
    console.error("startRevisionTest error:", err);
    res.status(500).json({ error: "Failed to generate revision assessment." });
  }
};

// Submit Revision Test and Update Spaced Repetition Schedule
exports.submitRevisionTest = async (req, res) => {
  const { attemptId, answers = {}, timeTaken = 0 } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!userId || !attemptId) {
    return res.status(400).json({ error: "Attempt ID and user authentication are required." });
  }

  try {
    // 1. Fetch attempt session
    const attemptRes = await pool.query(
      `SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2`,
      [attemptId, userId]
    );
    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: "Revision attempt session not found." });
    }

    const attempt = attemptRes.rows[0];
    let sessionMeta = attempt.answers;
    if (typeof sessionMeta === "string") {
      try { sessionMeta = JSON.parse(sessionMeta); } catch (_) { sessionMeta = {}; }
    }

    const questionIds = sessionMeta._question_order || [];
    const revModId = sessionMeta._revision_module_id;
    const topicId = sessionMeta._topic_id || attempt.module_id;
    const stage = sessionMeta._stage || "day1";

    // 2. Fetch correct answers for questions in session
    let correctCount = 0;
    let totalQuestions = questionIds.length;
    let questionsWithAnswers = [];

    if (questionIds.length > 0) {
      const qRes = await pool.query(
        `SELECT id, correct_answer_index, explanation, question, options FROM questions WHERE id = ANY($1::varchar[])`,
        [questionIds]
      );
      questionsWithAnswers = qRes.rows;

      // Also check revision_questions fallback if needed
      if (questionsWithAnswers.length < questionIds.length) {
        const rqRes = await pool.query(
          `SELECT id, correct_answer_index, explanation, question, options FROM revision_questions WHERE id = ANY($1::varchar[])`,
          [questionIds]
        );
        questionsWithAnswers = [...questionsWithAnswers, ...rqRes.rows];
      }

      questionsWithAnswers.forEach((q) => {
        const studentAns = answers[q.id];
        if (studentAns !== undefined && studentAns !== null && Number(studentAns) === Number(q.correct_answer_index)) {
          correctCount++;
        }
      });
    }

    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const xpEarned = correctCount * 15;

    // 3. Record into user_revision_attempts
    const userRevAttemptId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_revision_attempts (
        id, user_id, revision_module_id, topic_id, mcq_ids, answers, score, total_questions, time_taken, attempted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        userRevAttemptId,
        userId,
        revModId || topicId,
        topicId,
        JSON.stringify(questionIds),
        JSON.stringify(answers),
        scorePercentage,
        totalQuestions,
        timeTaken
      ]
    );

    // 4. Update the schedule stage status to completed
    const stageCol = stage === "day3" ? "day3_status" : (stage === "day7" ? "day7_status" : "day1_status");
    await pool.query(
      `UPDATE user_revision_schedules 
       SET ${stageCol} = 'completed', updated_at = NOW() 
       WHERE user_id = $1 AND topic_id = $2`,
      [userId, topicId]
    );

    // 5. Update user XP
    await pool.query(
      `UPDATE users SET xp = COALESCE(xp, 0) + $1 WHERE id = $2`,
      [xpEarned, userId]
    );

    // 6. Close exam attempt
    await pool.query(
      `UPDATE exam_attempts SET status = 'submitted', answers = $1 WHERE id = $2`,
      [JSON.stringify({ ...sessionMeta, student_answers: answers, score: scorePercentage }), attemptId]
    );

    res.json({
      success: true,
      score: scorePercentage,
      correctCount,
      totalQuestions,
      xpEarned,
      message: `Revision test completed! You earned ${xpEarned} XP.`
    });
  } catch (err) {
    console.error("submitRevisionTest error:", err);
    res.status(500).json({ error: "Failed to submit revision test." });
  }
};

// Scheduler worker function to trigger due notifications
exports.processDueRevisions = async () => {
  try {
    const dueRes = await pool.query(`
      SELECT urs.*, rm.title AS rm_title, hn.name AS topic_name
      FROM user_revision_schedules urs
      LEFT JOIN revision_modules rm ON rm.topic_id = urs.topic_id
      LEFT JOIN hierarchy_nodes hn ON urs.topic_id = hn.id
      WHERE (urs.day1_status = 'pending' AND urs.day1_due_at <= NOW())
         OR (urs.day3_status = 'pending' AND urs.day3_due_at <= NOW())
         OR (urs.day7_status = 'pending' AND urs.day7_due_at <= NOW())
    `);

    for (const rev of dueRes.rows) {
      const topicTitle = rev.rm_title || rev.topic_name || "Topic Revision";

      // Check day 1
      if (rev.day1_status === "pending" && new Date(rev.day1_due_at) <= new Date()) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, type, topic_id, module_id, created_at)
           VALUES ($1, $2, $3, $4, 'revision', $5, $6, NOW())
           ON CONFLICT DO NOTHING`,
          [
            crypto.randomUUID(),
            rev.user_id,
            "Day 1 Revision Check 🎯",
            `Do the Revision of topic: ${topicTitle}. Lock in what you learned yesterday!`,
            rev.topic_id,
            rev.module_id
          ]
        );
        await pool.query(
          `UPDATE user_revision_schedules SET day1_status = 'notified' WHERE id = $1`,
          [rev.id]
        );
      }

      // Check day 3
      if (rev.day3_status === "pending" && new Date(rev.day3_due_at) <= new Date()) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, type, topic_id, module_id, created_at)
           VALUES ($1, $2, $3, $4, 'revision', $5, $6, NOW())
           ON CONFLICT DO NOTHING`,
          [
            crypto.randomUUID(),
            rev.user_id,
            "Module Revision (Day 3) 📚",
            `2 days have passed since you revised ${topicTitle}. Take a quick recap test!`,
            rev.topic_id,
            rev.module_id
          ]
        );
        await pool.query(
          `UPDATE user_revision_schedules SET day3_status = 'notified' WHERE id = $1`,
          [rev.id]
        );
      }

      // Check day 7
      if (rev.day7_status === "pending" && new Date(rev.day7_due_at) <= new Date()) {
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, type, topic_id, module_id, created_at)
           VALUES ($1, $2, $3, $4, 'revision', $5, $6, NOW())
           ON CONFLICT DO NOTHING`,
          [
            crypto.randomUUID(),
            rev.user_id,
            "Weekly Recap (Day 7) ⚡",
            `1 week milestone! Quickly revise ${topicTitle} to retain it long-term.`,
            rev.topic_id,
            rev.module_id
          ]
        );
        await pool.query(
          `UPDATE user_revision_schedules SET day7_status = 'notified' WHERE id = $1`,
          [rev.id]
        );
      }
    }
  } catch (err) {
    console.error("processDueRevisions error:", err.message);
  }
};

// Student Notifications List
exports.getStudentNotifications = async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const notifications = result.rows.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      topicId: n.topic_id,
      moduleId: n.module_id,
      isRead: n.is_read,
      createdAt: n.created_at
    }));

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("getStudentNotifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
};

exports.markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : null;

  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2", [id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deprecated question CRUD handlers kept for backwards compatibility
exports.getAdminRevisionQuestions = async (req, res) => {
  res.json({ success: true, questions: [] });
};
exports.saveAdminRevisionQuestion = async (req, res) => {
  res.json({ success: true });
};
exports.deleteAdminRevisionQuestion = async (req, res) => {
  res.json({ success: true });
};
