require("dotenv").config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || "hiregrid",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "saumya@admin.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "RadheKrishna",
  ADMIN_NAME: process.env.ADMIN_NAME || "Admin",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "hiregrid-media",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
};

module.exports = env;
