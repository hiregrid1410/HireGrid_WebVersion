const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const LOCAL_UPLOADS_DIR = path.join(__dirname, "../public/uploads");
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local";
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

let s3Client = null;

if (STORAGE_PROVIDER === "s3" && process.env.R2_ACCOUNT_ID) {
  try {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  } catch (err) {
    console.error("Failed to initialize S3Client, falling back to local storage:", err.message);
    s3Client = null;
  }
}

// Ensure local uploads directory exists
if (!s3Client) {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Validates file parameters
 */
function validateFile(fileType, fileSize) {
  const allowedTypes = ["image/webp", "image/png", "image/jpeg", "image/gif"];
  if (!allowedTypes.includes(fileType)) {
    return { valid: false, reason: "Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed." };
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB limit
  if (fileSize > maxBytes) {
    return { valid: false, reason: "File too large. Maximum allowed size is 5MB." };
  }
  return { valid: true };
}

/**
 * Gets the public retrieval URL for an object key
 */
function getPublicUrl(fileKey) {
  if (s3Client && process.env.R2_PUBLIC_URL) {
    const publicUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, "");
    return `${publicUrl}/${fileKey}`;
  }
  // Fallback relative path for local storage
  return `/uploads/${fileKey}`;
}

/**
 * Generates an upload authorization and path
 */
async function getSignedUploadUrl(fileName, fileType) {
  const ext = path.extname(fileName) || ".webp";
  const now = new Date();
  const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const uuid = crypto.randomUUID();
  const fileKey = `questions/${datePath}/${uuid}${ext}`;

  if (s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME || "hiregrid-media";
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });
    
    // Signed URL expires in 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return {
      provider: "s3",
      uploadUrl,
      key: fileKey,
      publicUrl: getPublicUrl(fileKey),
    };
  }

  // Local fallback: generate signed validation token to prevent unauthorized upload attempts
  const token = jwt.sign({ key: fileKey, purpose: "local-upload" }, JWT_SECRET, { expiresIn: "15m" });
  return {
    provider: "local",
    uploadUrl: `/api/storage/local-upload?token=${encodeURIComponent(token)}&key=${encodeURIComponent(fileKey)}`,
    key: fileKey,
    publicUrl: getPublicUrl(fileKey),
  };
}

/**
 * Deletes an object key from storage
 */
async function deleteFile(fileKey) {
  if (s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME || "hiregrid-media";
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    await s3Client.send(command);
    return true;
  }

  // Local filesystem delete
  const localPath = path.join(LOCAL_UPLOADS_DIR, fileKey);
  if (fs.existsSync(localPath)) {
    await fs.promises.unlink(localPath);
    return true;
  }
  return false;
}

module.exports = {
  validateFile,
  getPublicUrl,
  getSignedUploadUrl,
  deleteFile,
  LOCAL_UPLOADS_DIR
};
