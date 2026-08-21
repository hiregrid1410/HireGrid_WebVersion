const { pool } = require("../config/db");
const { recalculateLeaderboardSnapshots, getActiveCycle } = require("../controllers/placementMissionController");

// Helper: Get formatted date string in Asia/Kolkata
const getKolkataDateString = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return `${map.year}-${map.month}-${map.day}`;
};

const runLeaderboardJob = async () => {
  const dateStr = getKolkataDateString();
  
  try {
    // 1. Try to lock the execution for today's date
    const lockRes = await pool.query(
      `INSERT INTO leaderboard_job_runs (run_date, status, logs)
       VALUES ($1, 'pending', 'Job started in background...')
       ON CONFLICT (run_date) DO NOTHING
       RETURNING run_date`,
      [dateStr]
    );

    if (lockRes.rows.length === 0) {
      // Job already started or executed successfully for today
      return;
    }

    console.log(`[SCHEDULER] Acquired lock to run leaderboard daily job for ${dateStr}`);

    // 2. Fetch active cycle
    const cycle = await getActiveCycle();

    // 3. Recalculate
    const result = await recalculateLeaderboardSnapshots(cycle.id);

    const logMessage = `Successfully recalculated leaderboard snapshots. Ranked ${result.count} users.`;
    
    // 4. Mark job runs as success
    await pool.query(
      `UPDATE leaderboard_job_runs
       SET status = 'success', logs = $1, executed_at = CURRENT_TIMESTAMP
       WHERE run_date = $2`,
      [logMessage, dateStr]
    );
    console.log(`[SCHEDULER] Daily leaderboard job completed successfully for ${dateStr}`);
  } catch (err) {
    console.error(`[SCHEDULER] Daily leaderboard job failed for ${dateStr}:`, err);
    try {
      await pool.query(
        `UPDATE leaderboard_job_runs
         SET status = 'failed', logs = $1, executed_at = CURRENT_TIMESTAMP
         WHERE run_date = $2`,
        [err.stack || err.message, dateStr]
      );
    } catch (dbErr) {
      console.error("[SCHEDULER] Failed to write error logs to database:", dbErr.message);
    }
  }
};

const startScheduler = () => {
  console.log("[SCHEDULER] Initializing Daily Leaderboard Job Scheduler (Asia/Kolkata timezone).");
  
  // Run on startup (with a 5 seconds delay to let db finish migrations)
  setTimeout(() => {
    runLeaderboardJob();
  }, 5000);

  // Check every 5 minutes
  setInterval(() => {
    runLeaderboardJob();
  }, 5 * 60 * 1000);
};

module.exports = {
  startScheduler
};
