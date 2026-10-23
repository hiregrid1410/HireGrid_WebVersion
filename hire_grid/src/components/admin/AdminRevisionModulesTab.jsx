import { PlatformSelector, PlatformBadge, PlatformFilterTabs } from "./PlatformSelector";
import React, { useState, useEffect, useMemo } from "react";
import { 
  RotateCcw, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Database, 
  Save, 
  X,
  Search,
  Check,
  ChevronDown
} from "lucide-react";
import { api } from "../../lib/api";

export function AdminRevisionModulesTab() {
  const [revisionModules, setRevisionModules] = useState([]);
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    branchId: "",
    subjectId: "",
    topicId: "",
    sourceTopicId: "",
    sourceModuleIds: [],
    mcqCount: 50,
    selectionMode: "random",
    isActive: true,
    platform: "both",
  });
  const [platformFilter, setPlatformFilter] = useState("all");

  const [poolSize, setPoolSize] = useState(0);
  const [calculatingPool, setCalculatingPool] = useState(false);
  const [branchesList, setBranchesList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revRes, hierRes, modRes, bRes] = await Promise.all([
        api.get("/admin/revision-modules").catch(() => ({ revisionModules: [] })),
        api.get("/hierarchy-nodes").catch(() => ({ nodes: [] })),
        api.get("/modules").catch(() => ({ modules: [] })),
        api.get("/branches").catch(() => ({ branches: [] })),
      ]);

      const revList = revRes?.revisionModules || revRes?.data?.revisionModules || [];
      const hierList = hierRes?.nodes || hierRes?.data?.nodes || [];
      const modList = modRes?.modules || modRes?.data?.modules || [];
      const bList = bRes?.branches || bRes?.data?.branches || [];

      setRevisionModules(revList);
      setHierarchyNodes(hierList);
      setModules(modList);
      setBranchesList(bList);
    } catch (err) {
      console.error("Error loading revision modules data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (text, type = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Combine hierarchy_nodes branches with branches table
  const branches = useMemo(() => {
    const fromNodes = hierarchyNodes.filter(
      (n) => n.type === "general_branch" || !n.parentId || n.parentId === "null"
    );
    const map = new Map();
    fromNodes.forEach((b) => map.set(b.id, b));
    branchesList.forEach((b) => {
      if (!map.has(b.id)) {
        map.set(b.id, { id: b.id, name: b.name, type: "general_branch" });
      }
    });
    return Array.from(map.values());
  }, [hierarchyNodes, branchesList]);

  // All subjects
  const allSubjects = useMemo(() => {
    return hierarchyNodes.filter(
      (n) => n.type === "general_subject" || n.type === "subject"
    );
  }, [hierarchyNodes]);

  // Subjects filtered by selected branch
  const filteredSubjects = useMemo(() => {
    if (!formData.branchId) return allSubjects;
    return allSubjects.filter(
      (n) => String(n.parentId) === String(formData.branchId)
    );
  }, [allSubjects, formData.branchId]);

  // All topics + modules as available pools
  const allTopics = useMemo(() => {
    const topicNodes = hierarchyNodes.filter(
      (n) => n.type === "general_topic" || n.type === "topic"
    );
    const map = new Map();
    topicNodes.forEach((t) => map.set(t.id, { ...t, isModule: false }));

    modules.forEach((m) => {
      if (!map.has(m.id)) {
        map.set(m.id, {
          id: m.id,
          name: m.title || m.name || "Learning Module",
          type: "module",
          parentId: m.parentId,
          isModule: true,
        });
      }
    });

    return Array.from(map.values());
  }, [hierarchyNodes, modules]);

  // Topics filtered by selected subject (or branch)
  const filteredTopics = useMemo(() => {
    if (formData.subjectId) {
      const direct = allTopics.filter(
        (t) => String(t.parentId) === String(formData.subjectId)
      );
      return direct.length > 0 ? direct : allTopics;
    }
    if (formData.branchId) {
      const allowedSubjectIds = new Set(filteredSubjects.map((s) => s.id));
      const direct = allTopics.filter((t) => allowedSubjectIds.has(t.parentId));
      return direct.length > 0 ? direct : allTopics;
    }
    return allTopics;
  }, [allTopics, filteredSubjects, formData.subjectId, formData.branchId]);

  const availableModules = useMemo(() => {
    if (!formData.topicId) return modules;
    return modules.filter(
      (m) =>
        String(m.parentId) === String(formData.topicId) ||
        (formData.subjectId && String(m.parentId) === String(formData.subjectId)) ||
        m.id === formData.topicId
    );
  }, [modules, formData.topicId, formData.subjectId]);

  // Update live pool size whenever topic or sourceModuleIds change
  useEffect(() => {
    const fetchPoolSize = async () => {
      const topicId = formData.sourceTopicId || formData.topicId;
      if (!topicId && formData.sourceModuleIds.length === 0) {
        setPoolSize(0);
        return;
      }
      setCalculatingPool(true);
      try {
        const res = await api
          .get("/admin/revision-modules/pool-size", {
            params: {
              topicId,
              moduleIds: formData.sourceModuleIds.join(","),
            },
          })
          .catch(() => ({ poolCount: 0 }));

        const pool = res?.poolCount ?? res?.data?.poolCount ?? 0;
        setPoolSize(pool);
      } catch (err) {
        console.warn("Failed to calculate pool size:", err);
      } finally {
        setCalculatingPool(false);
      }
    };

    fetchPoolSize();
  }, [formData.topicId, formData.sourceTopicId, formData.sourceModuleIds]);

  const handleOpenCreate = () => {
    setEditingId(null);
    const firstPoolItem = allTopics[0] || null;
    let initialBranchId = branches[0]?.id || "";
    let initialSubjectId = "";
    let initialTopicId = "";
    let initialTitle = "";

    if (firstPoolItem) {
      initialTopicId = firstPoolItem.id;
      initialTitle = `${firstPoolItem.name} - Spaced Revision`;
      const parentSub = allSubjects.find((s) => s.id === firstPoolItem.parentId);
      if (parentSub) {
        initialSubjectId = parentSub.id;
        initialBranchId = parentSub.parentId || initialBranchId;
      }
    } else {
      initialTitle = "Aptitude - Spaced Revision";
    }

    setFormData({
      title: initialTitle,
      branchId: initialBranchId,
      subjectId: initialSubjectId,
      topicId: initialTopicId,
      sourceTopicId: initialTopicId,
      sourceModuleIds: [],
      mcqCount: 50,
      selectionMode: "random",
      isActive: true,
      platform: "both",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rm) => {
    setEditingId(rm.id);
    setFormData({
      title: rm.title || "",
      branchId: rm.branchId || "",
      subjectId: rm.subjectId || "",
      topicId: rm.topicId || "",
      sourceTopicId: rm.sourceTopicId || rm.topicId || "",
      sourceModuleIds: Array.isArray(rm.sourceModuleIds) ? rm.sourceModuleIds : [],
      mcqCount: rm.mcqCount || 50,
      selectionMode: rm.selectionMode || "random",
      isActive: rm.isActive !== undefined ? rm.isActive : true,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this revision module?")) return;
    try {
      await api.delete(`/admin/revision-modules/${id}`);
      showStatus("Revision module deleted successfully.");
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
      showStatus("Failed to delete revision module.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showStatus("Title is required.", "error");
      return;
    }

    const fallbackTopicId = allTopics[0]?.id || formData.branchId || "general_topic";
    const chosenTopicId = formData.topicId || formData.sourceTopicId || fallbackTopicId;

    setSaving(true);
    try {
      await api.post("/admin/revision-modules", {
        id: editingId,
        ...formData,
        topicId: chosenTopicId,
        sourceTopicId: chosenTopicId,
        branchId: formData.branchId || branches[0]?.id || null,
        subjectId: formData.subjectId || null,
      });
      showStatus(editingId ? "Revision module updated!" : "Revision module created!");
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Save error:", err);
      showStatus("Failed to save revision module.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleModuleSelection = (modId) => {
    setFormData((prev) => {
      const exists = prev.sourceModuleIds.includes(modId);
      return {
        ...prev,
        sourceModuleIds: exists
          ? prev.sourceModuleIds.filter((id) => id !== modId)
          : [...prev.sourceModuleIds, modId],
      };
    });
  };

  const filteredModules = revisionModules.filter((rm) => {
    const q = searchQuery.toLowerCase();
      const displayedRevisionModules = revisionModules.filter(rm => platformFilter === "all" || (rm.platform || "both") === platformFilter);

  return (
      rm.title?.toLowerCase().includes(q) ||
      rm.branchName?.toLowerCase().includes(q) ||
      rm.subjectName?.toLowerCase().includes(q) ||
      rm.topicName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Spaced Repetition Revision Modules
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated Day 1, Day 3, and Day 7 spaced-repetition modules with dynamic random MCQ sampling.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Revision Module
        </button>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            statusMessage.type === "error"
              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
          }`}
        >
          {statusMessage.type === "error" ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by title, branch, subject, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-semibold text-xs tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Title & Hierarchy</th>
                <th className="px-6 py-4">Topic / Source</th>
                <th className="px-6 py-4">Target MCQs</th>
                <th className="px-6 py-4">MCQ Pool Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    Loading revision modules...
                  </td>
                </tr>
              ) : filteredModules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No revision modules configured yet. Click "Create Revision Module" above to add one.
                  </td>
                </tr>
              ) : (
                filteredModules.map((rm) => (
                  <tr key={rm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{rm.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {rm.branchName || "General Branch"} &rsaquo; {rm.subjectName || "Subject"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium text-xs">
                        <Layers className="w-3.5 h-3.5" />
                        {rm.topicName || "Topic Pool"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {rm.mcqCount || 50} MCQs
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-xs">
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        <span className={(rm.sourcePoolSize || 0) < (rm.mcqCount || 50) ? "text-amber-500 font-semibold" : "text-emerald-500 font-semibold"}>
                          {rm.sourcePoolSize || 0} questions available
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          rm.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {rm.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(rm)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rm.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Edit Revision Module" : "Create Revision Module"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hierarchy Cascading Selection */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  1. Hierarchy & Source Pool Selection
                </div>

                {/* Step 1: Branch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branch (Optional filter)
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setFormData({
                        ...formData,
                        branchId: bId,
                        subjectId: "",
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject (Optional filter)
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const subNode = allSubjects.find((s) => s.id === sId);
                      setFormData({
                        ...formData,
                        subjectId: sId,
                        branchId: subNode?.parentId || formData.branchId,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">All Subjects</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3: Topic / Module (Source Pool) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Topic / Source Pool *
                  </label>
                  <select
                    value={formData.topicId}
                    onChange={(e) => {
                      const tId = e.target.value;
                      const chosenTop = allTopics.find((t) => t.id === tId);
                      const parentSub = allSubjects.find((s) => s.id === chosenTop?.parentId);
                      const nextTitle = chosenTop?.name ? `${chosenTop.name} - Spaced Revision` : formData.title;

                      setFormData({
                        ...formData,
                        title: formData.title ? formData.title : nextTitle,
                        topicId: tId,
                        sourceTopicId: tId,
                        subjectId: parentSub ? parentSub.id : formData.subjectId,
                        branchId: parentSub?.parentId || formData.branchId,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Topic / Module</option>
                    {filteredTopics.map((t) => {
                      const parentSub = allSubjects.find((s) => s.id === t.parentId);
                      const label = parentSub ? `${parentSub.name} › ${t.name}` : t.name;
                      return (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  2. Revision Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Machines - Spaced Revision"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Pool Size & MCQ Count */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Available MCQ Pool Size:</span>
                  <span className={`font-bold ${poolSize === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {calculatingPool ? "Calculating pool..." : `${poolSize} MCQs in selected topic pool`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Target Revision Assessment Size (MCQ Count)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={formData.mcqCount}
                    onChange={(e) => setFormData({ ...formData, mcqCount: parseInt(e.target.value, 10) || 50 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Default is 50. During each student attempt, 50 questions will be sampled randomly with preference for un-seen MCQs.
                  </p>
                </div>
              </div>

              {/* Optional: Filter by specific sub-modules */}
              {availableModules.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Filter to Specific Sub-Modules (Optional)
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-xl border border-slate-800 bg-slate-950/50 custom-scrollbar">
                    {availableModules.map((mod) => {
                      const isSelected = formData.sourceModuleIds.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModuleSelection(mod.id)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-indigo-950/80 text-indigo-200 border border-indigo-700/50 font-medium"
                              : "hover:bg-slate-800/60 text-slate-300"
                          }`}
                        >
                          <span>{mod.title}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-slate-300">
                  Revision Module Status
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : editingId ? "Update Module" : "Create Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
