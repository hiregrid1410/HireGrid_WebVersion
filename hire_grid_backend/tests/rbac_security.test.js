const assert = require("node:assert");
const http = require("node:http");
const app = require("../src/app");
const authService = require("../src/modules/auth/auth.service");

async function runRbacSecurityTests() {
  console.log("==================================================");
  console.log(" STARTING RBAC & ENDPOINT SECURITY TEST SUITE");
  console.log("==================================================");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const adminToken = authService.generateToken({ id: "__sec_admin", email: "admin@test.com", role: "admin" });
  const cmToken = authService.generateToken({ id: "__sec_cm", email: "cm@test.com", role: "content_manager", allowed_platforms: "all" });
  const studentToken = authService.generateToken({ id: "__sec_student", email: "student@test.com", role: "student" });

  async function req(path, options = {}) {
    const headers = { ...options.headers };
    if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let data;
    try { data = await res.json(); } catch (_) { data = null; }
    return { status: res.status, data };
  }

  // Test 1: Student blocked from GET /api/admin_users (403)
  const t1 = await req("/api/admin_users", { token: studentToken });
  assert.strictEqual(t1.status, 403, "Student must be rejected with 403 from /api/admin_users");
  console.log("✓ Test 1 Passed: Student blocked from GET /api/admin_users (403)");

  // Test 2: Content Manager blocked from GET /api/admin_users (403)
  const t2 = await req("/api/admin_users", { token: cmToken });
  assert.strictEqual(t2.status, 403, "Content Manager must be rejected with 403 from /api/admin_users");
  console.log("✓ Test 2 Passed: Content Manager blocked from GET /api/admin_users (403)");

  // Test 3: Admin allowed on GET /api/admin_users (200)
  const t3 = await req("/api/admin_users", { token: adminToken });
  assert.strictEqual(t3.status, 200, "Admin must be allowed on /api/admin_users");
  console.log("✓ Test 3 Passed: Admin allowed on GET /api/admin_users (200)");

  // Test 4: Student blocked from DELETE /api/users/:id (403)
  const t4 = await req("/api/users/__test_dummy_user", { method: "DELETE", token: studentToken });
  assert.strictEqual(t4.status, 403, "Student must be rejected with 403 from DELETE /api/users/:id");
  console.log("✓ Test 4 Passed: Student blocked from DELETE /api/users/:id (403)");

  // Test 5: Student blocked from POST /api/settings/:id (403)
  const t5 = await req("/api/settings/payment", { method: "POST", token: studentToken, body: { upiId: "hacked@upi" } });
  assert.strictEqual(t5.status, 403, "Student must be rejected with 403 from POST /api/settings/:id");
  console.log("✓ Test 5 Passed: Student blocked from POST /api/settings/:id (403)");

  // Test 6: Student blocked from GET /api/security-logs (403)
  const t6 = await req("/api/security-logs", { token: studentToken });
  assert.strictEqual(t6.status, 403, "Student must be rejected with 403 from GET /api/security-logs");
  console.log("✓ Test 6 Passed: Student blocked from GET /api/security-logs (403)");

  // Test 7: Student blocked from GET /api/audit-logs (403)
  const t7 = await req("/api/audit-logs", { token: studentToken });
  assert.strictEqual(t7.status, 403, "Student must be rejected with 403 from GET /api/audit-logs");
  console.log("✓ Test 7 Passed: Student blocked from GET /api/audit-logs (403)");

  // Test 8: Unauthenticated access blocked (401)
  const t8 = await req("/api/modules");
  assert.strictEqual(t8.status, 401, "Unauthenticated request must be rejected with 401");
  console.log("✓ Test 8 Passed: Unauthenticated access rejected with 401");

  server.close();
  console.log("==================================================");
  console.log(" ALL RBAC & SECURITY TESTS PASSED 100% GREEN!");
  console.log("==================================================");
}

runRbacSecurityTests().catch((err) => {
  console.error("RBAC Security Test failed:", err);
  process.exit(1);
});
