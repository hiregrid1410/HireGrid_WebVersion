const http = require("http");
const app = require("../src/app");
const { initDb } = require("../src/database/init");
const { pool } = require("../src/database/connection");
const bcrypt = require("bcrypt");

async function runDirectLoginTest() {
  console.log("=== TESTING DIRECT STUDENT LOGIN VIA HTTP ===");
  await initDb();
  const server = app.listen(5097);

  const request = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: 5097,
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
    // 1. Create a test student with a known password if not exists
    const testEmail = "teststudent@example.com";
    const testPassword = "Password123!";
    const hashed = await bcrypt.hash(testPassword, 10);
    
    await pool.query(
      `INSERT INTO users (id, email, password, name, role, email_verified)
       VALUES ('test-student-id', $1, $2, 'Test Student', 'student', TRUE)
       ON CONFLICT (id) DO UPDATE SET password = $2, email = $1`,
      [testEmail, hashed]
    );

    // 2. Perform HTTP login
    const loginRes = await request("POST", "/api/auth/login", {
      email: testEmail,
      password: testPassword,
      deviceId: "test-device-1",
      deviceName: "Chrome Desktop"
    });

    console.log("Student login result:", loginRes.status, loginRes.data);
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error("Student login failed");
    }

    const token = loginRes.data.token;

    // 3. Test /api/modules
    const modulesRes = await request("GET", "/api/modules?orderBy=createdAt&orderDir=asc", null, {
      Authorization: `Bearer ${token}`
    });
    console.log("Student modules fetch:", modulesRes.status, "Count:", modulesRes.data.modules?.length);

    // 4. Test /api/companies
    const compRes = await request("GET", "/api/companies", null, {
      Authorization: `Bearer ${token}`
    });
    console.log("Student companies fetch:", compRes.status, "Count:", compRes.data.companies?.length);

  } catch (err) {
    console.error("Direct login test failed:", err);
  } finally {
    server.close();
    await pool.end();
  }
}

runDirectLoginTest();
