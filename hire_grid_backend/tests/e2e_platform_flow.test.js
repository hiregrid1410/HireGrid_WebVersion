
const http = require("http");
const app = require("../src/app");
const { pool } = require("../src/database/connection");
const jwt = require("jsonwebtoken");
const config = require("../src/config");

async function runE2E() {
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  console.log("=== RUNNING COMPLETE END-TO-END VERIFICATION ON PORT " + port + " ===");

  const adminToken = jwt.sign({ id: "super_admin_saumya", email: "saumya@admin.com", role: "admin" }, config.jwt.secret);
  const cmWebToken = jwt.sign({ id: "cm_web_1", email: "cm_web@hiregrid.com", role: "content_manager", allowed_platforms: "web" }, config.jwt.secret);
  const cmAppToken = jwt.sign({ id: "cm_app_1", email: "cm_app@hiregrid.com", role: "content_manager", allowed_platforms: "app" }, config.jwt.secret);
  const studentToken = jwt.sign({ id: "student_verify_1", email: "student_v@hiregrid.com", role: "student" }, config.jwt.secret);

  async function apiCall(endpoint, { method = "GET", body, token, platform } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    if (platform) headers["x-platform"] = platform;
    const res = await fetch(baseUrl + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. CM Web tries to create App company -> should fail with 403
  const failAppRes = await apiCall("/companies", {
    method: "POST",
    token: cmWebToken,
    body: { id: "e2e_co_fail_app", name: "E2E App Co", platform: "app" }
  });
  if (failAppRes.status !== 403) throw new Error("Expected 403 for CM Web creating App company");

  // 2. CM Web creates Web company -> should succeed 200
  const passWebRes = await apiCall("/companies", {
    method: "POST",
    token: cmWebToken,
    body: { id: "e2e_co_web_ok", name: "E2E Web Co", platform: "web" }
  });
  if (passWebRes.status !== 200) throw new Error("Expected 200 for CM Web creating Web company");

  // 3. CM App tries to create Web company -> should fail with 403
  const failWebRes = await apiCall("/companies", {
    method: "POST",
    token: cmAppToken,
    body: { id: "e2e_co_fail_web", name: "E2E Web Co 2", platform: "web" }
  });
  if (failWebRes.status !== 403) throw new Error("Expected 403 for CM App creating Web company");

  // 4. CM App creates App company -> should succeed 200
  const passAppRes = await apiCall("/companies", {
    method: "POST",
    token: cmAppToken,
    body: { id: "e2e_co_app_ok", name: "E2E App Co", platform: "app" }
  });
  if (passAppRes.status !== 200) throw new Error("Expected 200 for CM App creating App company");

  // 5. Admin creates Both company -> should succeed 200
  const passBothRes = await apiCall("/companies", {
    method: "POST",
    token: adminToken,
    body: { id: "e2e_co_both_ok", name: "E2E Both Co", platform: "both" }
  });
  if (passBothRes.status !== 200) throw new Error("Expected 200 for Admin creating Both company");

  // 6. Student on Web queries companies -> must see Web and Both, NOT App!
  const webListRes = await apiCall("/companies", { token: studentToken, platform: "web" });
  const webIds = (webListRes.data.companies || []).map(c => c.id);
  const webHasWeb = webIds.includes("e2e_co_web_ok");
  const webHasBoth = webIds.includes("e2e_co_both_ok");
  const webHasApp = webIds.includes("e2e_co_app_ok");
  if (!webHasWeb || !webHasBoth || webHasApp) {
    throw new Error(`Web student visibility check failed! hasWeb=${webHasWeb}, hasBoth=${webHasBoth}, hasApp=${webHasApp}`);
  }

  // 7. Student on App queries companies -> must see App and Both, NOT Web!
  const appListRes = await apiCall("/companies", { token: studentToken, platform: "app" });
  const appIds = (appListRes.data.companies || []).map(c => c.id);
  const appHasWeb = appIds.includes("e2e_co_web_ok");
  const appHasBoth = appIds.includes("e2e_co_both_ok");
  const appHasApp = appIds.includes("e2e_co_app_ok");
  if (appHasWeb || !appHasBoth || !appHasApp) {
    throw new Error(`App student visibility check failed! hasWeb=${appHasWeb}, hasBoth=${appHasBoth}, hasApp=${appHasApp}`);
  }

  // 8. CM Web tries to delete App company -> should fail with 403
  const delAppFail = await apiCall("/companies/e2e_co_app_ok", { method: "DELETE", token: cmWebToken });
  if (delAppFail.status !== 403) throw new Error("Expected 403 for CM Web deleting App company");

  // 9. CM App tries to delete Web company -> should fail with 403
  const delWebFail = await apiCall("/companies/e2e_co_web_ok", { method: "DELETE", token: cmAppToken });
  if (delWebFail.status !== 403) throw new Error("Expected 403 for CM App deleting Web company");

  // 10. Admin deletes test companies
  await apiCall("/companies/e2e_co_web_ok", { method: "DELETE", token: adminToken });
  await apiCall("/companies/e2e_co_app_ok", { method: "DELETE", token: adminToken });
  await apiCall("/companies/e2e_co_both_ok", { method: "DELETE", token: adminToken });

  console.log("=== ALL 10 END-TO-END VERIFICATION CHECKS PASSED 100%! ===");
  server.close();
  pool.end();
}

runE2E().catch(err => {
  console.error("E2E Test Failed:", err);
  process.exit(1);
});
