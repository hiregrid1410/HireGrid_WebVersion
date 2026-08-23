const { pool } = require("../config/db");
const crypto = require("crypto");

// Helper: Check if user is premium
const isUserPremium = async (userId) => {
  const result = await pool.query(
    "SELECT has_full_premium, active_plan_id, plan_expiry FROM users WHERE id = $1",
    [userId]
  );
  if (result.rows.length === 0) return false;
  const user = result.rows[0];
  const isPremium = user.has_full_premium || user.active_plan_id;
  const notExpired = !user.plan_expiry || Date.now() <= Number(user.plan_expiry);
  return !!(isPremium && notExpired);
};

// Helper: Get active cycle
const getActiveCycle = async () => {
  const res = await pool.query(
    "SELECT * FROM placement_mission_cycles WHERE is_active = TRUE LIMIT 1"
  );
  if (res.rows.length === 0) {
    // If no active cycle, return fallback cycle_1 (seeded during db init)
    return { id: "cycle_1", name: "Cycle 1" };
  }
  return res.rows[0];
};

// ================= STUDENT MISSIONS APIs =================

// List active Placement Mission modules
exports.getMissions = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Verify premium status
    const isPremium = await isUserPremium(userId);
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        premiumLocked: true,
        error: "This section is exclusively for Premium Members. Upgrade to Premium to attempt weekly missions and compete on the leaderboard."
      });
    }

    // 2. Fetch current active cycle
    const cycle = await getActiveCycle();

    // 3. Fetch modules for active cycle (excluding draft modules)
    const modulesRes = await pool.query(
      `SELECT m.id, m.title, m.description, m.time_limit AS "timeLimit", m.total_marks AS "totalMarks",
              m.start_time AS "startTime", m.end_time AS "endTime", m.publication_status AS "publicationStatus",
              (SELECT COUNT(*) FROM questions q WHERE q.module_id = m.id) AS "questionCount"
       FROM modules m
       WHERE m.is_placement_mission = TRUE AND m.is_active = TRUE AND m.cycle_id = $1
         AND (m.publication_status = 'PUBLISHED' OR m.publication_status IS NULL)
       ORDER BY m.display_order ASC, m.created_at ASC`,
      [cycle.id]
    );

    // 4. Fetch student attempts for this cycle
    const attemptsRes = await pool.query(
      `SELECT module_id, status, expires_at, score, xp_earned, accuracy, is_valid
       FROM placement_mission_attempts
       WHERE user_id = $1 AND cycle_id = $2`,
      [userId, cycle.id]
    );

    const attemptsMap = {};
    attemptsRes.rows.forEach(a => {
      attemptsMap[a.module_id] = a;
    });

    const nowServerTime = Date.now();
    const activeMissions = [];
    const historyMissions = [];

    modulesRes.rows.forEach(m => {
      const attempt = attemptsMap[m.id];
      let status = "not_started";

      if (attempt) {
        if (attempt.status === "active") {
          if (Number(attempt.expires_at) < nowServerTime) {
            status = "expired";
          } else {
            status = "active";
          }
        } else {
          status = attempt.status; // 'submitted', 'expired', 'invalid'
        }
      }

      const start = m.startTime ? Number(m.startTime) : null;
      const end = m.endTime ? Number(m.endTime) : null;
      const isExpired = end !== null && nowServerTime > end;
      
      let lifecycle = 'ACTIVE';
      if (start && nowServerTime < start) {
        lifecycle = 'SCHEDULED';
      } else if (isExpired) {
        lifecycle = 'EXPIRED';
      }

      const missionItem = {
        ...m,
        status,
        lifecycleStatus: lifecycle,
        attempt: attempt ? {
          score: attempt.score,
          xpEarned: attempt.xp_earned,
          accuracy: attempt.accuracy,
          isValid: attempt.is_valid
        } : null
      };

      if (isExpired) {
        historyMissions.push(missionItem);
      } else {
        activeMissions.push(missionItem);
      }
    });

    res.json({
      success: true,
      cycle: { id: cycle.id, name: cycle.name },
      missions: activeMissions,
      history: historyMissions
    });
  } catch (err) {
    console.error("getMissions error:", err);
    res.status(500).json({ error: "Failed to load missions." });
  }
};

// Start attempt for a mission module
exports.startMissionAttempt = async (req, res) => {
  const { moduleId } = req.body;
  const userId = req.user.id;

  if (!moduleId) {
    return res.status(400).json({ error: "Module ID is required." });
  }

  try {
    // 1. Verify premium status
    const isPremium = await isUserPremium(userId);
    if (!isPremium) {
      return res.status(403).json({ error: "Premium membership required." });
    }

    // 2. Fetch module config
    const modRes = await pool.query(
      "SELECT * FROM modules WHERE id = $1 AND is_placement_mission = TRUE AND is_active = TRUE",
      [moduleId]
    );
    if (modRes.rows.length === 0) {
      return res.status(404).json({ error: "Placement mission module not found or inactive." });
    }
    const moduleItem = modRes.rows[0];

    // Server-side validity check
    if (moduleItem.publication_status === 'DRAFT') {
      return res.status(403).json({ error: "This placement mission is currently in draft." });
    }
    const nowServerTime = Date.now();
    if (moduleItem.start_time && nowServerTime < Number(moduleItem.start_time)) {
      return res.status(400).json({ error: "This placement mission has not started yet (Scheduled)." });
    }
    if (moduleItem.end_time && nowServerTime > Number(moduleItem.end_time)) {
      return res.status(400).json({ error: "This placement mission has expired." });
    }

    const timeLimitMinutes = Number(moduleItem.time_limit) || 30;
    const timeLimitMs = timeLimitMinutes * 60 * 1000;

    const cycle = await getActiveCycle();

    // 3. Check for completed or invalidated attempt in this cycle
    const completedAttemptRes = await pool.query(
      `SELECT id, status FROM placement_mission_attempts
       WHERE user_id = $1 AND module_id = $2 AND cycle_id = $3 AND status != 'active'`,
      [userId, moduleId, cycle.id]
    );
    if (completedAttemptRes.rows.length > 0) {
      return res.status(400).json({ error: "You have already completed your scored attempt for this mission." });
    }

    // 4. Check for active attempt
    const activeAttemptRes = await pool.query(
      `SELECT * FROM placement_mission_attempts
       WHERE user_id = $1 AND module_id = $2 AND cycle_id = $3 AND status = 'active' AND expires_at > $4`,
      [userId, moduleId, cycle.id, Date.now()]
    );

    let attempt;
    let shuffledQuestionIds = [];

    if (activeAttemptRes.rows.length > 0) {
      attempt = activeAttemptRes.rows[0];
      if (attempt.answers && attempt.answers._question_order) {
        shuffledQuestionIds = attempt.answers._question_order;
      }
    } else {
      // Invalidate any older active attempts that have expired
      await pool.query(
        `UPDATE placement_mission_attempts 
         SET status = 'expired' 
         WHERE user_id = $1 AND module_id = $2 AND cycle_id = $3 AND status = 'active'`,
        [userId, moduleId, cycle.id]
      );

      // Create new attempt
      const attemptId = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = now + timeLimitMs;

      // Fetch all questions to shuffle
      const qRes = await pool.query(
        "SELECT id FROM questions WHERE module_id = $1",
        [moduleId]
      );
      shuffledQuestionIds = qRes.rows.map(r => r.id);

      // Fisher-Yates Shuffle
      let currentIndex = shuffledQuestionIds.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [shuffledQuestionIds[currentIndex], shuffledQuestionIds[randomIndex]] = [
          shuffledQuestionIds[randomIndex],
          shuffledQuestionIds[currentIndex]
        ];
      }

      const initialAnswersJson = {
        _question_order: shuffledQuestionIds
      };

      const newAttemptRes = await pool.query(
        `INSERT INTO placement_mission_attempts 
         (id, user_id, module_id, cycle_id, started_at, expires_at, status, answers)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
         RETURNING *`,
        [attemptId, userId, moduleId, cycle.id, now, expiresAt, JSON.stringify(initialAnswersJson)]
      );
      attempt = newAttemptRes.rows[0];
    }

    // 5. Fetch questions (Excluding correctAnswerIndex!)
    const questionsRes = await pool.query(
      `SELECT id, question, options, NULL AS "correctAnswerIndex", svg_code AS "svgCode", display_order AS "displayOrder"
       FROM questions
       WHERE module_id = $1`,
      [moduleId]
    );

    let questionsList = questionsRes.rows;

    if (shuffledQuestionIds.length > 0) {
      const qMap = new Map(questionsList.map(q => [q.id, q]));
      questionsList = shuffledQuestionIds
        .map(id => qMap.get(id))
        .filter(q => q !== undefined);
    }

    const secondsLeft = Math.max(0, Math.ceil((Number(attempt.expires_at) - Date.now()) / 1000));

    res.json({
      success: true,
      attemptId: attempt.id,
      questions: questionsList,
      timeLeft: secondsLeft,
      answers: attempt.answers || {}
    });
  } catch (err) {
    console.error("startMissionAttempt error:", err);
    res.status(500).json({ error: "Failed to initialize mission attempt." });
  }
};

// Sync mission progress (called periodically)
exports.syncMissionAttempt = async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const userId = req.user.id;

  try {
    const attemptRes = await pool.query(
      "SELECT * FROM placement_mission_attempts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [id, userId]
    );

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: "Active mission attempt not found." });
    }

    const attempt = attemptRes.rows[0];

    // Check expiration
    if (Number(attempt.expires_at) < Date.now()) {
      await pool.query(
        "UPDATE placement_mission_attempts SET status = 'expired' WHERE id = $1",
        [id]
      );
      return res.status(403).json({ error: "Time limit exceeded. Session expired." });
    }

    const mergedAnswers = {
      ...(attempt.answers || {}),
      ...(answers || {})
    };

    await pool.query(
      "UPDATE placement_mission_attempts SET answers = $1 WHERE id = $2",
      [JSON.stringify(mergedAnswers), id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("syncMissionAttempt error:", err);
    res.status(500).json({ error: "Failed to sync attempt state." });
  }
};

// Submit and grade attempt
exports.submitMissionAttempt = async (req, res) => {
  const { id } = req.params;
  const { answers = {} } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify premium status
    const isPremium = await isUserPremium(userId);
    if (!isPremium) {
      return res.status(403).json({ error: "Premium membership required." });
    }

    // 2. Fetch attempt
    const attemptRes = await pool.query(
      "SELECT * FROM placement_mission_attempts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [id, userId]
    );
    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ error: "Active mission attempt not found or already submitted." });
    }
    const attempt = attemptRes.rows[0];
    const moduleId = attempt.module_id;

    // Check time limit with a 15 seconds grace period for network latency
    const GRACE_PERIOD_MS = 15000;
    const isLate = Date.now() > (Number(attempt.expires_at) + GRACE_PERIOD_MS);

    const mergedAnswers = {
      ...(attempt.answers || {}),
      ...(answers || {})
    };
    delete mergedAnswers._question_order;

    // 3. Fetch module config
    const modRes = await pool.query("SELECT * FROM modules WHERE id = $1", [moduleId]);
    if (modRes.rows.length === 0) {
      return res.status(404).json({ error: "Module not found." });
    }
    const moduleItem = modRes.rows[0];
    const modPositive = moduleItem.marks_per_question !== null ? Number(moduleItem.marks_per_question) : 1;
    const modNegative = moduleItem.negative_marks !== null ? Number(moduleItem.negative_marks) : 0.5;
    const timeLimitMinutes = Number(moduleItem.time_limit) || 30;
    const timeLimitSeconds = timeLimitMinutes * 60;

    // 4. Fetch correct answers from DB
    const questionsRes = await pool.query(
      "SELECT id, correct_answer_index FROM questions WHERE module_id = $1",
      [moduleId]
    );
    const dbQuestions = questionsRes.rows;

    let finalScore = 0;
    let correctCount = 0;
    let maxPossibleScore = Number(moduleItem.total_marks) || 0;

    if (!maxPossibleScore) {
      dbQuestions.forEach(q => {
        const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
        maxPossibleScore += qPos;
      });
    }

    dbQuestions.forEach(q => {
      const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
      const qNeg = modNegative;

      const studentAnswer = mergedAnswers[q.id];
      if (studentAnswer !== undefined && studentAnswer !== null) {
        if (Number(studentAnswer) === Number(q.correct_answer_index)) {
          finalScore += qPos;
          correctCount += 1;
        } else {
          finalScore -= qNeg;
        }
      }
    });

    finalScore = Math.max(0, finalScore);
    const scorePercentage = maxPossibleScore > 0 ? Math.round((finalScore / maxPossibleScore) * 100) : 0;

    // 5. XP & Speed Calculation
    const submissionTime = Date.now();
    const completionTimeSeconds = Math.max(1, Math.min(
      timeLimitSeconds,
      Math.round((submissionTime - Number(attempt.started_at)) / 1000)
    ));

    const accuracyPercentage = dbQuestions.length > 0 ? (correctCount / dbQuestions.length) * 100 : 0;
    const accuracyXp = accuracyPercentage;

    const remainingTimeSeconds = timeLimitSeconds - completionTimeSeconds;
    const speedRatio = timeLimitSeconds > 0 ? (remainingTimeSeconds / timeLimitSeconds) : 0;
    
    // Scale speed bonus by accuracy (max 50 XP)
    const speedBonus = Math.max(0, Math.round(speedRatio * 50 * (accuracyPercentage / 100)));
    const totalXpEarned = Math.round(accuracyXp + speedBonus);

    // If submitted after timer + grace period, they get 0 score/XP
    const finalScoreToSave = isLate ? 0 : scorePercentage;
    const finalAccuracyToSave = isLate ? 0 : accuracyPercentage;
    const finalXpToSave = isLate ? 0 : totalXpEarned;
    const finalSpeedBonusToSave = isLate ? 0 : speedBonus;
    const statusToSave = isLate ? "expired" : "submitted";

    // 6. Update database record
    await pool.query(
      `UPDATE placement_mission_attempts
       SET status = $1, submitted_at = $2, answers = $3, score = $4, accuracy = $5,
           completion_time = $6, xp_earned = $7, speed_bonus = $8
       WHERE id = $9`,
      [
        statusToSave,
        submissionTime,
        JSON.stringify(mergedAnswers),
        finalScoreToSave,
        finalAccuracyToSave,
        completionTimeSeconds,
        finalXpToSave,
        finalSpeedBonusToSave,
        id
      ]
    );

    // Return the correct answers map to let the student review instantly
    const correctAnswersMap = {};
    dbQuestions.forEach((q) => {
      correctAnswersMap[q.id] = q.correct_answer_index;
    });

    res.json({
      success: true,
      score: finalScoreToSave,
      accuracy: finalAccuracyToSave,
      correctCount,
      totalQuestions: dbQuestions.length,
      xpEarned: finalXpToSave,
      speedBonus: finalSpeedBonusToSave,
      isLate,
      correctAnswers: correctAnswersMap
    });
  } catch (err) {
    console.error("submitMissionAttempt error:", err);
    res.status(500).json({ error: "Failed to submit attempt." });
  }
};

// ================= LEADERBOARD APIs =================

// Get Top 10 Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const cycle = await getActiveCycle();

    const result = await pool.query(
      `SELECT rank, user_name AS "userName", xp, accuracy, completion_time AS "completionTime", badge
       FROM leaderboard_snapshots
       WHERE cycle_id = $1
       ORDER BY rank ASC`,
      [cycle.id]
    );

    res.json({
      success: true,
      cycle: { id: cycle.id, name: cycle.name },
      leaderboard: result.rows
    });
  } catch (err) {
    console.error("getLeaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard." });
  }
};

// ================= CONTENT MANAGER / ADMIN CONTROL APIs =================

// Core Recalculation logic used by daily scheduler & admin triggers
const recalculateLeaderboardSnapshots = async (cycleId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch aggregate stats for all users with valid attempts in this cycle
    const queryStr = `
      SELECT 
        a.user_id,
        u.name AS user_name,
        SUM(a.xp_earned) AS total_xp,
        AVG(a.accuracy) AS avg_accuracy,
        SUM(a.completion_time) AS total_completion_time,
        MAX(a.submitted_at) AS max_submitted_at
      FROM placement_mission_attempts a
      INNER JOIN users u ON a.user_id = u.id
      WHERE a.cycle_id = $1 AND a.status = 'submitted' AND a.is_valid = TRUE
      GROUP BY a.user_id, u.name
      ORDER BY 
        total_xp DESC,
        avg_accuracy DESC,
        total_completion_time ASC,
        max_submitted_at ASC
      LIMIT 10
    `;

    const rankingRes = await client.query(queryStr, [cycleId]);
    const topPerformers = rankingRes.rows;

    // 2. Clear old snapshot for this cycle
    await client.query("DELETE FROM leaderboard_snapshots WHERE cycle_id = $1", [cycleId]);

    // 3. Insert new snapshots
    for (let i = 0; i < topPerformers.length; i++) {
      const p = topPerformers[i];
      const rank = i + 1;
      let badge = "Top 10";

      if (rank === 1) badge = "Gold";
      else if (rank === 2) badge = "Silver";
      else if (rank === 3) badge = "Bronze";
      else if (rank <= 5) badge = "Runner-Up";

      await client.query(
        `INSERT INTO leaderboard_snapshots 
         (id, cycle_id, rank, user_id, user_name, xp, accuracy, completion_time, badge)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          crypto.randomUUID(),
          cycleId,
          rank,
          p.user_id,
          p.user_name || "Premium Student",
          Number(p.total_xp),
          Number(p.avg_accuracy),
          Number(p.total_completion_time),
          badge
        ]
      );
    }

    await client.query("COMMIT");
    return { success: true, count: topPerformers.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.recalculateLeaderboardCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  try {
    const cycle = await getActiveCycle();
    const result = await recalculateLeaderboardSnapshots(cycle.id);
    res.json({
      success: true,
      message: `Leaderboard recalculated successfully. Ranked ${result.count} premium performers.`,
    });
  } catch (err) {
    console.error("recalculateLeaderboardCM error:", err);
    res.status(500).json({ error: "Failed to recalculate rankings." });
  }
};

// Create a new cycle / Start new season
exports.createCycleCM = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Super Admin privileges required to start a new cycle." });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Cycle name is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Deactivate previous cycles
    await client.query("UPDATE placement_mission_cycles SET is_active = FALSE");

    // Create new active cycle
    const cycleId = crypto.randomUUID();
    await client.query(
      "INSERT INTO placement_mission_cycles (id, name, is_active) VALUES ($1, $2, TRUE)",
      [cycleId, name]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: `New weekly cycle '${name}' started successfully.` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createCycleCM error:", err);
    res.status(500).json({ error: "Failed to start new cycle." });
  } finally {
    client.release();
  }
};

// Get list of all cycles
exports.getCyclesCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM placement_mission_cycles ORDER BY created_at DESC"
    );
    res.json({ success: true, cycles: result.rows });
  } catch (err) {
    console.error("getCyclesCM error:", err);
    res.status(500).json({ error: "Failed to load cycles." });
  }
};

// List all Placement Mission attempts (for Content Manager audit)
exports.getAttemptsCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT 
        a.id,
        a.started_at AS "startedAt",
        a.submitted_at AS "submittedAt",
        a.status,
        a.score,
        a.accuracy,
        a.completion_time AS "completionTime",
        a.xp_earned AS "xpEarned",
        a.speed_bonus AS "speedBonus",
        a.is_valid AS "isValid",
        a.invalidated_by AS "invalidatedBy",
        a.invalidated_at AS "invalidatedAt",
        a.invalidated_reason AS "invalidatedReason",
        u.name AS "studentName",
        u.email AS "studentEmail",
        m.title AS "moduleTitle",
        c.name AS "cycleName"
       FROM placement_mission_attempts a
       INNER JOIN users u ON a.user_id = u.id
       INNER JOIN modules m ON a.module_id = m.id
       INNER JOIN placement_mission_cycles c ON a.cycle_id = c.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countRes = await pool.query("SELECT COUNT(*) FROM placement_mission_attempts");
    const total = Number(countRes.rows[0].count);

    res.json({
      success: true,
      attempts: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("getAttemptsCM error:", err);
    res.status(500).json({ error: "Failed to fetch attempts list." });
  }
};

// Invalidate an attempt
exports.invalidateAttemptCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Invalidation reason is required." });
  }

  const adminName = req.user.name || "Admin Operator";

  try {
    const checkRes = await pool.query(
      "SELECT cycle_id FROM placement_mission_attempts WHERE id = $1",
      [id]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Attempt record not found." });
    }

    const cycleId = checkRes.rows[0].cycle_id;

    // Update attempt
    await pool.query(
      `UPDATE placement_mission_attempts 
       SET is_valid = FALSE, invalidated_by = $1, invalidated_at = CURRENT_TIMESTAMP, invalidated_reason = $2
       WHERE id = $3`,
      [adminName, reason, id]
    );

    // Recalculate leaderboard snapshots for this cycle immediately to update current rankings
    await recalculateLeaderboardSnapshots(cycleId);

    res.json({ success: true, message: "Attempt successfully invalidated. Leaderboard updated." });
  } catch (err) {
    console.error("invalidateAttemptCM error:", err);
    res.status(500).json({ error: "Failed to invalidate attempt." });
  }
};

// List all Placement Mission modules for CM management
exports.getMissionsCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  try {
    const result = await pool.query(
      `SELECT m.*, c.name AS "cycleName"
       FROM modules m
       LEFT JOIN placement_mission_cycles c ON m.cycle_id = c.id
       WHERE m.is_placement_mission = TRUE
       ORDER BY m.created_at DESC`
    );

    // Compute lifecycle status for CM view
    const now = Date.now();
    const modulesWithStatus = result.rows.map(m => {
      let lifecycle = 'ACTIVE';
      if (m.publication_status === 'DRAFT') {
        lifecycle = 'DRAFT';
      } else {
        const start = m.start_time ? Number(m.start_time) : null;
        const end = m.end_time ? Number(m.end_time) : null;
        if (start && now < start) {
          lifecycle = 'SCHEDULED';
        } else if (end && now > end) {
          lifecycle = 'EXPIRED';
        }
      }

      return {
        ...m,
        lifecycleStatus: lifecycle,
        publicationStatus: m.publication_status,
        startTime: m.start_time,
        endTime: m.end_time
      };
    });

    res.json({ success: true, modules: modulesWithStatus });
  } catch (err) {
    console.error("getMissionsCM error:", err);
    res.status(500).json({ error: "Failed to load mission modules." });
  }
};

// Create a mission module
exports.createMissionCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  const { title, description, timeLimit, totalMarks, marksPerQuestion, negativeMarks, is_active, publicationStatus, startTime, endTime } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Module title is required." });
  }

  try {
    const cycle = await getActiveCycle();
    const id = crypto.randomUUID();
    const adminName = req.user.name || "Operator";

    await pool.query(
      `INSERT INTO modules 
       (id, title, description, time_limit, total_marks, marks_per_question, negative_marks, is_active, is_placement_mission, cycle_id, created_by, publication_status, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10, $11, $12, $13)`,
      [
        id,
        title,
        description || "",
        Number(timeLimit) || 30,
        Number(totalMarks) || 100,
        Number(marksPerQuestion) || 1,
        Number(negativeMarks) || 0.5,
        is_active !== undefined ? !!is_active : true,
        cycle.id,
        adminName,
        publicationStatus || 'DRAFT',
        startTime ? Number(startTime) : null,
        endTime ? Number(endTime) : null
      ]
    );

    res.json({ success: true, moduleId: id });
  } catch (err) {
    console.error("createMissionCM error:", err);
    res.status(500).json({ error: "Failed to create mission module." });
  }
};

// Update a mission module
exports.updateMissionCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  const { id } = req.params;
  const { title, description, timeLimit, totalMarks, marksPerQuestion, negativeMarks, is_active, cycle_id, publicationStatus, startTime, endTime } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Module title is required." });
  }

  try {
    const modCheck = await pool.query("SELECT id FROM modules WHERE id = $1 AND is_placement_mission = TRUE", [id]);
    if (modCheck.rows.length === 0) {
      return res.status(404).json({ error: "Placement mission module not found." });
    }

    await pool.query(
      `UPDATE modules 
       SET title = $1, description = $2, time_limit = $3, total_marks = $4,
           marks_per_question = $5, negative_marks = $6, is_active = $7, cycle_id = $8,
           publication_status = $9, start_time = $10, end_time = $11
       WHERE id = $12`,
      [
        title,
        description || "",
        Number(timeLimit) || 30,
        Number(totalMarks) || 100,
        Number(marksPerQuestion) || 1,
        Number(negativeMarks) || 0.5,
        is_active !== undefined ? !!is_active : true,
        cycle_id || null,
        publicationStatus || 'DRAFT',
        startTime ? Number(startTime) : null,
        endTime ? Number(endTime) : null,
        id
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("updateMissionCM error:", err);
    res.status(500).json({ error: "Failed to update mission module." });
  }
};

// Delete a mission module
exports.deleteMissionCM = async (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "content_manager") {
    return res.status(403).json({ error: "Unauthorized access." });
  }

  const { id } = req.params;

  try {
    const modCheck = await pool.query("SELECT id FROM modules WHERE id = $1 AND is_placement_mission = TRUE", [id]);
    if (modCheck.rows.length === 0) {
      return res.status(404).json({ error: "Placement mission module not found." });
    }

    await pool.query("DELETE FROM modules WHERE id = $1", [id]);
    res.json({ success: true, message: "Mission module deleted successfully." });
  } catch (err) {
    console.error("deleteMissionCM error:", err);
    res.status(500).json({ error: "Failed to delete mission module." });
  }
};

// Export internal helper
exports.recalculateLeaderboardSnapshots = recalculateLeaderboardSnapshots;
exports.getActiveCycle = getActiveCycle;
