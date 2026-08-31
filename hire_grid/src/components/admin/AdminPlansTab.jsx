import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import {
  collection,
  db,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  OperationType,
  handleFirestoreError,
} from "../../firebase";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  FileText,
  Building2,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { logAudit } from "../../auditLogger";
import { showToast } from "../common/Toast";
import { isPlanActive } from "../../lib/accessControl";

export function AdminPlansTab({ userName }) {
  const [plans, setPlans] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Form & Wizard State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Basics, 2: Content, 3: Companies, 4: Expiry, 5: Review
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState("1_month");
  const [durationDays, setDurationDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [isFreemium, setIsFreemium] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [activeFrom, setActiveFrom] = useState("");
  const [activeUntil, setActiveUntil] = useState("");

  // Selection States
  const [learningContent, setLearningContent] = useState([]);
  const [companyModules, setCompanyModules] = useState([]);
  const [freeDemoModules, setFreeDemoModules] = useState([]);
  const [companyBranches, setCompanyBranches] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);

  const [expandedNodes, setExpandedNodes] = useState({});
  const [childrenMap, setChildrenMap] = useState({});
  const [loadingNodes, setLoadingNodes] = useState({});

  useEffect(() => {
    api.get("/hierarchy-nodes?where_type==:general_branch")
      .then((res) => {
        if (res.success && res.nodes) {
          setAvailableBranches(res.nodes);
        }
      })
      .catch((err) => console.error("Fetch branches error:", err));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "plans"));
    const unsubPlans = onSnapshot(
      q,
      (snapshot) => {
        setPlans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "plans")
    );

    const compQuery = query(collection(db, "companies"));
    const unsubComp = onSnapshot(
      compQuery,
      (snapshot) => {
        setCompanies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "companies")
    );

    return () => {
      unsubPlans();
      unsubComp();
    };
  }, []);

  const formatForInput = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(Number(timestamp));
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too large. Please select an image smaller than 2MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCode(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const loadNodeChildren = async (nodeId, nodeType) => {
    if (childrenMap[nodeId]) return;
    setLoadingNodes((prev) => ({ ...prev, [nodeId]: true }));
    try {
      let fetched = [];
      if (nodeType === "root") {
        const q = query(collection(db, "hierarchy_nodes"), where("parentId", "==", null), where("type", "==", "general_branch"));
        const snap = await getDocs(q);
        fetched = snap.docs.map((d) => ({ id: d.id, name: d.data().name, type: "general_branch" }));
      } else if (nodeType === "general_branch") {
        const q = query(collection(db, "hierarchy_nodes"), where("parentId", "==", nodeId), where("type", "==", "general_subject"));
        const snap = await getDocs(q);
        fetched = snap.docs.map((d) => ({ id: d.id, name: d.data().name, type: "general_subject" }));
      } else if (nodeType === "general_subject") {
        const q = query(collection(db, "hierarchy_nodes"), where("parentId", "==", nodeId), where("type", "==", "general_topic"));
        const snap = await getDocs(q);
        fetched = snap.docs.map((d) => ({ id: d.id, name: d.data().name, type: "general_topic" }));
      } else if (nodeType === "general_topic") {
        const q = query(collection(db, "modules"), where("parentId", "==", nodeId));
        const snap = await getDocs(q);
        fetched = snap.docs.map((d) => ({ id: d.id, name: d.data().name, type: "module" }));
      }
      setChildrenMap((prev) => ({ ...prev, [nodeId]: fetched }));
    } catch (err) {
      console.error("Failed to load node children:", err);
    } finally {
      setLoadingNodes((prev) => ({ ...prev, [nodeId]: false }));
    }
  };

  const handleToggleExpand = async (nodeId, nodeType) => {
    const nextState = !expandedNodes[nodeId];
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: nextState }));
    if (nextState) {
      await loadNodeChildren(nodeId, nodeType);
    }
  };

  const isSelected = (nodeId, parentIds = []) => {
    if (learningContent.includes(nodeId)) return true;
    return parentIds.some((pId) => learningContent.includes(pId));
  };

  const handleToggleNode = (nodeId, parentIds = []) => {
    const isNodeSelected = learningContent.includes(nodeId);
    let updated = [...learningContent];
    if (isNodeSelected) {
      updated = updated.filter((id) => id !== nodeId);
    } else {
      updated.push(nodeId);
    }
    setLearningContent(updated);
  };

  const handleToggleDemo = (moduleId) => {
    if (freeDemoModules.includes(moduleId)) {
      setFreeDemoModules(freeDemoModules.filter((id) => id !== moduleId));
    } else {
      setFreeDemoModules([...freeDemoModules, moduleId]);
    }
  };

  const handleToggleCompany = (companyId) => {
    if (companyModules.includes(companyId)) {
      setCompanyModules(companyModules.filter((id) => id !== companyId));
      setCompanyBranches(companyBranches.filter((cb) => cb.companyId !== companyId));
    } else {
      setCompanyModules([...companyModules, companyId]);
    }
  };

  const handleToggleCompanyBranch = (companyId, branchId) => {
    const exists = companyBranches.some((cb) => cb.companyId === companyId && cb.branchId === branchId);
    if (exists) {
      setCompanyBranches(companyBranches.filter((cb) => !(cb.companyId === companyId && cb.branchId === branchId)));
    } else {
      setCompanyBranches([...companyBranches, { companyId, branchId }]);
    }
  };

  const isCompanyBranchChecked = (companyId, branchId) => {
    return companyBranches.some((cb) => cb.companyId === companyId && cb.branchId === branchId);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      const planId = editingId || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      const payload = {
        id: planId,
        name,
        price: Number(price),
        duration,
        durationDays: duration === "custom_days" ? Number(durationDays) : null,
        isActive,
        isFreemium,
        learningContent,
        companyModules,
        freeDemoModules,
        companyBranches,
        paymentNumber,
        qrCode,
        activeFrom: activeFrom ? new Date(activeFrom).getTime() : null,
        activeUntil: activeUntil ? new Date(activeUntil).getTime() : null,
      };

      await api.post("/plans", payload).catch(() => {});
      await setDoc(doc(db, "plans", planId), payload);

      await logAudit(userName, `${editingId ? "Updated" : "Created"} subscription plan: ${name}`);

      setIsFormOpen(false);
      setEditingId(null);
      setName("");
      setPrice(0);
      setDuration("1_month");
      setDurationDays(30);
      setIsActive(true);
      setIsFreemium(false);
      setLearningContent([]);
      setCompanyModules([]);
      setFreeDemoModules([]);
      setCompanyBranches([]);
      setPaymentNumber("");
      setQrCode("");
      setActiveFrom("");
      setActiveUntil("");
      showToast("Plan saved successfully!", "success");
    } catch (err) {
      showToast("Error saving plan: " + err.message, "error");
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setName(plan.name);
    setPrice(plan.price);
    setDuration(plan.duration);
    setDurationDays(plan.durationDays || 30);
    setIsActive(plan.isActive !== false && plan.is_active !== false);
    setIsFreemium(plan.isFreemium || plan.is_freemium);
    setLearningContent(plan.learningContent || plan.learning_content || []);
    setCompanyModules(plan.companyModules || plan.company_modules || []);
    setFreeDemoModules(plan.freeDemoModules || plan.free_demo_modules || []);
    setCompanyBranches(plan.companyBranches || plan.company_branches || []);
    setPaymentNumber(plan.paymentNumber || plan.payment_number || "");
    setQrCode(plan.qrCode || plan.qr_code || "");
    setActiveFrom(plan.activeFrom || plan.active_from ? formatForInput(plan.activeFrom || plan.active_from) : "");
    setActiveUntil(plan.activeUntil || plan.active_until ? formatForInput(plan.activeUntil || plan.active_until) : "");
    setFormStep(1);
    setIsFormOpen(true);
  };

  const handleDelete = async (planId, planName) => {
    if (!confirm(`Are you sure you want to delete the plan "${planName}"?`)) return;
    try {
      await api.delete(`/plans/${planId}`).catch(() => {});
      await deleteDoc(doc(db, "plans", planId));
      await logAudit(userName, `Deleted subscription plan: ${planName}`);
      showToast("Plan deleted successfully!", "success");
    } catch (err) {
      showToast("Error deleting plan: " + err.message, "error");
    }
  };

  useEffect(() => {
    if (isFormOpen) {
      loadNodeChildren("root", "root");
    }
  }, [isFormOpen]);

  const renderTree = (nodeId, nodeType, parentIds = []) => {
    const children = childrenMap[nodeId] || [];
    const isLoading = loadingNodes[nodeId];

    return (
      <div className="pl-4 space-y-2">
        {isLoading && <span className="text-xs text-slate-400 font-mono">Loading tree nodes...</span>}
        {children.map((child) => {
          const isExpanded = expandedNodes[child.id];
          const hasChildren = child.type !== "module";
          const currentParentIds = [...parentIds, nodeId];
          const checked = isSelected(child.id, currentParentIds);

          return (
            <div key={child.id} className="space-y-1">
              <div className="flex items-center space-x-2 py-1.5 hover:bg-slate-50/5 dark:hover:bg-slate-800/30 rounded-lg px-2 group">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(child.id, child.type)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}

                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleNode(child.id, currentParentIds)}
                  className="w-4 h-4 text-emerald-600 border-slate-350 dark:border-slate-800 bg-transparent rounded focus:ring-emerald-500"
                />

                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {child.name}
                </span>

                {child.type === "module" && checked && (
                  <label className="flex items-center space-x-1 ml-auto cursor-pointer">
                    <input
                      type="checkbox"
                      checked={freeDemoModules.includes(child.id)}
                      onChange={() => handleToggleDemo(child.id)}
                      className="w-3.5 h-3.5 text-lime-500 border-slate-350 rounded bg-transparent focus:ring-lime-500"
                    />
                    <span className="text-[10px] font-bold text-lime-500 uppercase tracking-wide">
                      Free Demo
                    </span>
                  </label>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="border-l border-slate-200 dark:border-slate-800 ml-3.5">
                  {renderTree(child.id, child.type, currentParentIds)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Subscription Plans</h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Define pricing packages, duration terms, learning hierarchy permissions, and company access modules.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingId(null);
              setName("");
              setPrice(0);
              setDuration("1_month");
              setDurationDays(30);
              setIsActive(true);
              setIsFreemium(false);
              setLearningContent([]);
              setCompanyModules([]);
              setFreeDemoModules([]);
              setCompanyBranches([]);
              setPaymentNumber("");
              setQrCode("");
              setActiveFrom("");
              setActiveUntil("");
              setFormStep(1);
              setIsFormOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      {/* Plan Wizard Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">
              {editingId ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps Indicator */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-2">
              <span>Step {formStep} of 5</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formStep === 1 && "Plan Basics"}
                {formStep === 2 && "Learning Content Entitlements"}
                {formStep === 3 && "Company Modules"}
                {formStep === 4 && "Validity & Scheduling"}
                {formStep === 5 && "Review & Confirm"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full flex-1 border-r border-white dark:border-slate-900 last:border-0 transition-all ${
                    idx + 1 <= formStep ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Step Contents */}
          <div className="py-4">
            {formStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Plan Name</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      placeholder="e.g. Premium Gate Pack"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Price (INR)</label>
                    <input
                      required
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Custom UPI Number (Optional)</label>
                    <input
                      type="text"
                      value={paymentNumber}
                      onChange={(e) => setPaymentNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-sm outline-none focus:border-emerald-500"
                      placeholder="e.g. 9664532860"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Custom Payment QR Code (Optional)</label>
                    <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20"
                      />
                      {qrCode && (
                        <div className="relative w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 bg-white flex items-center justify-center">
                          <img src={qrCode} alt="QR Preview" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setQrCode("")}
                            className="absolute top-0 right-0 bg-rose-500 hover:bg-rose-600 text-white p-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-black"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded bg-transparent focus:ring-emerald-500"
                    />
                    <span>Active Status</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={isFreemium}
                      onChange={(e) => setIsFreemium(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded bg-transparent focus:ring-emerald-500"
                    />
                    <span>Freemium Pack</span>
                  </label>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-xs text-slate-500 font-medium">Select subjects, topics, or modules this plan will grant access to. Implicit permission will cascade down.</p>
                <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl custom-scrollbar">
                  {renderTree("root", "root")}
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-xs text-slate-500 font-medium">Check companies and branches allowed under this subscription package.</p>
                <div className="max-h-96 overflow-y-auto space-y-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl custom-scrollbar">
                  {companies.length === 0 ? (
                    <span className="text-xs text-slate-500">No companies found in database.</span>
                  ) : (
                    companies.map((comp) => {
                      const checked = companyModules.includes(comp.id);
                      return (
                        <div
                          key={comp.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            checked
                              ? "bg-emerald-500/5 border-emerald-500/30"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <label className="flex items-center space-x-3 cursor-pointer text-slate-700 dark:text-slate-300 font-bold text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleCompany(comp.id)}
                              className="w-4 h-4 text-emerald-600 rounded bg-transparent focus:ring-emerald-500"
                            />
                            <span>{comp.name}</span>
                          </label>

                          {checked && (
                            <div className="pl-7 pt-3 border-t border-slate-105 dark:border-slate-800/80 space-y-2">
                              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                                Allowed Branches:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {availableBranches.map((br) => {
                                  const brChecked = isCompanyBranchChecked(comp.id, br.id);
                                  return (
                                    <label
                                      key={br.id}
                                      className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                                        brChecked
                                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={brChecked}
                                        onChange={() => handleToggleCompanyBranch(comp.id, br.id)}
                                        className="w-3.5 h-3.5 text-emerald-600 rounded bg-transparent focus:ring-emerald-500"
                                      />
                                      <span className="truncate">{br.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {formStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Plan Expiry Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="free">Free (Freemium)</option>
                      <option value="1_month">1 Month</option>
                      <option value="3_months">3 Months</option>
                      <option value="6_months">6 Months</option>
                      <option value="9_months">9 Months</option>
                      <option value="12_months">12 Months</option>
                      <option value="lifetime">Lifetime</option>
                      <option value="custom_days">Custom Days</option>
                    </select>
                  </div>

                  {duration === "custom_days" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Validity Days</label>
                      <input
                        required
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Scheduling Start (Optional)</label>
                    <input
                      type="datetime-local"
                      value={activeFrom}
                      onChange={(e) => setActiveFrom(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Scheduling End (Optional)</label>
                    <input
                      type="datetime-local"
                      value={activeUntil}
                      onChange={(e) => setActiveUntil(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {formStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Review Summary Configuration</h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-450">Plan Name:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Pricing term:</span>
                      <span className="font-bold text-emerald-500">₹{price} INR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Duration:</span>
                      <span className="font-bold text-slate-800 dark:text-white capitalize">
                        {duration.replace("_", " ")} {duration === "custom_days" && `(${durationDays} Days)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450">Active:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{isActive ? "YES" : "NO"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                    <h5 className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono mb-2">Learning Entitlements</h5>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {learningContent.length} items checked
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                    <h5 className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono mb-2">Companies allowed</h5>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {companyModules.length} company modules selected
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
            <button
              type="button"
              disabled={formStep === 1}
              onClick={() => setFormStep((s) => s - 1)}
              className="flex items-center space-x-1.5 px-4 py-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {formStep < 5 ? (
              <button
                type="button"
                onClick={() => setFormStep((s) => s + 1)}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-colors"
              >
                Save Package
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plans List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-1 md:col-span-3 text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
            No active subscription packages created yet.
          </div>
        ) : (
          plans.map((plan) => {
            const active = isPlanActive(plan);
            return (
              <div
                key={plan.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                  active ? "border-slate-200 dark:border-slate-800 hover:scale-[1.01]" : "border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base tracking-wide line-clamp-1">{plan.name}</h3>
                      <span className="text-xs text-slate-400 mt-1 inline-block capitalize">
                        {plan.duration.replace("_", " ")}
                        {plan.duration === "custom_days" && ` (${plan.durationDays} Days)`}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1 py-1">
                    <span className="text-2xl font-black text-slate-850 dark:text-white">
                      ₹{Number(plan.price || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold font-mono">INR</span>
                    {plan.isFreemium && (
                      <span className="text-[10px] font-bold text-lime-500 bg-lime-500/10 px-2 py-0.5 rounded-full ml-auto">
                        Freemium
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Curriculum Access:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{(plan.learningContent || []).length} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company Matrix:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{(plan.companyModules || []).length} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Demo Modules:</span>
                      <span className="font-bold text-lime-500">{(plan.freeDemoModules || []).length} items</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/85 mt-6 pt-4">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex items-center text-xs font-bold text-slate-450 hover:text-emerald-500 dark:hover:text-emerald-450 transition-colors"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id, plan.name)}
                    className="flex items-center text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
