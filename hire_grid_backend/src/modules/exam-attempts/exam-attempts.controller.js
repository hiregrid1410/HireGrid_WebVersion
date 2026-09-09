const examAttemptsService = require("./exam-attempts.service");

class ExamAttemptsController {
  async startExamAttempt(req, res, next) {
    try {
      const result = await examAttemptsService.startExamAttempt(req.user?.id, req.body.moduleId);
      res.json(result);
    } catch (err) {
      console.error("Start exam attempt error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to initialize exam session." });
    }
  }

  async syncExamAttempt(req, res, next) {
    try {
      const result = await examAttemptsService.syncExamAttempt(req.user?.id, req.params.id, req.body.answers, req.body.violationCount);
      res.json(result);
    } catch (err) {
      console.error("Sync attempt error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to sync exam state." });
    }
  }

  async submitExamAttempt(req, res, next) {
    try {
      const result = await examAttemptsService.submitExamAttempt(req.user?.id, req.params.id, req.body.answers);
      res.json(result);
    } catch (err) {
      console.error("Submit exam attempt error:", err);
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to submit and grade exam." });
    }
  }

  async getScores(req, res, next) {
    try {
      const scores = await examAttemptsService.getScores(req.user?.id);
      res.json({ success: true, scores });
    } catch (err) {
      res.json({ success: true, scores: {} });
    }
  }

  async submitScore(req, res, next) {
    try {
      const result = await examAttemptsService.submitScoreDirect(req.user?.id, req.body.moduleId, req.body.answers);
      res.json({ success: true, ...result });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ExamAttemptsController();
