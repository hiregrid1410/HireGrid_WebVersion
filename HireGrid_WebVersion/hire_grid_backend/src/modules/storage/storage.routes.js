const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const config = require("../../config");
const storageService = require("../../services/storage.service");
const authenticate = require("../../middlewares/auth.middleware");

const JWT_SECRET = config.jwt.secret;

// Configure Disk Storage for local fallback uploads preserving S3 key structures
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileKey = req.query.key;
    if (!fileKey) {
      return cb(new Error("No file key provided in query params."));
    }
    const relativeDir = path.dirname(fileKey);
    const targetDir = path.join(storageService.LOCAL_UPLOADS_DIR, relativeDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const fileKey = req.query.key;
    cb(null, path.basename(fileKey));
  }
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * GET /api/storage/presigned-url
 */
router.get("/presigned-url", authenticate, async (req, res, next) => {
  const role = req.user?.role;
  if (role !== "admin" && role !== "content_manager") {
    return res.status(403).json({ error: "Access Denied. Only Admins/Content Managers can request upload authorizations." });
  }

  const { fileName, fileType, fileSize } = req.query;
  if (!fileName || !fileType) {
    return res.status(400).json({ error: "Missing required parameters: fileName and fileType." });
  }

  if (fileSize) {
    const sizeCheck = storageService.validateFile(fileType, Number(fileSize));
    if (!sizeCheck.valid) {
      return res.status(400).json({ error: sizeCheck.reason });
    }
  }

  try {
    const result = await storageService.getSignedUploadUrl(fileName, fileType);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Storage signed URL error:", err);
    res.status(500).json({ error: "Failed to generate upload authorization." });
  }
});

/**
 * POST /api/storage/local-upload
 */
router.post("/local-upload", (req, res, next) => {
  const { token, key } = req.query;
  if (!token || !key) {
    return res.status(400).json({ error: "Missing authentication token or file key." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.key !== key || decoded.purpose !== "local-upload") {
      return res.status(403).json({ error: "Invalid upload signature token." });
    }

    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Local upload file error:", err);
        return res.status(400).json({ error: err.message || "Failed to process local file upload." });
      }
      res.json({
        success: true,
        message: "File uploaded successfully to local storage.",
        key,
        publicUrl: storageService.getPublicUrl(key)
      });
    });
  } catch (err) {
    console.error("Local upload validation error:", err);
    res.status(403).json({ error: "Invalid or expired upload authorization token." });
  }
});

module.exports = router;
