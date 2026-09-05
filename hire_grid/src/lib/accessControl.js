const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

const parseObject = (val) => {
  if (val && typeof val === "object" && !Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return {};
};

export const normalizeItemType = (type) => {
  if (!type) return "module";
  if (type.includes("subject")) return "general_subject";
  if (type.includes("topic")) return "general_topic";
  if (type.includes("branch")) return "general_branch";
  return type;
};

export const hasAccess = (
  item,
  itemType,
  currentUser,
  path = [], // Optional path to resolve inherit mode and ancestor plan inclusions
  activePlan = null, // User's active plan object
  allPlans = []
) => {
  if (!item) return false;

  const currentAccessMode = item.accessMode || item.access_mode || "inherit";
  const rawAccessType = item.accessType || item.access_type;
  const rawIsPremium = item.isPremium !== undefined ? item.isPremium : item.is_premium;

  let effectiveAccessType = "free";

  if (rawAccessType && rawAccessType !== "free") {
    effectiveAccessType = rawAccessType;
  } else if (rawIsPremium) {
    effectiveAccessType = "premium_only";
  }

  // 1. Inherit Mode (Modules)
  if (itemType === "module" && currentAccessMode === "inherit") {
    effectiveAccessType = "free"; // default
    if (path && path.length > 0) {
      for (let i = path.length - 1; i >= 0; i--) {
        const p = path[i];
        const pNode = p.node || (p.id ? p : null);
        if (pNode) {
          const pAcc = pNode.accessType || pNode.access_type;
          const pPrem = pNode.isPremium !== undefined ? pNode.isPremium : pNode.is_premium;
          const pAccessType = (pAcc && pAcc !== "free") ? pAcc : (pPrem ? "premium_only" : "free");
          if (pAccessType !== "free" && pAccessType !== "demo") {
            effectiveAccessType = pAccessType;
            break;
          }
        }
      }
    }
  }

  // 2. Explicitly FREE or DEMO content is ALWAYS UNLOCKED for everyone.
  // Free content must never be locked even if it is included inside a paid plan.
  if (effectiveAccessType === "free" || effectiveAccessType === "demo") {
    return true;
  }

  // Without a user, any remaining non-free content is locked
  if (!currentUser) return false;

  const normType = normalizeItemType(itemType);

  // 3. Individual Purchase / Admin Granted Explicit Access
  let accessMapRaw;
  if (normType === "company") accessMapRaw = currentUser.grantedCompanyAccess || currentUser.granted_company_access;
  else if (normType === "general_subject") accessMapRaw = currentUser.grantedSubjectAccess || currentUser.granted_subject_access;
  else if (normType === "general_topic") accessMapRaw = currentUser.grantedTopicAccess || currentUser.granted_topic_access;
  else if (normType === "general_branch") accessMapRaw = currentUser.grantedExamAccess || currentUser.granted_exam_access;
  else if (normType === "module") accessMapRaw = currentUser.grantedModuleAccess || currentUser.granted_module_access;

  const accessMap = parseObject(accessMapRaw);

  if (accessMap && accessMap[item.id] !== undefined) {
    const expiry = accessMap[item.id];
    if (expiry === null || expiry === undefined || Date.now() <= Number(expiry)) {
      return true;
    }
  }

  // Check if any ancestor is explicitly granted
  for (const p of path) {
    if (!p.node) continue;
    const pNormType = normalizeItemType(p.node.type || p.type);
    let pAccessMapRaw;
    if (pNormType === "company") pAccessMapRaw = currentUser.grantedCompanyAccess || currentUser.granted_company_access;
    else if (pNormType === "general_subject") pAccessMapRaw = currentUser.grantedSubjectAccess || currentUser.granted_subject_access;
    else if (pNormType === "general_topic") pAccessMapRaw = currentUser.grantedTopicAccess || currentUser.granted_topic_access;
    else if (pNormType === "general_branch") pAccessMapRaw = currentUser.grantedExamAccess || currentUser.granted_exam_access;
    
    const pAccessMap = parseObject(pAccessMapRaw);
    if (pAccessMap && pAccessMap[p.node.id] !== undefined) {
      const expiry = pAccessMap[p.node.id];
      if (expiry === null || expiry === undefined || Date.now() <= Number(expiry)) {
        return true;
      }
    }
  }

  // Legacy purchasedCompanies fallback
  const purchasedCompanies = parseArray(currentUser.purchasedCompanies || currentUser.purchased_companies);
  if (normType === "company" && purchasedCompanies.includes(item.id)) {
    return true;
  }

  // 4. Admin Granted Global Access (Full Premium)
  const hasFullPremium = currentUser.hasFullPremium || currentUser.has_full_premium;
  const fullPremiumExpiry = currentUser.fullPremiumExpiry || currentUser.full_premium_expiry || currentUser.planExpiry || currentUser.plan_expiry;
  if (
    effectiveAccessType !== "purchasable_only" &&
    effectiveAccessType !== "access_request_only" &&
    hasFullPremium
  ) {
    if (
      fullPremiumExpiry === null ||
      fullPremiumExpiry === undefined ||
      Date.now() <= Number(fullPremiumExpiry)
    ) {
      return true;
    }
  }

  // 5. Active Purchased Plan Access Validation
  const userActivePlanId = currentUser.activePlanId || currentUser.active_plan_id;
  const resolvedActivePlan = activePlan || (userActivePlanId && allPlans && allPlans.length > 0
    ? allPlans.find((p) => String(p.id) === String(userActivePlanId))
    : null);

  if (resolvedActivePlan && userActivePlanId) {
    const userPlanExpiry = currentUser.planExpiry || currentUser.plan_expiry;
    const isNotExpired = !userPlanExpiry || Date.now() <= Number(userPlanExpiry);

    if (isNotExpired) {
      const companyModules = parseArray(resolvedActivePlan.companyModules || resolvedActivePlan.company_modules);
      const learningContent = parseArray(resolvedActivePlan.learningContent || resolvedActivePlan.learning_content);
      const freeDemoModules = parseArray(resolvedActivePlan.freeDemoModules || resolvedActivePlan.free_demo_modules);
      const companyBranches = resolvedActivePlan.companyBranches || resolvedActivePlan.company_branches || [];

      const parentId = item.parentId || item.parent_id;

      // Helper to check company branches array
      const isInCompanyBranches = (targetId, type = "any") => {
        return companyBranches.some((cb) => {
          if (typeof cb === "string" || typeof cb === "number") {
            return String(cb) === String(targetId);
          }
          if (cb && typeof cb === "object") {
            if (type === "company" || type === "any") {
              if (cb.companyId && String(cb.companyId) === String(targetId)) return true;
            }
            if (type === "branch" || type === "any") {
              if (cb.branchId && String(cb.branchId) === String(targetId)) return true;
            }
          }
          return false;
        });
      };

      // A. Company Check
      if (normType === "company") {
        if (
          companyModules.some((id) => String(id) === String(item.id)) ||
          learningContent.some((id) => String(id) === String(item.id)) ||
          isInCompanyBranches(item.id, "company")
        ) {
          return true;
        }
      }

      // B. Module Check
      if (normType === "module") {
        if (freeDemoModules.some((id) => String(id) === String(item.id))) return true;
        if (learningContent.some((id) => String(id) === String(item.id))) return true;

        if (parentId) {
          if (
            companyModules.some((id) => String(id) === String(parentId)) ||
            learningContent.some((id) => String(id) === String(parentId)) ||
            isInCompanyBranches(parentId, "company")
          ) {
            return true;
          }
        }

        for (const p of path) {
          const pId = p.id || (p.node ? p.node.id : null);
          if (
            pId &&
            (companyModules.some((id) => String(id) === String(pId)) ||
              learningContent.some((id) => String(id) === String(pId)) ||
              isInCompanyBranches(pId, "any"))
          ) {
            return true;
          }
        }
      }

      // C. Node Check (Branch, Subject, Topic)
      if (
        normType === "general_branch" ||
        normType === "general_subject" ||
        normType === "general_topic"
      ) {
        if (
          learningContent.some((id) => String(id) === String(item.id)) ||
          isInCompanyBranches(item.id, "branch")
        ) {
          return true;
        }
        for (const p of path) {
          const pId = p.id || (p.node ? p.node.id : null);
          if (
            pId &&
            (learningContent.some((id) => String(id) === String(pId)) ||
              isInCompanyBranches(pId, "branch"))
          ) {
            return true;
          }
        }
      }
    }
  }

  // 6. Otherwise Lock Content
  return false;
};

/**
 * Checks if a plan is active based on its boolean status and scheduled active date ranges.
 * @param {object} plan
 * @returns {boolean}
 */
export const isPlanActive = (plan) => {
  if (!plan) return false;
  const activeStatus = plan.isActive !== false && plan.is_active !== false;
  if (!activeStatus) return false;

  const now = Date.now();
  const activeFrom = plan.activeFrom || plan.active_from;
  const activeUntil = plan.activeUntil || plan.active_until;

  if (activeFrom && now < Number(activeFrom)) return false;
  if (activeUntil && now > Number(activeUntil)) return false;

  return true;
};

/**
 * Checks if a plan should be visible to a student.
 * Visible if the plan is active for purchase, or if the student has already purchased it.
 * @param {object} plan
 * @param {object} user
 * @returns {boolean}
 */
export const isPlanVisibleToStudent = (plan, user) => {
  if (!plan) return false;
  if (isPlanActive(plan)) return true;

  const isPurchased = user?.activePlanId === plan.id || user?.active_plan_id === plan.id;
  const userExpiry = user?.planExpiry || user?.plan_expiry;
  const isNotExpired = !userExpiry || Date.now() <= Number(userExpiry);
  if (isPurchased && isNotExpired) return true;

  return false;
};
