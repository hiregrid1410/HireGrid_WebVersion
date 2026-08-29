import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  X,
  GitMerge,
  Building2,
  BookOpen,
  Trophy,
  Info,
  ChevronRight,
  ShieldCheck,
  Search,
  CheckSquare,
  Square,
  ListFilter,
} from "lucide-react";

export function AdminBranchesTab({ isContentManager = false, userName = "" }) {
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modules, setModules] = useState([]);
  const [hierarchyNodes, setHierarchyNodes] = useState([]);

  const [activeTab, setActiveTab] = useState("manage-branches"); // 'manage-branches' | 'mappings'
  const [mappingTab, setMappingTab] = useState("company"); // 'company' | 'learning' | 'mission'

  // Branch CRUD State
  const [branchForm, setBranchForm] = useState({
    id: "",
    name: "",
    code: "",
    description: "",
    status: "ACTIVE",
    isGeneral: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mappings Selection State (Supports Multi-Select)
  const [selectedEntityIds, setSelectedEntityIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [assignmentScope, setAssignmentScope] = useState("ALL"); // 'ALL' | 'SPECIFIC'
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, companiesRes, nodesRes, modulesRes] = await Promise.all([
        api.get("/branches"),
        api.get("/companies"),
        api.get("/hierarchy-nodes"),
        api.get("/modules?where_isPlacementMission==true"),
      ]);

      if (branchesRes.success) setBranches(branchesRes.branches || []);
      if (companiesRes.success) setCompanies(companiesRes.companies || []);
      if (nodesRes.success) setHierarchyNodes(nodesRes.nodes || []);
      if (modulesRes.success) setModules(modulesRes.modules || []);
    } catch (err) {
      showToast("Error loading branch mapping data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Branch CRUD handlers
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code) {
      showToast("Branch name and code are required", "warning");
      return;
    }

    try {
      const url = branchForm.id ? `/branches/${branchForm.id}` : "/branches";
      const method = branchForm.id ? "PUT" : "POST";

      const res = await api[method.toLowerCase()](url, branchForm);
      if (res.success) {
        showToast(
          `Branch ${branchForm.id ? "updated" : "created"} successfully!`,
          "success"
        );
        resetBranchForm();
        fetchData();
      }
    } catch (err) {
      showToast("Failed to save branch: " + err.message, "error");
    }
  };

  const handleEditBranch = (branch) => {
    setBranchForm({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      description: branch.description || "",
      status: branch.status || "ACTIVE",
      isGeneral: !!branch.isGeneral,
    });
    setIsEditing(true);
  };

  const handleDeleteBranch = async (id, name) => {
    const ok = window.confirm(
      `Are you sure you want to delete the branch "${name}"? This will unlink all students and mappings.`
    );
    if (!ok) return;

    try {
      const res = await api.delete(`/branches/${id}`);
      if (res.success) {
        showToast("Branch deleted successfully", "success");
        fetchData();
      }
    } catch (err) {
      showToast("Failed to delete branch: " + err.message, "error");
    }
  };

  const resetBranchForm = () => {
    setBranchForm({
      id: "",
      name: "",
      code: "",
      description: "",
      status: "ACTIVE",
      isGeneral: false,
    });
    setIsEditing(false);
  };

  // Load mappings helper (when single item is selected)
  const loadSingleEntityMapping = async (id) => {
    try {
      if (mappingTab === "company") {
        const res = await api.get(`/companies/${id}/branches`);
        if (res.success && res.mappings) {
          const hasAll = res.mappings.some((m) => m.assignmentScope === "ALL");
          setAssignmentScope(hasAll ? "ALL" : "SPECIFIC");
          setSelectedBranchIds(
            res.mappings
              .filter((m) => m.assignmentScope === "SPECIFIC")
              .map((m) => m.branchId)
          );
        }
      } else {
        const type = mappingTab === "learning" ? "hierarchy_node" : "module";
        const res = await api.get(`/content-mappings/${type}/${id}`);
        if (res.success && res.mappings) {
          const hasAll = res.mappings.some((m) => m.assignmentScope === "ALL");
          setAssignmentScope(hasAll ? "ALL" : "SPECIFIC");
          setSelectedBranchIds(
            res.mappings
              .filter((m) => m.assignmentScope === "SPECIFIC")
              .map((m) => m.branchId)
          );
        }
      }
    } catch (err) {
      console.error("Failed to load mappings: ", err);
    }
  };

  // Handle singular & batch saves
  const handleSaveBatchMappings = async () => {
    if (selectedEntityIds.length === 0) {
      showToast("Please select at least one item to map", "warning");
      return;
    }

    setLoading(true);
    try {
      if (mappingTab === "company") {
        const res = await api.put("/companies-batch/branches", {
          companyIds: selectedEntityIds,
          assignmentScope,
          branchIds: selectedBranchIds,
        });
        if (res.success) {
          showToast(`Successfully assigned mappings to ${selectedEntityIds.length} companies!`, "success");
        }
      } else {
        const typeKey = mappingTab === "learning" ? "hierarchy_node" : "module";
        const res = await api.put(`/content-mappings-batch/${typeKey}`, {
          contentIds: selectedEntityIds,
          assignmentScope,
          branchIds: selectedBranchIds,
        });
        if (res.success) {
          showToast(`Successfully assigned mappings to ${selectedEntityIds.length} content items!`, "success");
        }
      }
    } catch (err) {
      showToast("Failed to save batch mappings: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleBranchSelection = (branchId) => {
    setSelectedBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  // Toggle selection for a company / node / module card
  const handleToggleEntity = (id) => {
    setSelectedEntityIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      // UX improvement: if only 1 item remains selected, load its current config automatically
      if (updated.length === 1) {
        loadSingleEntityMapping(updated[0]);
      } else if (updated.length === 0) {
        setAssignmentScope("ALL");
        setSelectedBranchIds([]);
      }
      return updated;
    });
  };

  const getHierarchyNodePath = (node) => {
    if (!node) return "";
    const path = [];
    let current = node;
    let depth = 0;
    while (current && depth < 10) {
      path.unshift(current.name);
      if (current.parentId) {
        const parent = hierarchyNodes.find((n) => n.id === current.parentId);
        if (parent && parent.id !== current.id) {
          current = parent;
        } else {
          break;
        }
      } else {
        break;
      }
      depth++;
    }
    return path.join(" > ");
  };

  const getModulePath = (module) => {
    if (!module) return "";
    if (module.parent_id) {
      if (module.module_type === "company") {
        const company = companies.find((c) => c.id === module.parent_id);
        if (company) {
          return `${company.name} > ${module.title}`;
        }
      } else {
        const node = hierarchyNodes.find((n) => n.id === module.parent_id);
        if (node) {
          return `${getHierarchyNodePath(node)} > ${module.title}`;
        }
      }
    }
    return module.title;
  };

  // Filter items based on search query
  const getFilteredEntities = () => {
    const query = searchQuery.toLowerCase().trim();
    if (mappingTab === "company") {
      return companies
        .filter((c) => c.name.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    if (mappingTab === "learning") {
      return hierarchyNodes
        .filter(
          (n) =>
            n.type === "general_branch" ||
            n.type === "general_subject" ||
            n.type === "general_topic"
        )
        .map((n) => ({
          ...n,
          displayName: getHierarchyNodePath(n),
        }))
        .filter((n) => n.displayName.toLowerCase().includes(query))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    if (mappingTab === "mission") {
      return modules
        .map((m) => ({
          ...m,
          displayName: getModulePath(m),
        }))
        .filter((m) => m.displayName.toLowerCase().includes(query))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return [];
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = getFilteredEntities().map((item) => item.id);
    setSelectedEntityIds((prev) => {
      const merged = Array.from(new Set([...prev, ...filteredIds]));
      if (merged.length === 1) {
        loadSingleEntityMapping(merged[0]);
      }
      return merged;
    });
  };

  const handleDeselectAll = () => {
    setSelectedEntityIds([]);
    setAssignmentScope("ALL");
    setSelectedBranchIds([]);
  };

  const filteredItems = getFilteredEntities();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-emerald-500/20">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center">
            <GitMerge className="w-6 h-6 mr-2 text-emerald-500" />
            Branch & Access Mappings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure academic branches and map preparation modules, companies, and exams.
          </p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("manage-branches")}
          className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === "manage-branches"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Manage Academic Branches
        </button>
        <button
          onClick={() => setActiveTab("mappings")}
          className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === "mappings"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          Assign Content & Access
        </button>
      </div>

      {activeTab === "manage-branches" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branch Form */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-fit space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              {isEditing ? <Edit2 className="w-5 h-5 mr-2 text-emerald-500" /> : <Plus className="w-5 h-5 mr-2 text-emerald-500" />}
              {isEditing ? "Edit Branch details" : "Add Academic Branch"}
            </h3>

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Engineering"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Branch Code (Short Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Academic description or details..."
                  value={branchForm.description}
                  onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={branchForm.status}
                  onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Onboard-ready)</option>
                  <option value="INACTIVE">INACTIVE (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="isGeneral"
                  checked={branchForm.isGeneral}
                  onChange={(e) => setBranchForm({ ...branchForm, isGeneral: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:outline-none"
                />
                <label htmlFor="isGeneral" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Set as Default System General Branch
                </label>
              </div>

              {branchForm.isGeneral && (
                <div className="flex bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-start space-x-2 text-xs text-amber-600 dark:text-amber-400">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Only one general branch can be set. This will automatically unset any other active general branch.</span>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  {branchForm.id ? "Update Details" : "Create Branch"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetBranchForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Branches List */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Academic Specialties List ({branches.length})
            </h3>

            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <thead>
                  <tr className="text-slate-500 text-left font-semibold">
                    <th className="pb-3 pr-4">Branch Code</th>
                    <th className="pb-3 px-4">Name</th>
                    <th className="pb-3 px-4">Default general?</th>
                    <th className="pb-3 px-4">Status</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {branches.map((b) => (
                    <tr key={b.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 pr-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {b.code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {b.name}
                      </td>
                      <td className="py-3 px-4">
                        {b.isGeneral ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            General (Default)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            b.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditBranch(b)}
                          className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!b.isGeneral && (
                          <button
                            onClick={() => handleDeleteBranch(b.id, b.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {branches.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">
                        No branches configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Batch Access Mappings View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Entities Selector Checklist */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col space-y-4 lg:col-span-1 min-h-[500px]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <ListFilter className="w-5 h-5 mr-2 text-emerald-500" />
              Targets selection
            </h3>

            {/* Mapping Type Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
              <button
                onClick={() => {
                  setMappingTab("company");
                  handleDeselectAll();
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center space-y-0.5 ${
                  mappingTab === "company"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Companies</span>
              </button>
              <button
                onClick={() => {
                  setMappingTab("learning");
                  handleDeselectAll();
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center space-y-0.5 ${
                  mappingTab === "learning"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Learning</span>
              </button>
              <button
                onClick={() => {
                  setMappingTab("mission");
                  handleDeselectAll();
                }}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex flex-col items-center justify-center space-y-0.5 ${
                  mappingTab === "mission"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Placement</span>
              </button>
            </div>

            {/* Live search input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${mappingTab === "company" ? "companies" : mappingTab === "learning" ? "nodes" : "missions"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
            </div>

            {/* Select helpers */}
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">
                {selectedEntityIds.length} selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={handleSelectAllFiltered}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-rose-500 hover:underline font-bold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Target Entities checklist box */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[350px] custom-scrollbar">
              {filteredItems.map((item) => {
                const isSelected = selectedEntityIds.includes(item.id);
                const title = item.displayName || item.name || item.title;
                let label = "";
                if (mappingTab === "company") {
                  label = "[COMPANY] ";
                } else if (mappingTab === "learning" && item.type) {
                  label = `[${item.type.replace("general_", "").toUpperCase()}] `;
                } else if (mappingTab === "mission") {
                  label = `[${(item.module_type === "company" ? "company_module" : "general_module").toUpperCase()}] `;
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleEntity(item.id)}
                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      isSelected
                        ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate pr-2">
                      <span className="text-[10px] text-slate-400 font-mono">{label}</span>
                      {title}
                    </span>
                    <div className="shrink-0 text-slate-400">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No matching targets found.
                </div>
              )}
            </div>
          </div>

          {/* Mappings Permissions & Bulk Assign Panel */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-2 overflow-hidden flex flex-col justify-between min-h-[500px]">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Permissions Assignment
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedEntityIds.length === 1 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Showing current configuration for single item.
                      </span>
                    ) : selectedEntityIds.length > 1 ? (
                      <span className="text-amber-500 font-semibold">
                        Bulk editing {selectedEntityIds.length} items. Saving will overwrite their existing mappings.
                      </span>
                    ) : (
                      "Please select targets on the left to configure access."
                    )}
                  </p>
                </div>
                {assignmentScope === "ALL" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    Global Assignment Active
                  </span>
                )}
              </div>

              {/* Assignment Scope */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Who can access the selected content?
                </label>
                <div className="flex space-x-6 py-1">
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentScope"
                      value="ALL"
                      checked={assignmentScope === "ALL"}
                      onChange={() => setAssignmentScope("ALL")}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>All Students (Global)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentScope"
                      value="SPECIFIC"
                      checked={assignmentScope === "SPECIFIC"}
                      onChange={() => setAssignmentScope("SPECIFIC")}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Selected Branches Only</span>
                  </label>
                </div>
              </div>

              {assignmentScope === "ALL" ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Check className="w-12 h-12 text-emerald-500 bg-emerald-500/10 rounded-full p-2 mb-4" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Access open to all students
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    Because "All Students" is selected, the selected target modules/companies will be globally visible and accessible by every student in the platform.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {branches.map((b) => {
                    const isChecked = selectedBranchIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        onClick={() => toggleBranchSelection(b.id)}
                        className={`text-left p-4 rounded-xl border font-bold transition-all flex items-center justify-between hover:scale-[1.01] ${
                          isChecked
                            ? "bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div>
                          <div className="text-sm">{b.name}</div>
                          <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 mt-1">
                            {b.code}
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                  {branches.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                      Please configure branches first in the "Manage Branches" tab.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold">
                {selectedEntityIds.length > 0 ? (
                  `Applying to ${selectedEntityIds.length} chosen target items.`
                ) : (
                  "Choose targets to proceed."
                )}
              </span>
              <button
                disabled={selectedEntityIds.length === 0}
                onClick={handleSaveBatchMappings}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                Assign Access Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
