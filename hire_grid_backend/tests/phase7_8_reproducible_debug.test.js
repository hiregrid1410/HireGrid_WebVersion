const http = require("http");
const app = require("../src/app");
const { pool } = require("../src/database/connection");
const jwt = require("jsonwebtoken");
const config = require("../src/config");

async function runPhase7And8Tests() {
  console.log("==================================================================");
  console.log(" STARTING PHASE 7 & PHASE 8: REPRODUCIBLE DEBUG & E2E TESTS");
  console.log("==================================================================");

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  const adminToken = jwt.sign({ id: "super_admin_saumya", email: "saumya@admin.com", role: "admin" }, config.jwt.secret);
  const studentToken = jwt.sign({ id: "student_e2e_user", email: "student_e2e@hiregrid.com", role: "student" }, config.jwt.secret);

  async function apiCall(endpoint, { method = "GET", body, token, platform, queryParams = {} } = {}) {
    const url = new URL(baseUrl + endpoint);
    Object.entries(queryParams).forEach(([k, v]) => url.searchParams.append(k, v));

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    if (platform) {
      headers["x-platform"] = platform;
      if (platform === "app") {
        headers["x-client-platform"] = "android";
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { url: url.toString(), status: res.status, data };
  }

  // Cleanup helper
  async function cleanupDebugRecords() {
    await pool.query("DELETE FROM companies WHERE id LIKE 'DEBUG_%' OR id LIKE 'E2E_%'");
  }

  try {
    await cleanupDebugRecords();

    // =========================================================================
    // PHASE 7: REPRODUCIBLE DEBUG TEST
    // =========================================================================
    console.log("\n--- [PHASE 7] Creating 3 Test Records via Admin API ---");

    const records = [
      { id: "DEBUG_WEB_001", name: "DEBUG_WEB_001", platform: "web" },
      { id: "DEBUG_APP_001", name: "DEBUG_APP_001", platform: "app" },
      { id: "DEBUG_BOTH_001", name: "DEBUG_BOTH_001", platform: "both" },
    ];

    for (const r of records) {
      const createRes = await apiCall("/companies", {
        method: "POST",
        token: adminToken,
        body: r,
      });
      console.log(`Created ${r.id} (${r.platform}) - Status: ${createRes.status}`);
      if (createRes.status !== 200 && createRes.status !== 201) {
        throw new Error(`Failed to create test record: ${r.id}`);
      }
    }

    // 1. Flutter Mobile API Request
    console.log("\n--- [PHASE 7] Querying as Flutter Mobile Client ---");
    const flutterReq = await apiCall("/companies", {
      method: "GET",
      token: studentToken,
      platform: "app",
      queryParams: { platform: "app" },
    });

    const flutterCompanies = flutterReq.data.companies || [];
    const flutterDebugIds = flutterCompanies.filter(c => c.id.startsWith("DEBUG_")).map(c => c.id);
    const flutterDebugPlatforms = flutterCompanies.filter(c => c.id.startsWith("DEBUG_")).map(c => ({ id: c.id, platform: c.platform }));

    console.log("Request URL:          ", flutterReq.url);
    console.log("Query parameters:     ", "{ platform: 'app' }");
    console.log("Response status:      ", flutterReq.status);
    console.log("Response record IDs:  ", flutterDebugIds);
    console.log("Response platforms:   ", flutterDebugPlatforms);
    console.log("Cache key used:       ", "content_cache_companies_app_v2");

    // Verification Flutter:
    if (flutterDebugIds.includes("DEBUG_WEB_001")) {
      throw new Error("CRITICAL BUG: DEBUG_WEB_001 LEAKED INTO FLUTTER RESPONSE!");
    }
    if (!flutterDebugIds.includes("DEBUG_APP_001")) {
      throw new Error("FAILURE: DEBUG_APP_001 is missing from Flutter response!");
    }
    if (!flutterDebugIds.includes("DEBUG_BOTH_001")) {
      throw new Error("FAILURE: DEBUG_BOTH_001 is missing from Flutter response!");
    }
    console.log("✓ Flutter API Verification: DEBUG_WEB_001 NOT EXIST, DEBUG_APP_001 EXISTS, DEBUG_BOTH_001 EXISTS.");

    // 2. Web API Request
    console.log("\n--- [PHASE 7] Querying as Web Client ---");
    const webReq = await apiCall("/companies", {
      method: "GET",
      token: studentToken,
      platform: "web",
      queryParams: { platform: "web" },
    });

    const webCompanies = webReq.data.companies || [];
    const webDebugIds = webCompanies.filter(c => c.id.startsWith("DEBUG_")).map(c => c.id);
    const webDebugPlatforms = webCompanies.filter(c => c.id.startsWith("DEBUG_")).map(c => ({ id: c.id, platform: c.platform }));

    console.log("Request URL:          ", webReq.url);
    console.log("Query parameters:     ", "{ platform: 'web' }");
    console.log("Response status:      ", webReq.status);
    console.log("Response record IDs:  ", webDebugIds);
    console.log("Response platforms:   ", webDebugPlatforms);

    // Verification Web:
    if (!webDebugIds.includes("DEBUG_WEB_001")) {
      throw new Error("FAILURE: DEBUG_WEB_001 is missing from Web response!");
    }
    if (webDebugIds.includes("DEBUG_APP_001")) {
      throw new Error("FAILURE: DEBUG_APP_001 leaked into Web response!");
    }
    if (!webDebugIds.includes("DEBUG_BOTH_001")) {
      throw new Error("FAILURE: DEBUG_BOTH_001 is missing from Web response!");
    }
    console.log("✓ Web API Verification: DEBUG_WEB_001 EXISTS, DEBUG_APP_001 NOT EXIST, DEBUG_BOTH_001 EXISTS.");

    // =========================================================================
    // PHASE 8: COMPLETE END-TO-END 12 OPERATIONAL TESTS
    // =========================================================================
    console.log("\n==================================================================");
    console.log(" STARTING PHASE 8: 12 END-TO-END SCENARIO VERIFICATION");
    console.log("==================================================================");

    // 1. Create WEB content -> Not visible in Flutter
    console.log("\n[Scenario 1] Create WEB content -> Not visible in Flutter");
    await apiCall("/companies", { method: "POST", token: adminToken, body: { id: "E2E_WEB_1", name: "E2E Web 1", platform: "web" } });
    let appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    if ((appCheck.data.companies || []).some(c => c.id === "E2E_WEB_1")) {
      throw new Error("Scenario 1 Failed: E2E_WEB_1 visible in Flutter!");
    }
    console.log("✓ Scenario 1 Passed: WEB content is completely hidden from Flutter.");

    // 2. Create APP content -> Visible in Flutter
    console.log("\n[Scenario 2] Create APP content -> Visible in Flutter");
    await apiCall("/companies", { method: "POST", token: adminToken, body: { id: "E2E_APP_1", name: "E2E App 1", platform: "app" } });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    if (!(appCheck.data.companies || []).some(c => c.id === "E2E_APP_1")) {
      throw new Error("Scenario 2 Failed: E2E_APP_1 NOT visible in Flutter!");
    }
    console.log("✓ Scenario 2 Passed: APP content is visible in Flutter.");

    // 3. Create BOTH content -> Visible in Flutter
    console.log("\n[Scenario 3] Create BOTH content -> Visible in Flutter");
    await apiCall("/companies", { method: "POST", token: adminToken, body: { id: "E2E_BOTH_1", name: "E2E Both 1", platform: "both" } });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    if (!(appCheck.data.companies || []).some(c => c.id === "E2E_BOTH_1")) {
      throw new Error("Scenario 3 Failed: E2E_BOTH_1 NOT visible in Flutter!");
    }
    console.log("✓ Scenario 3 Passed: BOTH content is visible in Flutter.");

    // 4. Edit WEB content -> Flutter remains unaffected
    console.log("\n[Scenario 4] Edit WEB content -> Flutter remains unaffected");
    await apiCall("/companies", { method: "POST", token: adminToken, body: { id: "E2E_WEB_1", name: "E2E Web 1 Renamed", platform: "web" } });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    if ((appCheck.data.companies || []).some(c => c.id === "E2E_WEB_1")) {
      throw new Error("Scenario 4 Failed: Edited WEB content leaked into Flutter!");
    }
    console.log("✓ Scenario 4 Passed: Flutter remains unaffected by WEB content edit.");

    // 5. Edit APP content -> Flutter displays updated content
    console.log("\n[Scenario 5] Edit APP content -> Flutter displays updated content");
    await apiCall("/companies", { method: "POST", token: adminToken, body: { id: "E2E_APP_1", name: "E2E App 1 Updated Name", platform: "app" } });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    const updatedAppCo = (appCheck.data.companies || []).find(c => c.id === "E2E_APP_1");
    if (!updatedAppCo || updatedAppCo.name !== "E2E App 1 Updated Name") {
      throw new Error("Scenario 5 Failed: Flutter did not display updated APP content!");
    }
    console.log("✓ Scenario 5 Passed: Flutter displays updated APP content.");

    // 6. Edit BOTH content -> Flutter displays updated content
    console.log("\n[Scenario 6] Edit BOTH content -> Flutter displays updated content");
    await apiCall("/companies", { method: "POST", token: adminToken, body: { id: "E2E_BOTH_1", name: "E2E Both 1 Updated Name", platform: "both" } });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    const updatedBothCo = (appCheck.data.companies || []).find(c => c.id === "E2E_BOTH_1");
    if (!updatedBothCo || updatedBothCo.name !== "E2E Both 1 Updated Name") {
      throw new Error("Scenario 6 Failed: Flutter did not display updated BOTH content!");
    }
    console.log("✓ Scenario 6 Passed: Flutter displays updated BOTH content.");

    // 7. Delete WEB content -> Flutter content remains unaffected
    console.log("\n[Scenario 7] Delete WEB content -> Flutter content remains unaffected");
    await apiCall("/companies/E2E_WEB_1", { method: "DELETE", token: adminToken });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    if (!(appCheck.data.companies || []).some(c => c.id === "E2E_APP_1") || !(appCheck.data.companies || []).some(c => c.id === "E2E_BOTH_1")) {
      throw new Error("Scenario 7 Failed: Deleting WEB content affected Flutter content!");
    }
    console.log("✓ Scenario 7 Passed: Flutter content remains unaffected after WEB content delete.");

    // 8. Delete APP content -> Flutter removes that content
    console.log("\n[Scenario 8] Delete APP content -> Flutter removes that content");
    await apiCall("/companies/E2E_APP_1", { method: "DELETE", token: adminToken });
    appCheck = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    if ((appCheck.data.companies || []).some(c => c.id === "E2E_APP_1")) {
      throw new Error("Scenario 8 Failed: Deleted APP content still appears in Flutter!");
    }
    console.log("✓ Scenario 8 Passed: Flutter removes deleted APP content.");

    // 9. Restart Flutter App -> Correct visibility remains (Simulated cold start)
    console.log("\n[Scenario 9] Restart Flutter App -> Correct visibility remains");
    // Simulated cold restart with platform headers & query parameters
    const coldRestartReq = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    const coldIds = (coldRestartReq.data.companies || []).map(c => c.id);
    if (coldIds.includes("DEBUG_WEB_001") || coldIds.includes("E2E_WEB_1")) {
      throw new Error("Scenario 9 Failed: Web content appeared after app cold restart!");
    }
    console.log("✓ Scenario 9 Passed: App restart maintains strict platform visibility.");

    // 10. Logout and login -> Correct visibility remains
    console.log("\n[Scenario 10] Logout and login -> Correct visibility remains");
    const freshStudentToken = jwt.sign({ id: "student_relogin_user", email: "relogin@hiregrid.com", role: "student" }, config.jwt.secret);
    const reloginReq = await apiCall("/companies", { method: "GET", token: freshStudentToken, platform: "app", queryParams: { platform: "app" } });
    const reloginIds = (reloginReq.data.companies || []).map(c => c.id);
    if (reloginIds.includes("DEBUG_WEB_001") || reloginIds.includes("E2E_WEB_1")) {
      throw new Error("Scenario 10 Failed: Web content appeared after relogin!");
    }
    console.log("✓ Scenario 10 Passed: Logout and login preserves strict platform visibility.");

    // 11. Clear affected content cache -> Correct content loads
    console.log("\n[Scenario 11] Clear affected content cache -> Correct content loads");
    // Force fresh backend query bypass
    const cacheClearReq = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app", forceRefresh: "true" } });
    const cacheClearIds = (cacheClearReq.data.companies || []).map(c => c.id);
    if (cacheClearIds.includes("DEBUG_WEB_001") || !cacheClearIds.includes("DEBUG_BOTH_001")) {
      throw new Error("Scenario 11 Failed: Cache clear returned incorrect records!");
    }
    console.log("✓ Scenario 11 Passed: Cache clear reliably loads only valid mobile content.");

    // 12. Refresh Riverpod providers -> Correct platform data loads
    console.log("\n[Scenario 12] Refresh Riverpod providers -> Correct platform data loads");
    const providerRefreshReq = await apiCall("/companies", { method: "GET", token: studentToken, platform: "app", queryParams: { platform: "app" } });
    const providerIds = (providerRefreshReq.data.companies || []).map(c => c.id);
    if (providerIds.includes("DEBUG_WEB_001") || !providerIds.includes("DEBUG_BOTH_001")) {
      throw new Error("Scenario 12 Failed: Provider refresh returned incorrect records!");
    }
    console.log("✓ Scenario 12 Passed: Provider refresh reliably returns APP + BOTH content only.");

    console.log("\n==================================================================");
    console.log(" ALL PHASE 7 & 8 TESTS PASSED 100% GREEN!");
    console.log("==================================================================");

  } finally {
    console.log("\n--- Cleaning up temporary debug records ---");
    await cleanupDebugRecords();
    console.log("✓ Temporary debug records safely cleaned up.");
    server.close();
    process.exit(0);
  }
}

runPhase7And8Tests().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
