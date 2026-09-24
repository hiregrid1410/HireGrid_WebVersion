const http = require("http");
const app = require("../src/app");
const { initDb } = require("../src/database/init");
const { pool } = require("../src/database/connection");

async function runStudentTests() {
  console.log("=== TESTING STUDENT LOGIN & MODULES / COMPANIES ENDPOINTS ===");
  await initDb();
  const server = app.listen(5098);

  const request = (method, path, body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: 5098,
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
    // 1. Fetch any student from DB to test with real student credentials/token
    const studentRes = await pool.query("SELECT id, email, role FROM users WHERE role = 'student' LIMIT 1");
    if (studentRes.rows.length === 0) {
      console.log("No student found, creating dummy student");
    } else {
      const student = studentRes.rows[0];
      console.log("Testing with student:", student.email);

      // 2. Generate a token for this student
      const jwt = require("jsonwebtoken");
      const config = require("../src/config");
      const studentToken = jwt.sign({ id: student.id, email: student.email, role: "student" }, config.jwt.secret);

      // 3. Test /api/modules with student token
      const modulesRes = await request("GET", "/api/modules?orderBy=createdAt&orderDir=asc", null, {
        Authorization: `Bearer ${studentToken}`
      });
      console.log("✓ GET /api/modules (Student) ->", modulesRes.status, "Count:", modulesRes.data.modules?.length);
      if (modulesRes.status !== 200) {
        console.error("Modules error:", modulesRes.data);
      }

      // 4. Test /api/companies with student token
      const compRes = await request("GET", "/api/companies", null, {
        Authorization: `Bearer ${studentToken}`
      });
      console.log("✓ GET /api/companies (Student) ->", compRes.status, "Count:", compRes.data.companies?.length);
      if (compRes.status !== 200) {
        console.error("Companies error:", compRes.data);
      }
    }
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    server.close();
    await pool.end();
  }
}

runStudentTests();
