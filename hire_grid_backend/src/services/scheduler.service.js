const { pool } = require("../database/connection");
const placementMissionService = require("../modules/placement-missions/placement-mission.service");

const runLeaderboardJob = async () => {
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
  
  const hourVal = Number(map.hour);
  const suffix = hourVal < 12 ? "AM" : "PM";
  const dateStr = `${map.year}-${map.month}-${map.day}_${suffix}`;

  try {
    const lockRes = await pool.query(
      `INSERT INTO leaderboard_job_runs (run_date, status, logs)
       VALUES ($1, 'pending', 'Job started in background...')
       ON CONFLICT (run_date) DO NOTHING
       RETURNING run_date`,
      [dateStr]
    );

    if (lockRes.rows.length === 0) {
      return;
    }

    console.log(`[SCHEDULER] Acquired lock to run leaderboard daily job for ${dateStr}`);

    const cycle = await placementMissionService.getActiveCycle();
    const result = await placementMissionService.recalculateLeaderboardSnapshots(cycle.id);

    const logMessage = `Successfully recalculated leaderboard snapshots. Ranked ${result.count} users.`;
    
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
  
  setTimeout(() => {
    runLeaderboardJob();
  }, 5000);

  setInterval(() => {
    runLeaderboardJob();
  }, 5 * 60 * 1000);
};

module.exports = {
  startScheduler,
  runLeaderboardJob
};
