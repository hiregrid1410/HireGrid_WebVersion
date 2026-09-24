const http = require("http");
const app = require("../src/app");
const { initDb } = require("../src/database/init");
const { pool } = require("../src/database/connection");
const bcrypt = require("bcrypt");

async function runDeepVerificationAudit() {
  console.log("==================================================");
  console.log("🚀 STARTING DEEP PERFORMANCE & REGRESSION AUDIT 🚀");
  console.log("==================================================");

  await initDb();
  const PORT = 5098;
  const server = app.listen(PORT);

  const request = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const start = process.hrtime();
      const options = {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const diff = process.hrtime(start);
          const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), durationMs });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data, durationMs });
          }
        });
      });

      req.on("error", reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    benchmarks: {}
  };

  const assert = (name, condition, details = "") => {
    results.total++;
    if (condition) {
      results.passed++;
      console.log(`  ✓ [PASS] ${name} ${details ? `(${details})` : ""}`);
    } else {
      results.failed++;
      console.error(`  ✗ [FAIL] ${name} ${details ? `(${details})` : ""}`);
    }
  };

  try {
    // ----------------------------------------------------
    // TEST SECTION 1: Health & Public Readiness
    // ----------------------------------------------------
    console.log("\n--- 1. Health & Server Readiness ---");
    const healthRes = await request("GET", "/health");
    assert("Health Endpoint Status", healthRes.status === 200 && healthRes.data.status === "ok");
    assert("Health does not leak secrets", !healthRes.data.database && !healthRes.data.jwtSecret);

    const readyRes = await request("GET", "/ready");
    assert("Database Readiness Endpoint", readyRes.status === 200 && readyRes.data.status === "ready");

    // ----------------------------------------------------
    // TEST SECTION 2: Authentication & Token Issuance
    // ----------------------------------------------------
    console.log("\n--- 2. Auth Flow (Student, Admin, Content Manager) ---");
    // Seed/verify student with valid active branch
    const studentEmail = "verify_student@hiregrid.com";
    const studentPass = "VerifyPass123!";
    const hashedStd = await bcrypt.hash(studentPass, 10);
    const branchRes = await pool.query("SELECT id FROM branches WHERE is_general = TRUE LIMIT 1");
    const generalBranchId = branchRes.rows[0]?.id || "branch_general";

    await pool.query(
      `INSERT INTO users (id, email, password, name, role, branch_id, has_full_premium, email_verified)
       VALUES ('audit_student_1', $1, $2, 'Audit Student', 'student', $3, TRUE, TRUE)
       ON CONFLICT (id) DO UPDATE SET password = $2, email = $1, branch_id = $3, has_full_premium = TRUE`,
      [studentEmail, hashedStd, generalBranchId]
    );

    const studentLogin = await request("POST", "/api/auth/login", {
      email: studentEmail,
      password: studentPass
    });
    assert("Student Login (200 + Token)", studentLogin.status === 200 && !!studentLogin.data.token, `${studentLogin.durationMs.toFixed(1)}ms`);
    const studentToken = studentLogin.data.token;

    // Seed/verify content manager
    const cmEmail = "verify_cm@hiregrid.com";
    const cmPass = "VerifyCmPass123!";
    const hashedCm = await bcrypt.hash(cmPass, 10);
    await pool.query(
      `INSERT INTO admin_users (id, email, password, name, role)
       VALUES ('audit_cm_1', $1, $2, 'Audit CM', 'content_manager')
       ON CONFLICT (id) DO UPDATE SET password = $2, email = $1`,
      [cmEmail, hashedCm]
    );

    const cmLogin = await request("POST", "/api/auth/login", {
      email: cmEmail,
      password: cmPass
    });
    assert("Content Manager Login (200 + Token)", cmLogin.status === 200 && !!cmLogin.data.token, `${cmLogin.durationMs.toFixed(1)}ms`);
    const cmToken = cmLogin.data.token;

    // Admin login with Super Admin credentials
    const adminLogin = await request("POST", "/api/auth/login", {
      email: "saumya@admin.com",
      password: "RadheKrishna"
    });
    assert("Super Admin Login (200 + Token)", adminLogin.status === 200 && !!adminLogin.data.token, `${adminLogin.durationMs.toFixed(1)}ms`);
    const adminToken = adminLogin.data.token;

    // ----------------------------------------------------
    // TEST SECTION 3: Authorization Isolation
    // ----------------------------------------------------
    console.log("\n--- 3. Authorization & RBAC Boundaries ---");
    const unauthorizedQuestions = await request("GET", "/api/admin/questions", null, {
      Authorization: `Bearer ${studentToken}`
    });
    assert("Student Forbidden on Admin Questions (403)", unauthorizedQuestions.status === 403);

    const cmQuestions = await request("GET", "/api/admin/questions?limit=5", null, {
      Authorization: `Bearer ${cmToken}`
    });
    assert("Content Manager Allowed on Questions", cmQuestions.status === 200 && Array.isArray(cmQuestions.data.questions));

    // ----------------------------------------------------
    // TEST SECTION 4: Real Server-Side Pagination
    // ----------------------------------------------------
    console.log("\n--- 4. Database-Level Server-Side Pagination ---");
    const usersP1 = await request("GET", "/api/users?limit=5&page=1", null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert("Users Pagination Page 1 Limit 5", usersP1.status === 200 && usersP1.data.users.length === 5);

    const usersP2 = await request("GET", "/api/users?limit=5&page=2", null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert("Users Pagination Page 2 Limit 5", usersP2.status === 200 && usersP2.data.users.length === 5);
    const p1FirstId = usersP1.data.users[0]?.id;
    const p2FirstId = usersP2.data.users[0]?.id;
    assert("Page 1 and Page 2 contain distinct records", p1FirstId !== p2FirstId);

    const auditLogsPaginated = await request("GET", "/api/audit-logs?limit=10&page=1", null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert("Audit Logs Server-Side Limit (10)", auditLogsPaginated.status === 200 && auditLogsPaginated.data.logs.length <= 10);

    const cmAttemptsPaginated = await request("GET", "/api/placement-mission/content-manager/attempts?limit=5&page=1", null, {
      Authorization: `Bearer ${cmToken}`
    });
    assert("Placement Mission Attempts Paginated", cmAttemptsPaginated.status === 200 && cmAttemptsPaginated.data.pagination?.totalPages >= 0);

    // ----------------------------------------------------
    // TEST SECTION 5: Cache Invalidation on Mutations
    // ----------------------------------------------------
    console.log("\n--- 5. Cache Invalidation and Freshness ---");
    // Initial fetch to populate cache
    const initialPlans = await request("GET", "/api/plans", null, {
      Authorization: `Bearer ${studentToken}`
    });
    const initialPlanCount = initialPlans.data.plans?.length || 0;

    // Mutate plans via Admin
    const testPlanId = "audit_test_plan_" + Date.now();
    await request("POST", "/api/plans", {
      id: testPlanId,
      name: "Audit Dynamic Plan",
      price: 99,
      duration: "1_month",
      isActive: true
    }, {
      Authorization: `Bearer ${adminToken}`
    });

    // Immediate student read - cache MUST be invalidated and return new plan
    const updatedPlans = await request("GET", "/api/plans", null, {
      Authorization: `Bearer ${studentToken}`
    });
    const containsNewPlan = updatedPlans.data.plans?.some(p => p.id === testPlanId);
    assert("Plan Cache Invalidated Immediately on Admin Mutation", containsNewPlan);

    // Cleanup test plan
    await request("DELETE", `/api/plans/${testPlanId}`, null, {
      Authorization: `Bearer ${adminToken}`
    });

    // ----------------------------------------------------
    // TEST SECTION 6: Exam Security & Data Masking
    // ----------------------------------------------------
    console.log("\n--- 6. Exam Security & Answers Masking ---");
    // Find a module that has questions and set student branch to match
    const modMappingRes = await pool.query(
      `SELECT m.id as module_id, cbm.branch_id 
       FROM modules m
       JOIN questions q ON q.module_id = m.id
       LEFT JOIN content_branch_mappings cbm ON cbm.content_id = m.id AND cbm.content_type = 'module'
       WHERE m.is_active = TRUE
       LIMIT 1`
    );
    const targetModuleId = modMappingRes.rows[0]?.module_id;
    const targetBranchId = modMappingRes.rows[0]?.branch_id || generalBranchId;

    if (targetModuleId) {
      // Ensure student has access to this branch
      await pool.query("UPDATE users SET branch_id = $1 WHERE id = 'audit_student_1'", [targetBranchId]);

      const examStart = await request("POST", "/api/attempts/start", { moduleId: targetModuleId }, {
        Authorization: `Bearer ${studentToken}`
      });
      assert("Student Exam Attempt Initialized", examStart.status === 200 && !!examStart.data.attemptId);
      
      const unmaskedAnswers = examStart.data.questions?.some(q => q.correctAnswerIndex !== null && q.correctAnswerIndex !== undefined);
      assert("Correct Answers Masked (Hidden from student network payload)", !unmaskedAnswers);
    }

    // ----------------------------------------------------
    // TEST SECTION 7: Multi-Request Performance Benchmarks
    // ----------------------------------------------------
    console.log("\n--- 7. Measured Performance Latency (10 Repeated Samples) ---");
    const endpointsToBenchmark = [
      { name: "GET /api/modules", path: "/api/modules", token: studentToken },
      { name: "GET /api/companies", path: "/api/companies", token: studentToken },
      { name: "GET /api/plans", path: "/api/plans", token: studentToken },
      { name: "GET /api/branches", path: "/api/branches", token: studentToken },
      { name: "GET /api/placement-mission/leaderboard", path: "/api/placement-mission/leaderboard", token: studentToken },
      { name: "GET /api/users (limit 20)", path: "/api/users?limit=20", token: adminToken }
    ];

    for (const ep of endpointsToBenchmark) {
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const res = await request("GET", ep.path, null, { Authorization: `Bearer ${ep.token}` });
        if (res.status === 200) {
          samples.push(res.durationMs);
        }
      }
      samples.sort((a, b) => a - b);
      const min = samples[0];
      const max = samples[samples.length - 1];
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      const median = samples[Math.floor(samples.length / 2)];
      const p95 = samples[Math.floor(samples.length * 0.95)];

      results.benchmarks[ep.name] = { min, max, avg, median, p95, samples: samples.length };
      console.log(`  📊 ${ep.name.padEnd(35)} | Avg: ${avg.toFixed(1).padStart(5)}ms | P50: ${median.toFixed(1).padStart(5)}ms | Min: ${min.toFixed(1).padStart(5)}ms | Max: ${max.toFixed(1).padStart(5)}ms`);
    }

    // ----------------------------------------------------
    // TEST SECTION 8: Clean Database Connection Pool Safety
    // ----------------------------------------------------
    console.log("\n--- 8. Database Connection Pool Safety ---");
    assert("Connection Pool Healthy (idle/active balances)", pool.totalCount > 0 && pool.waitingCount === 0);

  } catch (err) {
    console.error("FATAL ERROR during verification:", err);
  } finally {
    server.close();
    await pool.end();
  }

  console.log("\n==================================================");
  console.log(`SUMMARY: ${results.passed} PASSED | ${results.failed} FAILED | TOTAL: ${results.total}`);
  console.log("==================================================");
}

runDeepVerificationAudit();
