const { Pool } = require("pg");
const bcrypt = require("bcrypt");
require("dotenv").config();

const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 30000,
  })
  
  : new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "hiregrid",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: (process.env.DB_HOST && process.env.DB_HOST.includes("neon.tech"))
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 30000,
  });

// Handle pool errors so idle connection socket drops don't crash Node process
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle database client:", err.message);
});

// Helper function to check if an error is a database connection/socket issue
function isDbConnectionError(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toString().toUpperCase();
  return (
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    code === "ETIMEDOUT" ||
    code === "57P01" || // admin_shutdown
    code === "57P02" || // crash_shutdown
    code === "57P03" || // cannot_connect_now
    msg.includes("econnreset") ||
    msg.includes("connection terminated unexpectedly") ||
    msg.includes("terminated due to administrator command") ||
    msg.includes("socket") ||
    msg.includes("read") ||
    msg.includes("connection timeout")
  );
}

// Wrapper for pool.query with retry logic
const originalPoolQuery = pool.query;
pool.query = function (text, params, callback) {
  let actualParams = params;
  let actualCallback = callback;
  if (typeof params === 'function') {
    actualCallback = params;
    actualParams = undefined;
  }

  if (actualCallback) {
    let attempts = 0;
    const maxAttempts = 3;

    const tryQuery = () => {
      originalPoolQuery.call(pool, text, actualParams, (err, result) => {
        if (err) {
          attempts++;
          if (isDbConnectionError(err) && attempts < maxAttempts) {
            console.warn(`[DB pool.query callback warning] Connection error: ${err.message}. Retrying (attempt ${attempts + 1}/${maxAttempts}) in ${attempts}s...`);
            setTimeout(tryQuery, attempts * 1000);
            return;
          }
          return actualCallback(err, result);
        }
        return actualCallback(null, result);
      });
    };

    tryQuery();
    return;
  }

  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const result = await originalPoolQuery.call(pool, text, actualParams);
        resolve(result);
        return;
      } catch (err) {
        attempts++;
        if (isDbConnectionError(err) && attempts < maxAttempts) {
          console.warn(`[DB pool.query promise warning] Connection error: ${err.message}. Retrying (attempt ${attempts + 1}/${maxAttempts}) in ${attempts}s...`);
          await new Promise((r) => setTimeout(r, attempts * 1000));
          continue;
        }
        reject(err);
        return;
      }
    }
  });
};

// Wrapper for pool.connect with retry logic
const originalPoolConnect = pool.connect;
pool.connect = function (callback) {
  if (callback) {
    let attempts = 0;
    const maxAttempts = 3;

    const tryConnect = () => {
      originalPoolConnect.call(pool, (err, client, release) => {
        if (err) {
          attempts++;
          if (isDbConnectionError(err) && attempts < maxAttempts) {
            console.warn(`[DB pool.connect callback warning] Connection error: ${err.message}. Retrying (attempt ${attempts + 1}/${maxAttempts}) in ${attempts}s...`);
            setTimeout(tryConnect, attempts * 1000);
            return;
          }
          return callback(err, client, release);
        }
        return callback(null, client, release);
      });
    };

    tryConnect();
    return;
  }

  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const client = await originalPoolConnect.apply(pool);
        resolve(client);
        return;
      } catch (err) {
        attempts++;
        if (isDbConnectionError(err) && attempts < maxAttempts) {
          console.warn(`[DB pool.connect promise warning] Connection error: ${err.message}. Retrying (attempt ${attempts + 1}/${maxAttempts}) in ${attempts}s...`);
          await new Promise((r) => setTimeout(r, attempts * 1000));
          continue;
        }
        reject(err);
        return;
      }
    }
  });
};

const createTablesQuery = `
  -- 1. users
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'student',
    name VARCHAR(255),
    branch VARCHAR(255),
    semester VARCHAR(50),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    rank VARCHAR(100) DEFAULT 'Rising Scholar',
    specialization VARCHAR(255),
    has_full_premium BOOLEAN DEFAULT FALSE,
    device_id VARCHAR(255),
    max_devices INTEGER DEFAULT 1,
    allowed_devices JSONB DEFAULT '[]',
    active_plan_id VARCHAR(255),
    plan_expiry BIGINT,
    google_id VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'local',
    profile_picture TEXT,
    module_scores JSONB DEFAULT '{}',
    purchased_companies JSONB DEFAULT '[]',
    granted_company_access JSONB DEFAULT '{}',
    granted_subject_access JSONB DEFAULT '{}',
    granted_topic_access JSONB DEFAULT '{}',
    granted_exam_access JSONB DEFAULT '{}',
    granted_module_access JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. admin_users
  CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. modules
  CREATE TABLE IF NOT EXISTS modules (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    questions JSONB DEFAULT '[]',
    module_type VARCHAR(100) DEFAULT 'general',
    parent_id VARCHAR(255),
    description TEXT,
    category VARCHAR(255),
    time_limit INTEGER,
    pass_percentage INTEGER,
    marks_per_question NUMERIC(10,2),
    negative_marks NUMERIC(10,2),
    total_marks INTEGER,
    access_mode VARCHAR(100),
    access_type VARCHAR(100),
    is_premium BOOLEAN,
    price NUMERIC(10,2),
    display_order INTEGER,
    is_master BOOLEAN DEFAULT FALSE,
    sub_tests JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 6. companies
  CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    access_type VARCHAR(100) DEFAULT 'free',
    is_premium BOOLEAN DEFAULT FALSE,
    price NUMERIC(10, 2) DEFAULT 0,
    sell_type VARCHAR(100) DEFAULT 'pack',
    display_order INTEGER,
    created_at BIGINT
  );

  -- 7. exams
  CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 8. gate_branches
  CREATE TABLE IF NOT EXISTS gate_branches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  );

  -- 9. gate_papers
  CREATE TABLE IF NOT EXISTS gate_papers (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL
  );

  -- 11. purchases
  CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 12. settings
  CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(255) PRIMARY KEY,
    contact_number VARCHAR(100),
    whatsapp_number VARCHAR(100),
    upi_id VARCHAR(255),
    bank_details TEXT,
    instructions TEXT
  );

  -- 13. payment_requests
  CREATE TABLE IF NOT EXISTS payment_requests (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    transaction_id VARCHAR(255),
    item_name VARCHAR(255),
    item_id VARCHAR(255),
    item_type VARCHAR(100) DEFAULT 'full_premium',
    amount NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 14. hierarchy_nodes
  CREATE TABLE IF NOT EXISTS hierarchy_nodes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    parent_id VARCHAR(255),
    description TEXT,
    access_type VARCHAR(100) DEFAULT 'free',
    is_premium BOOLEAN DEFAULT FALSE,
    sell_type VARCHAR(100) DEFAULT 'pack',
    display_order INTEGER,
    created_at BIGINT
  );

  -- 16. plans
  CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL
  );

  -- 17. access_requests
  CREATE TABLE IF NOT EXISTS access_requests (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 18. device_requests
  CREATE TABLE IF NOT EXISTS device_requests (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 19. content_managers
  CREATE TABLE IF NOT EXISTS content_managers (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'content_manager',
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 20. otps
  CREATE TABLE IF NOT EXISTS otps (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    failed_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 21. feedbacks
  CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    feedback_type VARCHAR(100),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 22. questions
  CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(255) PRIMARY KEY,
    module_id VARCHAR(255) REFERENCES modules(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer_index INTEGER,
    svg_code TEXT,
    display_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 23. first_attempts
  CREATE TABLE IF NOT EXISTS first_attempts (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    student_branch VARCHAR(255),
    student_semester VARCHAR(50),
    module_id VARCHAR(255) NOT NULL,
    module_title VARCHAR(255),
    module_type VARCHAR(100),
    company_name VARCHAR(255),
    branch_name VARCHAR(255),
    score INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_module_first_attempt UNIQUE (user_id, module_id)
  );
`;



async function initDb() {
  try {
    // Check if users table already exists to skip migration overhead
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("Creating database tables...");
      // 1. Create tables
      await pool.query(createTablesQuery);

      // Create Indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_questions_module_id ON questions(module_id);
        CREATE INDEX IF NOT EXISTS idx_modules_module_type ON modules(module_type);
        CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON modules(parent_id);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_parent_id ON hierarchy_nodes(parent_id);
        CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_type ON hierarchy_nodes(type);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      `);
    }

    // Ensure critical schema alterations run outside the skipped migration block
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS module_scores JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS purchased_companies JSONB DEFAULT '[]';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_company_access JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_subject_access JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_topic_access JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_exam_access JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_module_access JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 1;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_devices JSONB DEFAULT '[]';
        
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS contact_number VARCHAR(255);
        
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS qr_code TEXT;
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS payment_number VARCHAR(255);
        
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS qr_code TEXT;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS payment_number VARCHAR(255);
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_from BIGINT;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_until BIGINT;

        -- Exam attempts table for secure session-based testing and anti-cheating violations
        CREATE TABLE IF NOT EXISTS exam_attempts (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          module_id VARCHAR(255) NOT NULL,
          started_at BIGINT NOT NULL,
          expires_at BIGINT NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          violation_count INTEGER DEFAULT 0,
          last_activity BIGINT NOT NULL,
          answers JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Security audit logs table
        CREATE TABLE IF NOT EXISTS security_logs (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          user_name VARCHAR(255),
          user_email VARCHAR(255),
          event_type VARCHAR(100) NOT NULL,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_module ON exam_attempts(user_id, module_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
        CREATE INDEX IF NOT EXISTS idx_first_attempts_user_module ON first_attempts(user_id, module_id);
        CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);
      `);
    } catch (migErr) {
      console.error("Critical bootstrap schema migration failed:", migErr.message);
    }

    // Create schema_migrations table if not exists and check if migrations have already run
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationCheck = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = 'v1'`);
    if (migrationCheck.rows.length > 0) {
      console.log("Database migrations are already up-to-date (v1). Skipping heavy migrations check.");
      // Skip the rest of initDb
    } else {
      console.log("Running one-time schema alterations and index creations...");
      await pool.query(`
       DROP TABLE IF EXISTS scores, gate_scores, notifications, audit_logs CASCADE;

       CREATE TABLE IF NOT EXISTS first_attempts (
         id VARCHAR(255) PRIMARY KEY,
         user_id VARCHAR(255) NOT NULL,
         user_name VARCHAR(255),
         user_email VARCHAR(255),
         student_branch VARCHAR(255),
         student_semester VARCHAR(50),
         module_id VARCHAR(255) NOT NULL,
         module_title VARCHAR(255),
         module_type VARCHAR(100),
         company_name VARCHAR(255),
         branch_name VARCHAR(255),
         score INTEGER NOT NULL,
         correct_count INTEGER NOT NULL,
         total_questions INTEGER NOT NULL,
         xp_earned INTEGER DEFAULT 0,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         CONSTRAINT unique_user_module_first_attempt UNIQUE (user_id, module_id)
       );

       CREATE TABLE IF NOT EXISTS plan_mappings (
         id VARCHAR(255) PRIMARY KEY,
         plan_id VARCHAR(255) REFERENCES plans(id) ON DELETE CASCADE,
         company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
         branch_id VARCHAR(255) REFERENCES hierarchy_nodes(id) ON DELETE CASCADE,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );

       CREATE INDEX IF NOT EXISTS idx_plan_mappings_plan_id ON plan_mappings(plan_id);
       CREATE INDEX IF NOT EXISTS idx_plan_mappings_company_id ON plan_mappings(company_id);
       CREATE INDEX IF NOT EXISTS idx_plan_mappings_branch_id ON plan_mappings(branch_id);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_content_managers_email ON content_managers(email);

      CREATE INDEX IF NOT EXISTS idx_questions_module_id ON questions(module_id);
      CREATE INDEX IF NOT EXISTS idx_modules_module_type ON modules(module_type);
      CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON modules(parent_id);
      CREATE INDEX IF NOT EXISTS idx_modules_type_parent ON modules(module_type, parent_id);
      CREATE INDEX IF NOT EXISTS idx_modules_display_order ON modules(display_order);
      CREATE INDEX IF NOT EXISTS idx_questions_module_order ON questions(module_id, display_order);
      CREATE INDEX IF NOT EXISTS idx_companies_display_order ON companies(display_order);
      CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_parent_type ON hierarchy_nodes(parent_id, type);
      CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_parent_id ON hierarchy_nodes(parent_id);
      CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_type ON hierarchy_nodes(type);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

      ALTER TABLE questions ADD COLUMN IF NOT EXISTS positive_marks_override NUMERIC(10,2);
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS item_type VARCHAR(100) DEFAULT 'full_premium';
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS item_id VARCHAR(255);
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 12;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL;
      
      -- Add created_by columns
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

      -- Plans additions
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS duration VARCHAR(50) DEFAULT 'free';
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_freemium BOOLEAN DEFAULT FALSE;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS learning_content JSONB DEFAULT '[]';
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS company_modules JSONB DEFAULT '[]';
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS free_demo_modules JSONB DEFAULT '[]';
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE plans ALTER COLUMN duration_days DROP NOT NULL;
      
      -- Modules column additions
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS category VARCHAR(255);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS time_limit INTEGER;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS pass_percentage INTEGER;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS marks_per_question NUMERIC(10,2);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS negative_marks NUMERIC(10,2);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS total_marks INTEGER;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS access_mode VARCHAR(100);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS access_type VARCHAR(100);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_premium BOOLEAN;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS display_order INTEGER;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT FALSE;
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS sub_tests JSONB DEFAULT '[]';
      ALTER TABLE modules ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_modules_branch_id ON modules(branch_id);

       -- Hierarchy nodes additions
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS access_type VARCHAR(100) DEFAULT 'free';
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS sell_type VARCHAR(100) DEFAULT 'pack';
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS display_order INTEGER;
      ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS created_at BIGINT;

      -- Companies additions
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_type VARCHAR(100) DEFAULT 'free';
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS sell_type VARCHAR(100) DEFAULT 'pack';
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS display_order INTEGER;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at BIGINT;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS module_scores JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS purchased_companies JSONB DEFAULT '[]';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_company_access JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_subject_access JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_topic_access JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_exam_access JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS granted_module_access JSONB DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_devices JSONB DEFAULT '[]';

      -- Device requests additions
      ALTER TABLE device_requests ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
      ALTER TABLE device_requests ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
      ALTER TABLE device_requests ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);
      ALTER TABLE device_requests ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);

      -- Payment requests additions
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);
      ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0;
      -- Nullability alterations
      ALTER TABLE payment_requests ALTER COLUMN amount DROP NOT NULL;

      -- Plans additions
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS contact_number VARCHAR(255);
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_from BIGINT;
      ALTER TABLE plans ADD COLUMN IF NOT EXISTS active_until BIGINT;

      -- User theme addition
      ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'dark';
    `);

    // 3. Conditional Legacy Migrations
    const logoColCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='companies' AND column_name='logo'
    `);
    if (logoColCheck.rows.length > 0) {
      await pool.query(`UPDATE companies SET logo_url = logo WHERE logo_url IS NULL AND logo IS NOT NULL`);
    }

    const titleColCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='hierarchy_nodes' AND column_name='title'
    `);
    if (titleColCheck.rows.length > 0) {
      await pool.query(`UPDATE hierarchy_nodes SET name = title WHERE name IS NULL AND title IS NOT NULL`);
      await pool.query(`ALTER TABLE hierarchy_nodes ALTER COLUMN title DROP NOT NULL`);
    }



    // Seed Super Admin if not exists (credentials from env vars)
    const seedEmail = process.env.ADMIN_EMAIL;
    const seedPassword = process.env.ADMIN_PASSWORD;
    const seedName = process.env.ADMIN_NAME || "Admin";
    if (seedEmail && seedPassword) {
      const adminCheck = await pool.query(`SELECT id FROM admin_users WHERE email = $1`, [seedEmail]);
      if (adminCheck.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(seedPassword, 10);
        const adminId = "super_admin_" + seedName.toLowerCase().replace(/\s+/g, "_");
        await pool.query(
          `INSERT INTO admin_users (id, email, password, name, role) VALUES ($1, $2, $3, $4, $5)`,
          [adminId, seedEmail, hashedPassword, seedName, 'admin']
        );
        console.log(`Super admin user ${seedName} seeded successfully.`);
      }
    } else {
      console.log("ADMIN_EMAIL/ADMIN_PASSWORD not set in .env — skipping admin seed.");
    }

    // Insert schema migration v1 to skip future alters
    await pool.query(`INSERT INTO schema_migrations (version) VALUES ('v1') ON CONFLICT DO NOTHING`);
    console.log("Database tables created/verified successfully.");
    } // End of migrations run block

    // --- Placement Mission V2 Migrations ---
    const migrationCheckV2 = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = 'v2'`);
    if (migrationCheckV2.rows.length === 0) {
      console.log("Running Placement Mission schema migrations (v2)...");
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS placement_mission_cycles (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_placement_mission BOOLEAN DEFAULT FALSE;
          ALTER TABLE modules ADD COLUMN IF NOT EXISTS cycle_id VARCHAR(255) REFERENCES placement_mission_cycles(id) ON DELETE SET NULL;
          ALTER TABLE modules ADD COLUMN IF NOT EXISTS start_time BIGINT;
          ALTER TABLE modules ADD COLUMN IF NOT EXISTS end_time BIGINT;

          CREATE TABLE IF NOT EXISTS placement_mission_attempts (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            module_id VARCHAR(255) NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
            cycle_id VARCHAR(255) NOT NULL REFERENCES placement_mission_cycles(id) ON DELETE CASCADE,
            started_at BIGINT NOT NULL,
            expires_at BIGINT NOT NULL,
            submitted_at BIGINT,
            status VARCHAR(50) DEFAULT 'active',
            answers JSONB DEFAULT '{}',
            score NUMERIC(5,2),
            accuracy NUMERIC(5,2),
            completion_time INTEGER,
            xp_earned INTEGER DEFAULT 0,
            speed_bonus INTEGER DEFAULT 0,
            is_valid BOOLEAN DEFAULT TRUE,
            invalidated_by VARCHAR(255),
            invalidated_at TIMESTAMP,
            invalidated_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_user_module_cycle UNIQUE (user_id, module_id, cycle_id)
          );

          CREATE INDEX IF NOT EXISTS idx_p_mission_attempts_user_id ON placement_mission_attempts(user_id);
          CREATE INDEX IF NOT EXISTS idx_p_mission_attempts_module_id ON placement_mission_attempts(module_id);
          CREATE INDEX IF NOT EXISTS idx_p_mission_attempts_cycle_id ON placement_mission_attempts(cycle_id);

          CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
            id VARCHAR(255) PRIMARY KEY,
            cycle_id VARCHAR(255) REFERENCES placement_mission_cycles(id) ON DELETE CASCADE,
            rank INTEGER NOT NULL,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            user_name VARCHAR(255),
            xp INTEGER NOT NULL,
            accuracy NUMERIC(5,2) NOT NULL,
            completion_time INTEGER NOT NULL,
            badge VARCHAR(100) NOT NULL,
            calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_cycle_id ON leaderboard_snapshots(cycle_id);

          CREATE TABLE IF NOT EXISTS leaderboard_job_runs (
            run_date DATE PRIMARY KEY,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'success',
            logs TEXT
          );
        `);

        // Seed default cycle if none exists
        const cycleCheck = await pool.query(`SELECT id FROM placement_mission_cycles LIMIT 1`);
        if (cycleCheck.rows.length === 0) {
          await pool.query(`
            INSERT INTO placement_mission_cycles (id, name, is_active)
            VALUES ('cycle_1', 'Cycle 1', TRUE)
          `);
          console.log("Default Placement Mission Cycle (Cycle 1) seeded successfully.");
        }

        await pool.query(`INSERT INTO schema_migrations (version) VALUES ('v2') ON CONFLICT DO NOTHING`);
        console.log("Placement Mission schema migrations (v2) run successfully.");
      } catch (errV2) {
        console.error("Failed to run Placement Mission migration v2:", errV2.message);
      }
    }

    // --- Draft / Publish v3 Migrations ---
    const migrationCheckV3 = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = 'v3'`);
    if (migrationCheckV3.rows.length === 0) {
      console.log("Running Draft / Publish schema migrations (v3)...");
      try {
        await pool.query(`
          ALTER TABLE modules ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) DEFAULT 'PUBLISHED';
          ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
          ALTER TABLE companies ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) DEFAULT 'PUBLISHED';
          ALTER TABLE exams ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) DEFAULT 'PUBLISHED';
          ALTER TABLE hierarchy_nodes ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) DEFAULT 'PUBLISHED';

          CREATE INDEX IF NOT EXISTS idx_modules_pub_status ON modules(publication_status);
          CREATE INDEX IF NOT EXISTS idx_modules_time_range ON modules(start_time, end_time);
          CREATE INDEX IF NOT EXISTS idx_companies_pub_status ON companies(publication_status);
          CREATE INDEX IF NOT EXISTS idx_exams_pub_status ON exams(publication_status);
          CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_pub_status ON hierarchy_nodes(publication_status);
        `);
        await pool.query(`INSERT INTO schema_migrations (version) VALUES ('v3') ON CONFLICT DO NOTHING`);
        console.log("Draft / Publish schema migrations (v3) run successfully.");
      } catch (errV3) {
        console.error("Failed to run Draft/Publish migration v3:", errV3.message);
      }
    }

    // --- Performance Indexes v4 Migrations ---
    const migrationCheckV4 = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = 'v4'`);
    if (migrationCheckV4.rows.length === 0) {
      console.log("Running Performance Indexes schema migrations (v4)...");
      try {
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_modules_placement_cycle ON modules(is_placement_mission, is_active, cycle_id);
          CREATE INDEX IF NOT EXISTS idx_p_mission_attempts_user_cycle ON placement_mission_attempts(user_id, cycle_id);
          CREATE INDEX IF NOT EXISTS idx_p_mission_attempts_cycle_status_valid ON placement_mission_attempts(cycle_id, status, is_valid);
        `);
        await pool.query(`INSERT INTO schema_migrations (version) VALUES ('v4') ON CONFLICT DO NOTHING`);
        console.log("Performance Indexes schema migrations (v4) run successfully.");
      } catch (errV4) {
        console.error("Failed to run Performance Indexes migration v4:", errV4.message);
      }
    }

    // --- Production Scale Up v5 Migrations ---
    const migrationCheckV5 = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = 'v5'`);
    if (migrationCheckV5.rows.length === 0) {
      console.log("Running Scale Up schema migrations (v5)...");
      try {
        await pool.query(`
          -- Add metadata columns to questions
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'medium';
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published';
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_key TEXT;
          ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation_image_key TEXT;

          -- Create exam_questions mapping table for MCQ reusability
          CREATE TABLE IF NOT EXISTS exam_questions (
            exam_id VARCHAR(255) NOT NULL,
            question_id VARCHAR(255) REFERENCES questions(id) ON DELETE CASCADE,
            question_order INTEGER,
            marks NUMERIC(10,2),
            negative_marks NUMERIC(10,2),
            PRIMARY KEY (exam_id, question_id)
          );

          -- Performance Optimization Indexes
          CREATE INDEX IF NOT EXISTS idx_modules_parent_pub ON modules(parent_id, publication_status);
          CREATE INDEX IF NOT EXISTS idx_modules_type_pub ON modules(module_type, publication_status);
          CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_parent_type_pub ON hierarchy_nodes(parent_id, type, publication_status);
          CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_cycle_rank ON leaderboard_snapshots(cycle_id, rank ASC);
          CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
          CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
        `);
        await pool.query(`INSERT INTO schema_migrations (version) VALUES ('v5') ON CONFLICT DO NOTHING`);
        console.log("Scale Up schema migrations (v5) run successfully.");
      } catch (errV5) {
        console.error("Failed to run Scale Up migration v5:", errV5.message);
      }
    }

    // --- Branch-Based Access System v6 Migrations ---
    const migrationCheckV6 = await pool.query(`SELECT 1 FROM schema_migrations WHERE version = 'v6'`);
    if (migrationCheckV6.rows.length === 0) {
      console.log("Running Branch-Based Access System schema migrations (v6)...");
      try {
        await pool.query(`
          -- Branches table
          CREATE TABLE IF NOT EXISTS branches (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            code VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'ACTIVE',
            is_general BOOLEAN DEFAULT FALSE,
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Ensure only one general branch can be true
          CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_unique_general ON branches (is_general) WHERE (is_general = TRUE);

          -- Company branch mappings
          CREATE TABLE IF NOT EXISTS company_branch_mappings (
            id VARCHAR(255) PRIMARY KEY,
            company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
            branch_id VARCHAR(255) REFERENCES branches(id) ON DELETE CASCADE,
            assignment_scope VARCHAR(50) DEFAULT 'SPECIFIC',
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE UNIQUE INDEX IF NOT EXISTS idx_company_branch_all ON company_branch_mappings (company_id) WHERE (assignment_scope = 'ALL');
          CREATE UNIQUE INDEX IF NOT EXISTS idx_company_branch_specific ON company_branch_mappings (company_id, branch_id) WHERE (assignment_scope = 'SPECIFIC');

          -- Content branch mappings (independent modules/hierarchy nodes)
          CREATE TABLE IF NOT EXISTS content_branch_mappings (
            id VARCHAR(255) PRIMARY KEY,
            content_id VARCHAR(255) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            branch_id VARCHAR(255) REFERENCES branches(id) ON DELETE CASCADE,
            assignment_scope VARCHAR(50) DEFAULT 'SPECIFIC',
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE UNIQUE INDEX IF NOT EXISTS idx_content_branch_all ON content_branch_mappings (content_id, content_type) WHERE (assignment_scope = 'ALL');
          CREATE UNIQUE INDEX IF NOT EXISTS idx_content_branch_specific ON content_branch_mappings (content_id, content_type, branch_id) WHERE (assignment_scope = 'SPECIFIC');

          -- Add branch_id to users
          ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255) REFERENCES branches(id) ON DELETE SET NULL;

          -- Performance Indexes
          CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
          CREATE INDEX IF NOT EXISTS idx_cbm_company_id ON company_branch_mappings(company_id);
          CREATE INDEX IF NOT EXISTS idx_cbm_branch_id ON company_branch_mappings(branch_id);
          CREATE INDEX IF NOT EXISTS idx_cobm_content ON content_branch_mappings(content_id, content_type);
        `);

        // Seed default general branch
        const generalBranchCheck = await pool.query("SELECT id FROM branches WHERE is_general = TRUE LIMIT 1");
        let generalBranchId = "branch_general";
        if (generalBranchCheck.rows.length === 0) {
          await pool.query(`
            INSERT INTO branches (id, name, code, status, is_general, description, created_by)
            VALUES ($1, 'General', 'GENERAL', 'ACTIVE', TRUE, 'Default branch for general aptitude and safe system fallback.', 'system')
            ON CONFLICT DO NOTHING
          `, [generalBranchId]);
          console.log("Default General branch seeded successfully.");
        } else {
          generalBranchId = generalBranchCheck.rows[0].id;
        }

        // Seed ALL mappings for existing companies
        await pool.query(`
          INSERT INTO company_branch_mappings (id, company_id, branch_id, assignment_scope, created_by)
          SELECT 'cbm_all_' || id, id, NULL, 'ALL', 'system'
          FROM companies
          ON CONFLICT (company_id) WHERE (assignment_scope = 'ALL') DO NOTHING
        `);

        // Seed ALL mappings for existing modules
        await pool.query(`
          INSERT INTO content_branch_mappings (id, content_id, content_type, branch_id, assignment_scope, created_by)
          SELECT 'cobm_all_mod_' || id, id, 'module', NULL, 'ALL', 'system'
          FROM modules
          ON CONFLICT (content_id, content_type) WHERE (assignment_scope = 'ALL') DO NOTHING
        `);

        // Seed ALL mappings for existing hierarchy_nodes
        await pool.query(`
          INSERT INTO content_branch_mappings (id, content_id, content_type, branch_id, assignment_scope, created_by)
          SELECT 'cobm_all_hn_' || id, id, 'hierarchy_node', NULL, 'ALL', 'system'
          FROM hierarchy_nodes
          ON CONFLICT (content_id, content_type) WHERE (assignment_scope = 'ALL') DO NOTHING
        `);

        await pool.query(`INSERT INTO schema_migrations (version) VALUES ('v6') ON CONFLICT DO NOTHING`);
        console.log("Branch-Based Access System migrations (v6) run successfully.");
      } catch (errV6) {
        console.error("Failed to run Branch-Based Access System migration v6:", errV6.message);
      }
    }
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
}

module.exports = {
  pool,
  initDb,
};
