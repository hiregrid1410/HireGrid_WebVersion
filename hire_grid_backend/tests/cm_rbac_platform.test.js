
const { validateContentManagerPlatformAccess } = require("../src/utils/platformHelper");
const assert = require("assert");

console.log("=== RUNNING CM RBAC PLATFORM RESTRICTION TESTS ===");

// 1. Admin test
const adminUser = { id: "admin_1", role: "admin" };
assert.strictEqual(validateContentManagerPlatformAccess(adminUser, "web"), true);
assert.strictEqual(validateContentManagerPlatformAccess(adminUser, "app"), true);
assert.strictEqual(validateContentManagerPlatformAccess(adminUser, "both"), true);
assert.strictEqual(validateContentManagerPlatformAccess(adminUser, null, "web"), true);
console.log("✓ Test 1 Passed: Admin has full access to all platforms (web, app, both).");

// 2. CM with allowed_platforms = "all"
const cmAll = { id: "cm_all", role: "content_manager", allowed_platforms: "all" };
assert.strictEqual(validateContentManagerPlatformAccess(cmAll, "web"), true);
assert.strictEqual(validateContentManagerPlatformAccess(cmAll, "app"), true);
assert.strictEqual(validateContentManagerPlatformAccess(cmAll, "both"), true);
console.log("✓ Test 2 Passed: Content Manager with all-platform permission can manage all platforms.");

// 3. CM with allowed_platforms = "web"
const cmWeb = { id: "cm_web", role: "content_manager", allowed_platforms: "web" };
assert.strictEqual(validateContentManagerPlatformAccess(cmWeb, "web"), true);

// Creating app or both content should throw 403
assert.throws(() => validateContentManagerPlatformAccess(cmWeb, "app"), (err) => err.statusCode === 403);
assert.throws(() => validateContentManagerPlatformAccess(cmWeb, "both"), (err) => err.statusCode === 403);

// Deleting / editing an app item should throw 403
assert.throws(() => validateContentManagerPlatformAccess(cmWeb, null, "app"), (err) => err.statusCode === 403);
assert.throws(() => validateContentManagerPlatformAccess(cmWeb, null, "both"), (err) => err.statusCode === 403);

// Editing a web item is allowed
assert.strictEqual(validateContentManagerPlatformAccess(cmWeb, "web", "web"), true);
console.log("✓ Test 3 Passed: Content Manager with web-only permission CANNOT create or manage app/both content.");

// 4. CM with allowed_platforms = "app"
const cmApp = { id: "cm_app", role: "content_manager", allowed_platforms: "app" };
assert.strictEqual(validateContentManagerPlatformAccess(cmApp, "app"), true);

// Creating web or both content should throw 403
assert.throws(() => validateContentManagerPlatformAccess(cmApp, "web"), (err) => err.statusCode === 403);
assert.throws(() => validateContentManagerPlatformAccess(cmApp, "both"), (err) => err.statusCode === 403);

// Deleting / editing a web item should throw 403
assert.throws(() => validateContentManagerPlatformAccess(cmApp, null, "web"), (err) => err.statusCode === 403);
assert.throws(() => validateContentManagerPlatformAccess(cmApp, null, "both"), (err) => err.statusCode === 403);

// Editing an app item is allowed
assert.strictEqual(validateContentManagerPlatformAccess(cmApp, "app", "app"), true);
console.log("✓ Test 4 Passed: Content Manager with app-only permission CANNOT create or manage web/both content.");

// 5. Non-privileged student trying to manage content throws 403
const student = { id: "std_1", role: "student" };
assert.throws(() => validateContentManagerPlatformAccess(student, "web"), (err) => err.statusCode === 403);
console.log("✓ Test 5 Passed: Student role is strictly forbidden from content operations.");

console.log("=== ALL CM RBAC PLATFORM TESTS PASSED 100%! ===");
