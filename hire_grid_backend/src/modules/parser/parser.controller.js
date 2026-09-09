const parserService = require("./parser.service");

class ParserController {
  async parseMcq(req, res, next) {
    try {
      const questions = await parserService.parseMcq(req.body.text);
      res.json({ questions });
    } catch (err) {
      console.error("Error formatting questions via Gemini API:", err);
      res.status(400).json({ error: "Temporary issue connecting to the AI model. Please try again." });
    }
  }
}

module.exports = new ParserController();
