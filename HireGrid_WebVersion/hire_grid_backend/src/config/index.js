const env = require("./env");
const { pool } = require("./database");
const { corsOptions, allowedOrigins } = require("./cors");
const { helmetConfig, helmetOptions } = require("./security");

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  db: {
    url: env.DATABASE_URL,
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expire: env.JWT_EXPIRE,
  },
  email: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  cors: {
    origin: env.CORS_ORIGIN,
    frontendUrl: env.FRONTEND_URL,
  },
  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    name: env.ADMIN_NAME,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },
  storage: {
    provider: env.STORAGE_PROVIDER,
    r2AccountId: env.R2_ACCOUNT_ID,
    r2AccessKeyId: env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY,
    r2BucketName: env.R2_BUCKET_NAME,
    r2PublicUrl: env.R2_PUBLIC_URL,
  },
  rawEnv: env,
  pool,
  corsOptions,
  allowedOrigins,
  helmetConfig,
  helmetOptions: helmetOptions || helmetConfig
};
