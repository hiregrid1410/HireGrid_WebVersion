const { pool } = require("../config/db");
const crypto = require("crypto");

// ==========================================
// ADMIN & CONTENT MANAGER CONTROLLERS
// ==========================================

exports.getAdminRevisionQuestions = async (req, res) => {
  const { branchId, subjectId, topicId, moduleId } = req.query;
  try {
    let query = "SELECT * FROM revision_questions WHERE 1=1";
    const values = [];
    let idx = 1;

    if (branchId) {
      query += ` AND branch_id = $${idx++}`;
      values.push(branchId);
    }
    if (subjectId) {
      query += ` AND subject_id = $${idx++}`;
      values.push(subjectId);
    }
    if (topicId) {
      query += ` AND topic_id = $${idx++}`;
      values.push(topicId);
    }
    if (moduleId) {
      query += ` AND module_id = $${idx++}`;
      values.push(moduleId);
    }

    query += " ORDER BY display_order ASC, created_at DESC";
    const result = await pool.query(query, values);

    const questions = result.rows.map(r => ({
      id: r.id,
      branchId: r.branch_id,
      subjectId: r.subject_id,
      topicId: r.topic_id,
      moduleId: r.module_id,
      question: r.question,
      options: r.options,
      correctAnswerIndex: r.correct_answer_index,
      explanation: r.explanation,
      difficulty: r.difficulty,
      svgCode: r.svg_code,
      displayOrder: r.display_order,
      createdAt: r.created_at
    }));

    res.json({ success: true, questions });
  } catch (err) {
    console.error("getAdminRevisionQuestions error:", err);
    res.status(500).json({ error: "Failed to fetch revision questions." });
  }
};

exports.saveAdminRevisionQuestion = async (req, res) => {
  const { id, branchId, subjectId, topicId, moduleId, question, options, correctAnswerIndex, explanation, difficulty, svgCode, displayOrder } = req.body;
  const qId = id || crypto.randomUUID();
  const userId = req.user ? req.user.id : "system";

  if (!question || !options || options.length === 0) {
    return res.status(400).json({ error: "Question text and options are required." });
  }

  try {
    const formattedOptions = Array.isArray(options) ? JSON.stringify(options) : JSON.stringify([]);

    await pool.query(
      `INSERT INTO revision_questions (
        id, branch_id, subject_id, topic_id, module_id, question, options, correct_answer_index, explanation, difficulty, svg_code, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        branch_id = EXCLUDED.branch_id,
        subject_id = EXCLUDED.subject_id,
        topic_id = EXCLUDED.topic_id,
        module_id = EXCLUDED.module_id,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_answer_index = EXCLUDED.correct_answer_index,
        explanation = EXCLUDED.explanation,
        difficulty = EXCLUDED.difficulty,
        svg_code = EXCLUDED.svg_code,
        display_order = EXCLUDED.display_order`,
      [
        qId,
        branchId || null,
        subjectId || null,
        topicId || null,
        moduleId || null,
        question,
        formattedOptions,
        Number(correctAnswerIndex) || 0,
        explanation || null,
        difficulty || "medium",
        svgCode || null,
        displayOrder !== undefined ? displayOrder : 0,
        userId
      ]
    );

    res.json({ success: true, id: qId });
  } catch (err) {
    console.error("saveAdminRevisionQuestion error:", err);
    res.status(500).json({ error: "Failed to save revision question." });
  }
};

exports.deleteAdminRevisionQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM revision_questions WHERE id = $1", [id]);
    res.json({ success: true, message: "Revision question deleted successfully." });
  } catch (err) {
    console.error("deleteAdminRevisionQuestion error:", err);
    res.status(500).json({ error: "Failed to delete revision question." });
  }
};

// ==========================================
// STUDENT REVISION SCHEDULER & FLOW
// ==========================================

// Log topic completion and schedule spaced-repetition revisions
exports.completeTopic = async (req, res) => {
  const { topicId, topicName, subjectId, moduleId, score } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!userId || !topicId) {
    return res.status(400).json({ error: "User ID and Topic ID are required." });
  }

  try {
    const compId = crypto.randomUUID();
    const now = new Date();

    // 1. Record topic completion
    await pool.query(
      `INSERT INTO topic_completions (id, user_id, topic_id, topic_name, subject_id, module_id, completed_at, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, topic_id) DO UPDATE SET
         completed_at = EXCLUDED.completed_at,
         score = EXCLUDED.score`,
      [compId, userId, topicId, topicName || "General Topic", subjectId || null, moduleId || null, now, score || 100]
    );

    // 2. Schedule Day 1, Day 3, Day 7, and Month-end revisions
    const stages = [
      { stage: "day1", delayMs: 1 * 24 * 60 * 60 * 1000 },
      { stage: "day3", delayMs: 3 * 24 * 60 * 60 * 1000 },
      { stage: "day7", delayMs: 7 * 24 * 60 * 60 * 1000 },
      { stage: "monthend", delayMs: 30 * 24 * 60 * 60 * 1000 }
    ];

    for (const s of stages) {
      const scheduledFor = new Date(now.getTime() + s.delayMs);
      await pool.query(
        `INSERT INTO scheduled_revisions (id, user_id, topic_id, topic_name, module_id, stage, scheduled_for, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         ON CONFLICT (user_id, topic_id, stage) DO UPDATE SET
           scheduled_for = EXCLUDED.scheduled_for,
           status = 'pending'`,
        [crypto.randomUUID(), userId, topicId, topicName || "General Topic", moduleId || null, s.stage, scheduledFor]
      );
    }

    res.json({ success: true, message: "Topic completed and spaced revisions scheduled." });
  } catch (err) {
    console.error("completeTopic error:", err);
    res.status(500).json({ error: "Failed to record topic completion." });
  }
};

// Scheduler worker function to trigger due notifications
exports.processDueRevisions = async () => {
  try {
    const dueRes = await pool.query(
      `SELECT * FROM scheduled_revisions 
       WHERE status = 'pending' AND scheduled_for <= NOW()`
    );

    for (const rev of dueRes.rows) {
      let title = "Revision Reminder";
      let message = `Time to revise ${rev.topic_name || "your topic"}!`;

      if (rev.stage === "day1") {
        title = "Day 1 Revision Check 🎯";
        message = `Do the Revision of topic: ${rev.topic_name || "Topic"}. Lock in what you learned yesterday!`;
      } else if (rev.stage === "day3") {
        title = "Module Revision (Day 3) 📚";
        message = `Now 2 days have passed since you completed ${rev.topic_name || "this module"}. Take a quick recap test!`;
      } else if (rev.stage === "day7") {
        title = "Weekly Recap (Day 7) ⚡";
        message = `Week complete! Quickly revise ${rev.topic_name || "this topic"} so you don't forget.`;
      } else if (rev.stage === "monthend") {
        title = "Monthly Mastery Review 🧠";
        message = `Last Revision for ${rev.topic_name || "this topic"} — keep this fresh in your mind for interviews.`;
      }

      await pool.query(
        `INSERT INTO notifications (id, user_id, title, message, type, payload)
         VALUES ($1, $2, $3, $4, 'revision', $5)`,
        [
          crypto.randomUUID(),
          rev.user_id,
          title,
          message,
          JSON.stringify({
            topicId: rev.topic_id,
            topicName: rev.topic_name,
            moduleId: rev.module_id,
            stage: rev.stage
          })
        ]
      );

      await pool.query(
        "UPDATE scheduled_revisions SET status = 'notified' WHERE id = $1",
        [rev.id]
      );
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

    const notifications = result.rows.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      payload: n.payload,
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

// Start Revision Test with 500+ -> 50 Random Sampling Rule
exports.startRevisionTest = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    // 1. Fetch questions from revision_questions for this topic
    let qRes = await pool.query(
      `SELECT id, question, options, correct_answer_index AS "correctAnswerIndex", svg_code AS "svgCode", explanation
       FROM revision_questions WHERE topic_id = $1`,
      [topicId]
    );

    // If no dedicated revision questions yet, fallback to regular questions under this topic / module
    if (qRes.rows.length === 0) {
      qRes = await pool.query(
        `SELECT q.id, q.question, q.options, q.correct_answer_index AS "correctAnswerIndex", q.svg_code AS "svgCode", q.explanation
         FROM questions q
         INNER JOIN modules m ON q.module_id = m.id
         WHERE m.parent_id = $1 OR q.module_id = $1`,
        [topicId]
      );
    }

    const allQuestions = qRes.rows;
    if (allQuestions.length === 0) {
      return res.status(404).json({ error: "No revision questions found for this topic." });
    }

    // 2. Apply Spaced-Repetition Sampling Rule:
    // If totalQuestions >= 500 -> 50 random MCQs
    // If totalQuestions < 500 -> Math.min(20, totalQuestions)
    let sampleSize = 20;
    if (allQuestions.length >= 500) {
      sampleSize = 50;
    } else {
      sampleSize = Math.min(20, allQuestions.length);
    }

    // Fisher-Yates shuffle
    const shuffled = [...allQuestions];
    let currentIndex = shuffled.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }

    const sampledQuestions = shuffled.slice(0, sampleSize);

    // Create session in exam_attempts
    const attemptId = crypto.randomUUID();
    const now = Date.now();
    const durationMinutes = Math.max(15, Math.ceil(sampleSize * 1.5));
    const expiresAt = now + (durationMinutes * 60 * 1000);

    const questionOrder = sampledQuestions.map(q => q.id);

    await pool.query(
      `INSERT INTO exam_attempts (id, user_id, module_id, started_at, expires_at, status, violation_count, last_activity, answers)
       VALUES ($1, $2, $3, $4, $5, 'active', 0, $6, $7)`,
      [attemptId, userId, topicId, now, expiresAt, now, JSON.stringify({ _question_order: questionOrder })]
    );

    // Return questions without correct answers to prevent cheating
    const safeQuestions = sampledQuestions.map(q => {
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
      topicId,
      testTitle: "Revision Assessment",
      totalQuestions: safeQuestions.length,
      timeLeft: durationMinutes * 60,
      questions: safeQuestions
    });
  } catch (err) {
    console.error("startRevisionTest error:", err);
    res.status(500).json({ error: "Failed to generate revision test." });
  }
};
