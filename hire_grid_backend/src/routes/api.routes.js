const express = require("express");
const router = express.Router();

// Middlewares
const authenticate = require("../middlewares/auth.middleware");
const { apiRateLimiter, sensitiveActionRateLimiter } = require("../middlewares/rateLimit.middleware");

// Controllers
const { parserController } = require("../modules/parser");
const { examAttemptsController } = require("../modules/exam-attempts");
const { modulesController } = require("../modules/modules");
const { companiesController } = require("../modules/companies");
const { plansController } = require("../modules/plans");
const { branchesController } = require("../modules/branches");
const { gateController } = require("../modules/gate");
const { usersController } = require("../modules/users");
const { adminUsersController } = require("../modules/admin-users");
const { miscController } = require("../modules/misc");

// Protect all /api routes mounted on this router
router.use(authenticate);
router.use(apiRateLimiter);

// Cache-Control headers for GET endpoints
router.use((req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "private, max-age=10");
  }
  next();
});

// Parse MCQ (Gemini)
router.post("/parse-mcq", (req, res, next) => parserController.parseMcq(req, res, next));

// Exam Attempts
router.post("/attempts/start", sensitiveActionRateLimiter, (req, res, next) => examAttemptsController.startExamAttempt(req, res, next));
router.post("/attempts/:id/sync", (req, res, next) => examAttemptsController.syncExamAttempt(req, res, next));
router.post("/attempts/:id/submit", sensitiveActionRateLimiter, (req, res, next) => examAttemptsController.submitExamAttempt(req, res, next));

// Security Logs
router.post("/security-logs", (req, res, next) => miscController.logSecurityEvent(req, res, next));
router.get("/security-logs", (req, res, next) => miscController.getSecurityLogs(req, res, next));

// Modules
router.get("/modules", (req, res, next) => modulesController.getModules(req, res, next));
router.post("/modules", (req, res, next) => modulesController.saveModules(req, res, next));
router.delete("/modules/:id", (req, res, next) => modulesController.deleteModule(req, res, next));
router.get("/modules/:id/questions", (req, res, next) => modulesController.getModuleQuestions(req, res, next));

// Stats
router.get("/stats", (req, res, next) => miscController.getStats(req, res, next));

// Scores
router.get("/scores", (req, res, next) => examAttemptsController.getScores(req, res, next));
router.post("/scores", (req, res, next) => examAttemptsController.submitScore(req, res, next));

// Companies
router.get("/companies", (req, res, next) => companiesController.getCompanies(req, res, next));
router.post("/companies", (req, res, next) => companiesController.saveCompany(req, res, next));
router.delete("/companies/:id", (req, res, next) => companiesController.deleteCompany(req, res, next));

// Exams
router.get("/exams", (req, res, next) => companiesController.getExams(req, res, next));
router.post("/exams", (req, res, next) => companiesController.saveExam(req, res, next));
router.delete("/exams/:id", (req, res, next) => companiesController.deleteExam(req, res, next));

// Settings
router.get("/settings/:id", (req, res, next) => miscController.getSettings(req, res, next));
router.post("/settings/:id", (req, res, next) => miscController.saveSettings(req, res, next));

// Plans
router.get("/plans", (req, res, next) => plansController.getPlans(req, res, next));
router.get("/plans/:id", (req, res, next) => plansController.getPlanById(req, res, next));
router.post("/plans", (req, res, next) => plansController.savePlan(req, res, next));
router.delete("/plans/:id", (req, res, next) => plansController.deletePlan(req, res, next));

// Payment Requests
router.get("/payment-requests", (req, res, next) => plansController.getPaymentRequests(req, res, next));
router.post("/payment-requests", (req, res, next) => plansController.createPaymentRequest(req, res, next));
router.put("/payment-requests/:id", (req, res, next) => plansController.updatePaymentRequest(req, res, next));

// Hierarchy Nodes
router.get("/hierarchy-nodes", (req, res, next) => companiesController.getHierarchyNodes(req, res, next));
router.post("/hierarchy-nodes", (req, res, next) => companiesController.saveHierarchyNode(req, res, next));
router.delete("/hierarchy-nodes/:id", (req, res, next) => companiesController.deleteHierarchyNode(req, res, next));

// GATE
router.get("/gate/branches", (req, res, next) => gateController.getGateBranches(req, res, next));
router.post("/gate/branches", (req, res, next) => gateController.saveGateBranch(req, res, next));
router.get("/gate/papers", (req, res, next) => gateController.getGatePapers(req, res, next));
router.post("/gate/papers", (req, res, next) => gateController.saveGatePaper(req, res, next));

// Branches & Access Mappings
router.get("/branches", (req, res, next) => branchesController.getBranches(req, res, next));
router.get("/branches/active", (req, res, next) => branchesController.getActiveBranches(req, res, next));
router.post("/branches", (req, res, next) => branchesController.saveBranch(req, res, next));
router.put("/branches/:id", (req, res, next) => branchesController.saveBranch(req, res, next));
router.delete("/branches/:id", (req, res, next) => branchesController.deleteBranch(req, res, next));

router.get("/companies/:companyId/branches", (req, res, next) => branchesController.getCompanyBranches(req, res, next));
router.put("/companies/:companyId/branches", (req, res, next) => branchesController.saveCompanyBranches(req, res, next));
router.put("/companies-batch/branches", (req, res, next) => branchesController.saveCompanyBranchesBatch(req, res, next));

router.get("/content-mappings/:contentType/:contentId", (req, res, next) => branchesController.getContentMappings(req, res, next));
router.put("/content-mappings/:contentType/:contentId", (req, res, next) => branchesController.saveContentMappings(req, res, next));
router.put("/content-mappings-batch/:contentType", (req, res, next) => branchesController.saveContentMappingsBatch(req, res, next));

// User Management (Admin)
router.post("/users", (req, res, next) => usersController.updateUser(req, res, next));
router.get("/admin/questions", (req, res, next) => modulesController.getQuestionsAdmin(req, res, next));
router.get("/users", (req, res, next) => usersController.getUsers(req, res, next));
router.get("/users/:id", (req, res, next) => usersController.getUserById(req, res, next));
router.put("/users/:id", (req, res, next) => usersController.updateUser(req, res, next));
router.delete("/users/:id", (req, res, next) => usersController.deleteUser(req, res, next));

// Admin User Management
router.get("/admin_users", (req, res, next) => adminUsersController.getAdminUsers(req, res, next));
router.post("/admin_users", (req, res, next) => adminUsersController.saveAdminUser(req, res, next));
router.put("/admin_users/:id", (req, res, next) => adminUsersController.updateAdminUser(req, res, next));
router.delete("/admin_users/:id", (req, res, next) => adminUsersController.deleteAdminUser(req, res, next));

// Access & Device Requests
router.get("/access-requests", (req, res, next) => miscController.getAccessRequests(req, res, next));
router.post("/access-requests", (req, res, next) => miscController.createAccessRequest(req, res, next));

router.get("/device-requests", (req, res, next) => usersController.getDeviceRequests(req, res, next));
router.post("/device-requests", (req, res, next) => usersController.createDeviceRequest(req, res, next));
router.put("/device-requests/:id", (req, res, next) => usersController.updateDeviceRequest(req, res, next));

// Feedbacks
router.get("/feedbacks", (req, res, next) => miscController.getFeedbacks(req, res, next));
router.post("/feedbacks", (req, res, next) => miscController.createFeedback(req, res, next));
router.delete("/feedbacks/:id", (req, res, next) => miscController.deleteFeedback(req, res, next));

// Notifications, Purchases, Audit Logs (polling compatibility)
router.get("/notifications", (req, res, next) => miscController.getNotifications(req, res, next));
router.get("/purchases", (req, res, next) => miscController.getPurchases(req, res, next));
router.get("/audit-logs", (req, res, next) => miscController.getAuditLogs(req, res, next));
router.get("/audit_logs", (req, res, next) => miscController.getAuditLogs(req, res, next));

module.exports = router;
