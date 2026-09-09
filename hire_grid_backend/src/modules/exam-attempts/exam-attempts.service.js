const { pool } = require("../../database/connection");
const crypto = require("crypto");
const { verifyUserItemAccess } = require("../../services/accessChecker.service");
const { ApiError } = require("../../utils/ApiError");

class ExamAttemptsService {
  async startExamAttempt(userId, moduleId) {
    if (!userId || !moduleId) {
      throw new ApiError(400, "User ID and Module ID are required.");
    }

    const accessCheck = await verifyUserItemAccess(userId, moduleId, "module");
    if (!accessCheck.allowed) {
      throw new ApiError(403, accessCheck.reason || "Access locked under current plan.");
    }

    const modRes = await pool.query("SELECT time_limit FROM modules WHERE id = $1", [moduleId]);
    if (modRes.rows.length === 0) {
      throw new ApiError(404, "Module not found.");
    }
    const timeLimitMinutes = Number(modRes.rows[0].time_limit) || 30;
    const timeLimitMs = timeLimitMinutes * 60 * 1000;

    const activeAttemptRes = await pool.query(
      `SELECT * FROM exam_attempts 
       WHERE user_id = $1 AND module_id = $2 AND status = 'active' AND expires_at > $3`,
      [userId, moduleId, Date.now()]
    );

    let attempt;
    let shuffledQuestionIds = [];

    if (activeAttemptRes.rows.length > 0) {
      attempt = activeAttemptRes.rows[0];
      if (attempt.answers && attempt.answers._question_order) {
        shuffledQuestionIds = attempt.answers._question_order;
      }
    } else {
      await pool.query(
        "UPDATE exam_attempts SET status = 'expired' WHERE user_id = $1 AND module_id = $2 AND status = 'active'",
        [userId, moduleId]
      );

      const attemptId = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = now + timeLimitMs;

      let qRes = await pool.query(
        `SELECT question_id AS id FROM exam_questions WHERE exam_id = $1 ORDER BY question_order ASC`,
        [moduleId]
      );
      if (qRes.rows.length === 0) {
        qRes = await pool.query("SELECT id FROM questions WHERE module_id = $1 ORDER BY display_order ASC", [moduleId]);
      }
      shuffledQuestionIds = qRes.rows.map(r => r.id);
      
      let currentIndex = shuffledQuestionIds.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [shuffledQuestionIds[currentIndex], shuffledQuestionIds[randomIndex]] = [shuffledQuestionIds[randomIndex], shuffledQuestionIds[currentIndex]];
      }

      const initialAnswersJson = {
        _question_order: shuffledQuestionIds
      };

      const newAttemptRes = await pool.query(
        `INSERT INTO exam_attempts (id, user_id, module_id, started_at, expires_at, status, violation_count, last_activity, answers)
         VALUES ($1, $2, $3, $4, $5, 'active', 0, $6, $7)
         RETURNING *`,
        [attemptId, userId, moduleId, now, expiresAt, now, JSON.stringify(initialAnswersJson)]
      );
      attempt = newAttemptRes.rows[0];
    }

    let questionsRes = await pool.query(
      `SELECT q.id, q.question, q.options, NULL AS "correctAnswerIndex", q.svg_code AS "svgCode", eq.question_order AS "displayOrder"
       FROM questions q
       INNER JOIN exam_questions eq ON q.id = eq.question_id
       WHERE eq.exam_id = $1`,
      [moduleId]
    );
    if (questionsRes.rows.length === 0) {
      questionsRes = await pool.query(
        `SELECT id, question, options, NULL AS "correctAnswerIndex", svg_code AS "svgCode", display_order AS "displayOrder"
         FROM questions
         WHERE module_id = $1`,
        [moduleId]
      );
    }

    let questionsList = questionsRes.rows;

    if (shuffledQuestionIds.length > 0) {
      const qMap = new Map(questionsList.map(q => [q.id, q]));
      questionsList = shuffledQuestionIds
        .map(id => qMap.get(id))
        .filter(q => q !== undefined);
    }

    const secondsLeft = Math.max(0, Math.ceil((Number(attempt.expires_at) - Date.now()) / 1000));

    return {
      attemptId: attempt.id,
      questions: questionsList,
      timeLeft: secondsLeft,
      violationCount: attempt.violation_count,
      answers: attempt.answers || {}
    };
  }

  async syncExamAttempt(userId, attemptId, answers, violationCount) {
    const attemptRes = await pool.query(
      "SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [attemptId, userId]
    );

    if (attemptRes.rows.length === 0) {
      throw new ApiError(404, "Active exam session not found or expired.");
    }

    const attempt = attemptRes.rows[0];

    if (Number(attempt.expires_at) < Date.now()) {
      await pool.query("UPDATE exam_attempts SET status = 'expired' WHERE id = $1", [attemptId]);
      throw new ApiError(403, "Time limit exceeded. Exam session is expired.");
    }

    const mergedAnswers = {
      ...(attempt.answers || {}),
      ...(answers || {})
    };

    let updatedViolations = attempt.violation_count;
    if (violationCount !== undefined) {
      updatedViolations = Number(violationCount);
    }

    await pool.query(
      `UPDATE exam_attempts 
       SET answers = $1, violation_count = $2, last_activity = $3 
       WHERE id = $4`,
      [JSON.stringify(mergedAnswers), updatedViolations, Date.now(), attemptId]
    );

    return { success: true, violationCount: updatedViolations };
  }

  async submitExamAttempt(userId, attemptId, answers = {}) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const attemptRes = await client.query(
        "SELECT * FROM exam_attempts WHERE id = $1 AND user_id = $2",
        [attemptId, userId]
      );

      if (attemptRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new ApiError(404, "Exam session not found.");
      }

      const attempt = attemptRes.rows[0];
      const moduleId = attempt.module_id;

      if (attempt.status === 'submitted' || attempt.status === 'expired') {
        const firstAttemptRes = await client.query(
          "SELECT * FROM first_attempts WHERE user_id = $1 AND module_id = $2",
          [userId, moduleId]
        );

        let questionsRes = await client.query(
          `SELECT q.id, q.correct_answer_index, eq.marks AS "positive_marks_override", eq.negative_marks AS "negative_marks_override"
           FROM questions q
           INNER JOIN exam_questions eq ON q.id = eq.question_id
           WHERE eq.exam_id = $1`,
          [moduleId]
        );
        if (questionsRes.rows.length === 0) {
          questionsRes = await client.query(
            'SELECT id, correct_answer_index, NULL AS "positive_marks_override" FROM questions WHERE module_id = $1',
            [moduleId]
          );
        }
        const dbQuestions = questionsRes.rows;
        const correctAnswersMap = {};
        dbQuestions.forEach((q) => {
          correctAnswersMap[q.id] = q.correct_answer_index;
        });

        await client.query("COMMIT");

        if (firstAttemptRes.rows.length > 0) {
          const fa = firstAttemptRes.rows[0];
          return {
            score: Number(fa.score),
            correctCount: fa.correct_count,
            totalQuestions: fa.total_questions,
            xpEarned: fa.xp_earned,
            correctAnswers: correctAnswersMap,
            alreadySubmitted: true
          };
        } else {
          const activeModuleRes = await client.query("SELECT * FROM modules WHERE id = $1", [moduleId]);
          const activeModule = activeModuleRes.rows[0];
          const modPositive = activeModule.marks_per_question !== null ? Number(activeModule.marks_per_question) : 1;
          const modNegative = activeModule.negative_marks !== null ? Number(activeModule.negative_marks) : 0.5;

          let finalScore = 0;
          let correctCount = 0;
          let maxPossibleScore = Number(activeModule.total_marks) || 0;

          if (!maxPossibleScore) {
            dbQuestions.forEach((q) => {
              const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
              maxPossibleScore += qPos;
            });
          }

          const finalAnswers = { ...(attempt.answers || {}) };
          delete finalAnswers._question_order;

          dbQuestions.forEach((q) => {
            const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
            const qNeg = (q.negative_marks_override !== undefined && q.negative_marks_override !== null) ? Number(q.negative_marks_override) : modNegative;

            const studentAnswer = finalAnswers[q.id];
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
          const xpEarned = correctCount * 10;

          return {
            score: scorePercentage,
            correctCount,
            totalQuestions: dbQuestions.length,
            xpEarned,
            correctAnswers: correctAnswersMap,
            alreadySubmitted: true
          };
        }
      }

      const finalAnswers = {
        ...(attempt.answers || {}),
        ...(answers || {})
      };
      delete finalAnswers._question_order;

      const modRes = await client.query("SELECT * FROM modules WHERE id = $1", [moduleId]);
      if (modRes.rows.length === 0) {
        await client.query("ROLLBACK");
        throw new ApiError(404, "Module not found.");
      }
      const activeModule = modRes.rows[0];
      const modPositive = activeModule.marks_per_question !== null ? Number(activeModule.marks_per_question) : 1;
      const modNegative = activeModule.negative_marks !== null ? Number(activeModule.negative_marks) : 0.5;

      let questionsRes = await client.query(
        `SELECT q.id, q.correct_answer_index, eq.marks AS "positive_marks_override", eq.negative_marks AS "negative_marks_override"
        FROM questions q
        INNER JOIN exam_questions eq ON q.id = eq.question_id
        WHERE eq.exam_id = $1`,
        [moduleId]
      );
      if (questionsRes.rows.length === 0) {
        questionsRes = await client.query(
          'SELECT id, correct_answer_index, NULL AS "positive_marks_override" FROM questions WHERE module_id = $1',
          [moduleId]
        );
      }
      const dbQuestions = questionsRes.rows;

      let finalScore = 0;
      let correctCount = 0;
      let maxPossibleScore = Number(activeModule.total_marks) || 0;

      if (!maxPossibleScore) {
        dbQuestions.forEach((q) => {
          const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
          maxPossibleScore += qPos;
        });
      }

      dbQuestions.forEach((q) => {
        const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
        const qNeg = (q.negative_marks_override !== undefined && q.negative_marks_override !== null) ? Number(q.negative_marks_override) : modNegative;

        const studentAnswer = finalAnswers[q.id];
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
      const xpEarned = correctCount * 10;

      const userRes = await client.query("SELECT name, email, branch, semester, xp FROM users WHERE id = $1", [userId]);
      if (userRes.rows.length > 0) {
        const dbUser = userRes.rows[0];
        const currentXP = Number(dbUser.xp) || 0;

        let moduleScores = {};
        try {
          const scoresRes = await client.query("SELECT module_scores FROM users WHERE id = $1", [userId]);
          moduleScores = scoresRes.rows[0]?.module_scores || {};
          if (typeof moduleScores === "string") {
            moduleScores = JSON.parse(moduleScores);
          }
        } catch (colErr) {
          moduleScores = {};
        }

        const prevScore = moduleScores[moduleId];
        if (prevScore === undefined || scorePercentage > Number(prevScore)) {
          moduleScores[moduleId] = scorePercentage;
          const newXP = currentXP + xpEarned;
          const newLevel = Math.max(1, Math.floor(newXP / 100) + 1);

          await client.query(
            "UPDATE users SET module_scores = $1, xp = $2, level = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
            [JSON.stringify(moduleScores), newXP, newLevel, userId]
          );
        }

        try {
          let companyName = null;
          let branchName = null;

          if (activeModule.module_type === "company" && activeModule.branch_id) {
            const compRes = await client.query("SELECT name FROM companies WHERE id = $1", [activeModule.branch_id]);
            if (compRes.rows.length > 0) {
              companyName = compRes.rows[0].name;
            }
          } else if (activeModule.parent_id) {
            const branchRes = await client.query("SELECT name FROM hierarchy_nodes WHERE id = $1", [activeModule.parent_id]);
            if (branchRes.rows.length > 0) {
              branchName = branchRes.rows[0].name;
            }
          }

          await client.query(
            `INSERT INTO first_attempts (
              id, user_id, user_name, user_email, student_branch, student_semester,
              module_id, module_title, module_type, company_name, branch_name,
              score, correct_count, total_questions, xp_earned
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (user_id, module_id) DO NOTHING`,
            [
              crypto.randomUUID(),
              userId,
              dbUser.name,
              dbUser.email,
              dbUser.branch,
              dbUser.semester,
              moduleId,
              activeModule.title,
              activeModule.module_type,
              companyName,
              branchName,
              scorePercentage,
              correctCount,
              dbQuestions.length,
              xpEarned
            ]
          );
        } catch (attemptErr) {
          console.error("Failed to log first attempt:", attemptErr.message);
        }
      }

      await client.query(
        "UPDATE exam_attempts SET status = 'submitted', last_activity = $1 WHERE id = $2",
        [Date.now(), attemptId]
      );

      await client.query("COMMIT");

      const correctAnswersMap = {};
      dbQuestions.forEach((q) => {
        correctAnswersMap[q.id] = q.correct_answer_index;
      });

      return {
        score: scorePercentage,
        correctCount,
        totalQuestions: dbQuestions.length,
        xpEarned,
        correctAnswers: correctAnswersMap
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getScores(userId) {
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }
    const result = await pool.query("SELECT module_scores FROM users WHERE id = $1", [userId]);
    if (result.rows.length > 0) {
      let scores = result.rows[0].module_scores || {};
      if (typeof scores === "string") {
        scores = JSON.parse(scores);
      }
      return scores;
    }
    return {};
  }

  async submitScoreDirect(userId, moduleId, answers = {}) {
    if (!userId || !moduleId) {
      throw new ApiError(400, "Missing required fields.");
    }

    const modRes = await pool.query("SELECT * FROM modules WHERE id = $1", [moduleId]);
    if (modRes.rows.length === 0) {
      throw new ApiError(404, "Module not found.");
    }
    const activeModule = modRes.rows[0];
    const modPositive = activeModule.marks_per_question !== null ? Number(activeModule.marks_per_question) : 1;
    const modNegative = activeModule.negative_marks !== null ? Number(activeModule.negative_marks) : 0.5;

    const questionsRes = await pool.query(
      "SELECT id, correct_answer_index FROM questions WHERE module_id = $1",
      [moduleId]
    );
    const dbQuestions = questionsRes.rows;

    let finalScore = 0;
    let correctCount = 0;
    let maxPossibleScore = Number(activeModule.total_marks) || 0;

    if (!maxPossibleScore) {
      dbQuestions.forEach((q) => {
        const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
        maxPossibleScore += qPos;
      });
    }

    dbQuestions.forEach((q) => {
      const qPos = (q.positive_marks_override !== undefined && q.positive_marks_override !== null) ? Number(q.positive_marks_override) : modPositive;
      const qNeg = modNegative; 

      const studentAnswer = answers[q.id];
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
    const xpEarned = correctCount * 10;

    const userRes = await pool.query("SELECT name, email, branch, semester, xp FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length > 0) {
      const dbUser = userRes.rows[0];
      const currentXP = Number(dbUser.xp) || 0;

      let moduleScores = {};
      try {
        const scoresRes = await pool.query("SELECT module_scores FROM users WHERE id = $1", [userId]);
        moduleScores = scoresRes.rows[0]?.module_scores || {};
        if (typeof moduleScores === "string") {
          moduleScores = JSON.parse(moduleScores);
        }
      } catch (colErr) {
        moduleScores = {};
      }

      const prevScore = moduleScores[moduleId];
      if (prevScore === undefined || scorePercentage > Number(prevScore)) {
        moduleScores[moduleId] = scorePercentage;
        const newXP = currentXP + xpEarned;
        const newLevel = Math.max(1, Math.floor(newXP / 100) + 1);

        try {
          await pool.query(
            "UPDATE users SET module_scores = $1, xp = $2, level = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
            [JSON.stringify(moduleScores), newXP, newLevel, userId]
          );
        } catch (updateErr) {
          await pool.query(
            "UPDATE users SET xp = $1, level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
            [newXP, newLevel, userId]
          );
        }
      }

      try {
        let companyName = null;
        let branchName = null;

        if (activeModule.module_type === "company" && activeModule.branch_id) {
          const compRes = await pool.query("SELECT name FROM companies WHERE id = $1", [activeModule.branch_id]);
          if (compRes.rows.length > 0) {
            companyName = compRes.rows[0].name;
          }
        } else if (activeModule.parent_id) {
          const branchRes = await pool.query("SELECT name FROM hierarchy_nodes WHERE id = $1", [activeModule.parent_id]);
          if (branchRes.rows.length > 0) {
            branchName = branchRes.rows[0].name;
          }
        }

        const attemptId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO first_attempts (
            id, user_id, user_name, user_email, student_branch, student_semester,
            module_id, module_title, module_type, company_name, branch_name,
            score, correct_count, total_questions, xp_earned
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (user_id, module_id) DO NOTHING`,
          [
            attemptId,
            userId,
            dbUser.name || "Student",
            dbUser.email || "",
            dbUser.branch || "",
            dbUser.semester || "",
            moduleId,
            activeModule.title || "Module",
            activeModule.module_type || "general",
            companyName,
            branchName,
            scorePercentage,
            correctCount,
            dbQuestions.length,
            xpEarned
          ]
        );
      } catch (attemptErr) {
        console.error("First attempt recording warning:", attemptErr.message);
      }
    }

    return {
      score: scorePercentage,
      correctCount,
      totalQuestions: dbQuestions.length,
      xpEarned
    };
  }
}

module.exports = new ExamAttemptsService();
