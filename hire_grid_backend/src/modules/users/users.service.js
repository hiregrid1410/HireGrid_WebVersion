const crypto = require("crypto");
const { pool } = require("../../database/connection");
const usersRepo = require("./users.repository");
const { ApiError } = require("../../utils/ApiError");

class UsersService {
  async getUsers(query) {
    return usersRepo.getUsers(query);
  }

  async getUserById(id) {
    const user = await usersRepo.getUserById(id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  }

  async updateUser(id, fields, currentUser) {
    if (!id) {
      throw new ApiError(400, "User ID is required.");
    }

    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "content_manager") {
      if (id !== currentUser.id) {
        throw new ApiError(403, "Access denied. You can only update your own profile.");
      }
    }

    const user = await usersRepo.getRawUser(id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const data = {
      name: user.name,
      branch: user.branch,
      semester: user.semester,
      xp: user.xp,
      level: user.level,
      rank: user.rank,
      specialization: user.specialization,
      hasFullPremium: user.has_full_premium,
      deviceId: user.device_id,
      maxDevices: user.max_devices !== undefined ? user.max_devices : 1,
      allowedDevices: user.allowed_devices || [],
      activePlanId: user.active_plan_id,
      planExpiry: user.plan_expiry ? Number(user.plan_expiry) : null,
      purchasedCompanies: user.purchased_companies || [],
      grantedCompanyAccess: user.granted_company_access || {},
      grantedSubjectAccess: user.granted_subject_access || {},
      grantedTopicAccess: user.granted_topic_access || {},
      grantedExamAccess: user.granted_exam_access || {},
      grantedModuleAccess: user.granted_module_access || {},
      theme: user.theme || 'dark',
      branchId: user.branch_id
    };

    const allowedStudentKeys = ["name", "branch", "semester", "theme", "branchId", "branch_id"];
    for (const key of Object.keys(fields)) {
      if (key === "id" || key === "password") continue;

      if (currentUser && currentUser.role !== "admin" && currentUser.role !== "content_manager") {
        const rootKey = key.split(".")[0];
        if (!allowedStudentKeys.includes(rootKey)) {
          continue;
        }
      }
      
      if (key.includes(".")) {
        const [parentKey, childKey] = key.split(".");
        if (data[parentKey] === null || typeof data[parentKey] !== "object") {
          data[parentKey] = {};
        }
        if (fields[key] === "DELETE_FIELD" || fields[key] === null) {
          delete data[parentKey][childKey];
        } else {
          data[parentKey][childKey] = fields[key];
        }
      } else {
        const targetKey = key === "branchId" || key === "branch_id" ? "branchId" : key;
        if (fields[key] === "DELETE_FIELD") {
          data[targetKey] = null;
        } else {
          data[targetKey] = fields[key];
        }
      }
    }

    const oldBranchId = user.branch_id;
    const newBranchId = data.branchId;
    if (oldBranchId !== newBranchId && currentUser) {
      await pool.query(
        `INSERT INTO security_logs (id, user_id, user_name, user_email, event_type, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          currentUser.id,
          currentUser.name || user.name || "Student",
          currentUser.email || user.email,
          "STUDENT_BRANCH_CHANGED",
          `Changed active branch from '${oldBranchId || "none"}' to '${newBranchId || "none"}'`
        ]
      ).catch(e => console.error("Audit log error:", e));
    }

    await usersRepo.updateUserRecord(id, data);
    return { success: true };
  }

  async deleteUser(id) {
    await usersRepo.deleteUser(id);
    return { success: true };
  }

  async getDeviceRequests() {
    return usersRepo.getDeviceRequests();
  }

  async createDeviceRequest(data, currentUser) {
    const resolvedUserId = data.userId || (currentUser && currentUser.id);
    if (!resolvedUserId) {
      throw new ApiError(400, "User ID is required");
    }
    await usersRepo.createDeviceRequest({
      id: data.id,
      userId: resolvedUserId,
      userName: data.userName,
      userEmail: data.userEmail,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      status: data.status || "pending"
    });
    return { success: true };
  }

  async updateDeviceRequest(id, status) {
    const devReq = await usersRepo.updateDeviceRequestStatus(id, status);
    if (!devReq) {
      throw new ApiError(404, "Device request not found");
    }
    return { success: true };
  }
}

module.exports = new UsersService();
