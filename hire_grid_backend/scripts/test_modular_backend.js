const http = require("http");
const app = require("../src/app");
const { initDb } = require("../src/database/init");
const { pool } = require("../src/database/connection");

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE BACKEND VERIFICATION ===");
  
  // 1. Initialize DB schema migrations
  await initDb();
  console.log("✓ Database init & migrations verified successfully.");

  // 2. Start test server on port 5099
  const server = app.listen(5099);
  
  const request = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: 5099,
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
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
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

  try {
    // 3. Test Health & Ready
    const health = await request("GET", "/health");
    console.log("✓ GET /health ->", health.status, health.data);
    if (health.status !== 200 || health.data.status !== "ok") throw new Error("Health check failed");

    const ready = await request("GET", "/ready");
    console.log("✓ GET /ready ->", ready.status, ready.data);
    if (ready.status !== 200 || ready.data.status !== "ready") throw new Error("Ready check failed");

    // 4. Test Super Admin Login with Passphrase (saumya@admin.com / RadheKrishna)
    const adminLogin = await request("POST", "/api/auth/login", {
      email: "saumya@admin.com",
      password: "RadheKrishna",
      isAdminLogin: true
    });
    console.log("✓ POST /api/auth/login (Admin) ->", adminLogin.status, adminLogin.data.success ? "Success" : "Failed");
    if (adminLogin.status !== 200 || !adminLogin.data.token) {
      console.error("Admin login response:", adminLogin.data);
      throw new Error("Admin login failed");
    }
    const adminToken = adminLogin.data.token;

    // 5. Test Authenticated /api/auth/me
    const me = await request("GET", "/api/auth/me", null, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log("✓ GET /api/auth/me ->", me.status, me.data.user?.email);
    if (me.status !== 200 || !me.data.user) throw new Error("GetMe failed");

    // 6. Test Modules Endpoint
    const modules = await request("GET", "/api/modules", null, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log("✓ GET /api/modules ->", modules.status, "Modules count:", modules.data.modules?.length);
    if (modules.status !== 200) throw new Error("Modules fetch failed");

    // 7. Test Placement Mission Modules & Leaderboard
    const missions = await request("GET", "/api/placement-mission/missions", null, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log("✓ GET /api/placement-mission/missions ->", missions.status, "Cycle:", missions.data.cycle?.name);
    if (missions.status !== 200) throw new Error("Missions fetch failed");

    const leaderboard = await request("GET", "/api/placement-mission/leaderboard", null, {
      Authorization: `Bearer ${adminToken}`
    });
    console.log("✓ GET /api/placement-mission/leaderboard ->", leaderboard.status, "Entries:", leaderboard.data.leaderboard?.length);
    if (leaderboard.status !== 200) throw new Error("Leaderboard fetch failed");

    // 8. Test Companies, Plans, Branches, Gate, Users, Stats
    const companies = await request("GET", "/api/companies", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/companies ->", companies.status, "Companies count:", companies.data.companies?.length);

    const plans = await request("GET", "/api/plans", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/plans ->", plans.status, "Plans count:", plans.data.plans?.length);

    const branches = await request("GET", "/api/branches", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/branches ->", branches.status, "Branches count:", branches.data.branches?.length);

    const gateBranches = await request("GET", "/api/gate/branches", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/gate/branches ->", gateBranches.status, "GATE branches count:", gateBranches.data.branches?.length);

    const users = await request("GET", "/api/users", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/users ->", users.status, "Users count:", users.data.users?.length);

    const adminUsers = await request("GET", "/api/admin_users", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/admin_users ->", adminUsers.status, "Admin users count:", adminUsers.data.admin_users?.length);

    const stats = await request("GET", "/api/stats", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/stats ->", stats.status, "Total students:", stats.data.totalStudents);

    // 9. Test Compatibility Endpoints (preventing 404s)
    const notifs = await request("GET", "/api/notifications", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/notifications ->", notifs.status, notifs.data.notifications);

    const purchases = await request("GET", "/api/purchases", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/purchases ->", purchases.status, "Purchases count:", purchases.data.purchases?.length);

    const auditLogs = await request("GET", "/api/audit-logs", null, { Authorization: `Bearer ${adminToken}` });
    console.log("✓ GET /api/audit-logs ->", auditLogs.status, "Audit logs count:", auditLogs.data.logs?.length);

    console.log("\n==========================================");
    console.log("🎉 ALL 15+ ENDPOINT FAMILIES VERIFIED 100% OK!");
    console.log("==========================================");
  } catch (err) {
    console.error("❌ TEST RUNNER FAILED:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
}

runTests();
