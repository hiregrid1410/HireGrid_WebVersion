const formatUserResponse = (user) => {
  if (!user) return null;
  const formatted = { ...user };
  delete formatted.password;

  // Map snake_case to camelCase
  if (formatted.has_full_premium !== undefined) {
    formatted.hasFullPremium = formatted.has_full_premium;
    delete formatted.has_full_premium;
  }
  if (formatted.device_id !== undefined) {
    formatted.deviceId = formatted.device_id;
    delete formatted.device_id;
  }
  if (formatted.active_plan_id !== undefined) {
    formatted.activePlanId = formatted.active_plan_id;
    delete formatted.active_plan_id;
  }
  if (formatted.plan_expiry !== undefined) {
    formatted.planExpiry = formatted.plan_expiry ? Number(formatted.plan_expiry) : null;
    delete formatted.plan_expiry;
  }
  if (formatted.purchased_companies !== undefined) {
    formatted.purchasedCompanies = formatted.purchased_companies;
    delete formatted.purchased_companies;
  }
  if (formatted.granted_company_access !== undefined) {
    formatted.grantedCompanyAccess = formatted.granted_company_access;
    delete formatted.granted_company_access;
  }
  if (formatted.granted_subject_access !== undefined) {
    formatted.grantedSubjectAccess = formatted.granted_subject_access;
    delete formatted.granted_subject_access;
  }
  if (formatted.granted_topic_access !== undefined) {
    formatted.grantedTopicAccess = formatted.granted_topic_access;
    delete formatted.granted_topic_access;
  }
  if (formatted.granted_exam_access !== undefined) {
    formatted.grantedExamAccess = formatted.granted_exam_access;
    delete formatted.granted_exam_access;
  }
  if (formatted.granted_module_access !== undefined) {
    formatted.grantedModuleAccess = formatted.granted_module_access;
    delete formatted.granted_module_access;
  }
  if (formatted.email_verified !== undefined) {
    formatted.emailVerified = formatted.email_verified;
    delete formatted.email_verified;
  }
  if (formatted.max_devices !== undefined) {
    formatted.maxDevices = formatted.max_devices;
    delete formatted.max_devices;
  }
  if (formatted.allowed_devices !== undefined) {
    formatted.allowedDevices = formatted.allowed_devices;
    delete formatted.allowed_devices;
  }

  return formatted;
};

const parseJsonSafely = (val, fallback = {}) => {
  if (val && typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
};

module.exports = {
  formatUserResponse,
  parseJsonSafely,
};
