import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import {
  Trophy,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ListFilter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Activity,
  Award,
  UploadCloud,
  ImageIcon
} from "lucide-react";

export function AdminPlacementMissionTab({ userName }) {
  const [activeTab, setActiveTab] = useState("cycles"); // 'cycles' | 'modules' | 'attempts'
  const [loading, setLoading] = useState(false);

  // Cycles State
  const [cycles, setCycles] = useState([]);
  const [newCycleName, setNewCycleName] = useState("");
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);

  // Modules State
  const [modules, setModules] = useState([]);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [totalMarks, setTotalMarks] = useState(100);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [isActive, setIsActive] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  
  // MCQ Questions State
  const [rawText, setRawText] = useState("");
  const [parsingAI, setParsingAI] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);

  // Question Editor Tab States
  const [addMode, setAddMode] = useState("auto"); // 'auto' | 'manual' | 'bulk-code'
  const [currentSubject, setCurrentSubject] = useState("Technical");
  const [manualQuestion, setManualQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0
  });
  const [jsonError, setJsonError] = useState("");

  // Placement Mission Lifecycle & Filtering States
  const [modulesFilter, setModulesFilter] = useState("all");
  const [publicationStatus, setPublicationStatus] = useState("DRAFT");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Attempts State
  const [attempts, setAttempts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [invalidationReason, setInvalidationReason] = useState("");

  // ================= DATA FETCHING =================

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/placement-mission/content-manager/cycles");
      if (res.success) {
        setCycles(res.cycles || []);
      }
    } catch (err) {
      showToast("Error loading cycles: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/placement-mission/content-manager/modules");
      if (res.success) {
        setModules(res.modules || []);
      }
    } catch (err) {
      showToast("Error loading modules: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/placement-mission/content-manager/attempts?page=${page}&limit=15`);
      if (res.success) {
        setAttempts(res.attempts || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast("Error loading attempts: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "cycles") fetchCycles();
    else if (activeTab === "modules") {
      fetchCycles();
      fetchModules();
    }
    else if (activeTab === "attempts") fetchAttempts();
  }, [activeTab, page]);

  // ================= CYCLE ACTIONS =================

  const handleCreateCycle = async () => {
    if (!newCycleName.trim()) {
      showToast("Cycle name is required", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/placement-mission/content-manager/cycles", { name: newCycleName });
      if (res.success) {
        showToast(res.message || "New weekly cycle started!", "success");
        setNewCycleName("");
        setIsCreatingCycle(false);
        fetchCycles();
      }
    } catch (err) {
      showToast("Error starting cycle: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.post("/placement-mission/content-manager/recalculate-leaderboard");
      if (res.success) {
        showToast(res.message || "Leaderboard ranking snapshots updated!", "success");
      }
    } catch (err) {
      showToast("Error recalculating leaderboard: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= MODULE ACTIONS =================

  const handleParseQuestionsAI = async () => {
    if (!rawText.trim()) {
      showToast("Please enter raw text containing MCQ questions.", "error");
      return;
    }

    try {
      setParsingAI(true);
      const data = await api.post("/parse-mcq", { text: rawText });
      if (data.success && data.questions) {
        setParsedQuestions([...parsedQuestions, ...data.questions]);
        setRawText("");
        showToast(`Parsed ${data.questions.length} questions successfully using Gemini!`, "success");
      } else {
        showToast("AI failed to parse questions. Check input format.", "error");
      }
    } catch (err) {
      showToast("AI parsing failed: " + err.message, "error");
    } finally {
      setParsingAI(false);
    }
  };

  const handleAddManualQuestion = () => {
    if (!manualQuestion.question.trim()) {
      showToast("Question text is required.", "error");
      return;
    }
    for (let i = 0; i < 4; i++) {
      if (!manualQuestion.options[i].trim()) {
        showToast(`Option ${String.fromCharCode(65 + i)} is required.`, "error");
        return;
      }
    }

    const newQ = {
      question: manualQuestion.question.trim(),
      options: manualQuestion.options.map(o => o.trim()),
      correctAnswerIndex: manualQuestion.correctAnswerIndex,
      type: currentSubject
    };

    setParsedQuestions([...parsedQuestions, newQ]);
    showToast("Question added successfully!", "success");

    // Reset manual input
    setManualQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0
    });
  };

  const handleParseJSON = () => {
    setJsonError("");
    try {
      if (!rawText || !rawText.trim()) {
        throw new Error("JSON text is empty. Please paste a valid JSON array of questions.");
      }

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        let sanitizedText = rawText;
        const mathCommands = [
          "frac", "cdot", "times", "int", "partial", "infty", "begin", "end",
          "omega", "pi", "Delta", "nabla", "alpha", "beta", "gamma", "theta"
        ];
        mathCommands.forEach((cmd) => {
          const regex = new RegExp(`(?<!\\\\)\\\\${cmd}\\b`, "g");
          sanitizedText = sanitizedText.replace(regex, `\\\\${cmd}`);
        });

        try {
          parsed = JSON.parse(sanitizedText);
        } catch (e2) {
          try {
            parsed = Function(`"use strict"; return (${rawText})`)();
          } catch (e3) {
            throw new Error(`JSON Syntax Error: Invalid JSON.\nReason: ${err.message}`);
          }
        }
      }

      if (!Array.isArray(parsed)) {
        throw new Error("Bulk upload only accepts a top-level JSON array [ ... ].");
      }

      if (parsed.length === 0) {
        throw new Error("JSON array is empty. At least 1 question is required.");
      }

      const formatted = parsed.map((q, idx) => {
        const rowNum = idx + 1;
        if (!q || typeof q !== "object" || Array.isArray(q)) {
          throw new Error(`Row ${rowNum}: Item must be a valid JSON object.`);
        }
        if (!q.question || !q.question.trim()) {
          throw new Error(`Row ${rowNum}: Missing question text.`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Row ${rowNum}: Expected exactly 4 options inside array.`);
        }
        
        let correctIdx = q.correctAnswerIndex;
        if (correctIdx === undefined) {
          correctIdx = q.correct_option_index;
        }
        if (correctIdx === undefined && q.correct_answer) {
          const letterToIdxMap = { A: 0, B: 1, C: 2, D: 3 };
          correctIdx = letterToIdxMap[q.correct_answer.toUpperCase()];
        }
        if (correctIdx === undefined || correctIdx < 0 || correctIdx > 3) {
          throw new Error(`Row ${rowNum}: Missing or invalid correctAnswerIndex (0-3).`);
        }

        return {
          question: q.question.trim(),
          options: q.options.map(opt => String(opt).trim()),
          correctAnswerIndex: Number(correctIdx),
          type: q.type || currentSubject
        };
      });

      setParsedQuestions([...parsedQuestions, ...formatted]);
      setRawText("");
      showToast(`Imported ${formatted.length} questions successfully!`, "success");
    } catch (err) {
      setJsonError(err.message);
      showToast("JSON Import failed: " + err.message, "error");
    }
  };

  const startCreateModule = () => {
    setEditingModule(null);
    setTitle("");
    setDescription("");
    setTimeLimit(30);
    setTotalMarks(100);
    setMarksPerQuestion(1);
    setNegativeMarks(0.5);
    setIsActive(true);
    setPublicationStatus("DRAFT");
    setStartTime("");
    setEndTime("");
    const activeCycle = cycles.find(c => c.is_active);
    setSelectedCycleId(activeCycle ? activeCycle.id : "");
    setRawText("");
    setParsedQuestions([]);
    setIsEditingModule(true);
  };

  const startEditModule = async (m) => {
    setEditingModule(m);
    setTitle(m.title);
    setDescription(m.description || "");
    setTimeLimit(m.time_limit || 30);
    setTotalMarks(m.total_marks || 100);
    setMarksPerQuestion(m.marks_per_question || 1);
    setNegativeMarks(m.negative_marks || 0.5);
    setIsActive(m.is_active !== undefined ? m.is_active : true);
    setPublicationStatus(m.publicationStatus || m.publication_status || "DRAFT");

    const mapTimestampToInputVal = (timestamp) => {
      if (!timestamp) return "";
      const d = new Date(Number(timestamp));
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartTime(mapTimestampToInputVal(m.startTime || m.start_time));
    setEndTime(mapTimestampToInputVal(m.endTime || m.end_time));
    setSelectedCycleId(m.cycle_id || "");
    setRawText("");
    setParsedQuestions([]);

    // Lazy load existing questions
    try {
      const res = await api.get(`/modules/${m.id}/questions`);
      if (res.success && res.questions) {
        const mapped = res.questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex !== null ? q.correctAnswerIndex : q.correct_answer_index,
          svgCode: q.svgCode || q.svg_code
        }));
        setParsedQuestions(mapped);
      }
    } catch (err) {
      showToast("Failed to load questions: " + err.message, "error");
    }

    setIsEditingModule(true);
  };

  const handleSaveModule = async () => {
    if (!title.trim()) {
      showToast("Module title is required", "error");
      return;
    }
    if (!selectedCycleId) {
      showToast("Please select a weekly cycle mapping", "error");
      return;
    }

    const startMs = startTime ? new Date(startTime).getTime() : null;
    const endMs = endTime ? new Date(endTime).getTime() : null;

    const payload = {
      title,
      description,
      timeLimit: Number(timeLimit) || 30,
      totalMarks: Number(totalMarks) || 100,
      marksPerQuestion: Number(marksPerQuestion) || 1,
      negativeMarks: Number(negativeMarks) || 0.5,
      is_active: isActive,
      cycle_id: selectedCycleId,
      publicationStatus,
      startTime: startMs,
      endTime: endMs,
      questions: parsedQuestions
    };

    try {
      setLoading(true);
      if (editingModule) {
        // Update Module API
        await api.put(`/placement-mission/content-manager/modules/${editingModule.id}`, payload);
        // Also save questions by calling standard modules POST route to update SQL questions tables
        const completeModuleObj = {
          id: editingModule.id,
          title,
          description,
          timeLimit: Number(timeLimit),
          totalMarks: Number(totalMarks),
          marksPerQuestion: Number(marksPerQuestion),
          negativeMarks: Number(negativeMarks),
          isPremium: true,
          isActive,
          publicationStatus,
          displayOrder: editingModule.display_order || 0,
          questions: parsedQuestions,
          moduleType: "general"
        };
        await api.post("/modules", completeModuleObj);
        showToast("Placement mission module updated successfully!", "success");
      } else {
        // Create Module API
        const res = await api.post("/placement-mission/content-manager/modules", payload);
        if (res.success && res.moduleId) {
          // Save parsed questions array using standard modules POST API
          const completeModuleObj = {
            id: res.moduleId,
            title,
            description,
            timeLimit: Number(timeLimit),
            totalMarks: Number(totalMarks),
            marksPerQuestion: Number(marksPerQuestion),
            negativeMarks: Number(negativeMarks),
            isPremium: true,
            isActive,
            publicationStatus,
            displayOrder: 0,
            questions: parsedQuestions,
            moduleType: "general"
          };
          await api.post("/modules", completeModuleObj);
          showToast("Placement mission module created successfully!", "success");
        }
      }
      setIsEditingModule(false);
      fetchModules();
    } catch (err) {
      showToast("Failed to save module: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this placement mission module? This will delete all student attempts and questions under it.")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/placement-mission/content-manager/modules/${id}`);
      showToast("Mission module deleted.", "success");
      fetchModules();
    } catch (err) {
      showToast("Error deleting module: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ================= ATTEMPT ACTIONS =================

  const handleInvalidateAttempt = async () => {
    if (!invalidationReason.trim()) {
      showToast("Invalidation reason is required.", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await api.patch(`/placement-mission/content-manager/attempts/${selectedAttemptId}/invalidate`, {
        reason: invalidationReason
      });
      if (res.success) {
        showToast(res.message || "Attempt invalidated and rankings recalculated.", "success");
        setIsInvalidating(false);
        setSelectedAttemptId(null);
        setInvalidationReason("");
        fetchAttempts();
      }
    } catch (err) {
      showToast("Failed to invalidate attempt: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center">
            <Trophy className="h-7 w-7 mr-3 text-emerald-500" />
            Placement Mission Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage weekly cycles, configure placement mission modules, and review/audit attempts.
          </p>
        </div>

        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/85">
          {["cycles", "modules", "attempts"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsEditingModule(false);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all uppercase
                ${activeTab === tab
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1: CYCLES MANAGEMENT ================= */}
      {activeTab === "cycles" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-600/5 border border-emerald-500/10 p-6 rounded-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                Season & Leaderboard Recalculation
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Start a new cycle to reset the leaderboard to 0 and partition student submissions. Recalculate rankings to force sync the Top 10 snapshots instantly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRecalculateLeaderboard}
                disabled={loading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center space-x-2 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Recalculate Leaderboard</span>
              </button>
              <button
                onClick={() => setIsCreatingCycle(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center space-x-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Cycle</span>
              </button>
            </div>
          </div>

          {/* Start Cycle Modal */}
          {isCreatingCycle && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  Start New Weekly Cycle
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will mark the current active cycle as completed/inactive. All future submissions will belong to the new cycle. The active leaderboard will show 0 participants until attempts are submitted.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Cycle Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Week 2"
                    value={newCycleName}
                    onChange={(e) => setNewCycleName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none transition-colors dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsCreatingCycle(false);
                      setNewCycleName("");
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCycle}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    Create & Activate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cycles List */}
          <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Cycle Name
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {c.is_active ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PLACEMENT MODULES MANAGEMENT ================= */}
      {activeTab === "modules" && (
        <div className="space-y-6">
          {!isEditingModule ? (
            <>
              <div className="flex justify-between items-center bg-emerald-600/5 border border-emerald-500/10 p-5 rounded-2xl">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Placement Mission Modules List
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add MCQ testing modules mapped to cycles.
                  </p>
                </div>
                <button
                  onClick={startCreateModule}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Mission Module</span>
                </button>
              </div>
               <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 my-4 max-w-xl">
                {["all", "draft", "published", "active", "scheduled", "expired"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setModulesFilter(tab)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                      ${modulesFilter === tab
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {modules
                  .filter((m) => {
                    if (modulesFilter === "all") return true;
                    if (modulesFilter === "draft") return m.lifecycleStatus === "DRAFT";
                    if (modulesFilter === "published") return m.lifecycleStatus !== "DRAFT";
                    if (modulesFilter === "active") return m.lifecycleStatus === "ACTIVE";
                    if (modulesFilter === "scheduled") return m.lifecycleStatus === "SCHEDULED";
                    if (modulesFilter === "expired") return m.lifecycleStatus === "EXPIRED";
                    return true;
                  })
                  .map((m) => {
                    const getLifecycleBadgeClass = (status) => {
                      switch (status) {
                        case "DRAFT":
                          return "bg-slate-500/10 border border-slate-500/30 text-slate-400";
                        case "SCHEDULED":
                          return "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400";
                        case "ACTIVE":
                          return "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
                        case "EXPIRED":
                          return "bg-rose-500/10 border border-rose-500/30 text-rose-400";
                        default:
                          return "bg-slate-500/10 border border-slate-500/30 text-slate-400";
                      }
                    };

                    return (
                      <div
                        key={m.id}
                        className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3 gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                              {m.cycleName || "Unassigned Cycle"}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getLifecycleBadgeClass(m.lifecycleStatus)}`}>
                              {m.lifecycleStatus}
                            </span>
                            <div className="flex items-center text-xs text-slate-500 font-mono ml-auto">
                              <Timer className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                              <span>{m.time_limit} mins</span>
                            </div>
                          </div>

                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                            {m.title}
                          </h3>

                          {/* Start / End date display */}
                          {(m.startTime || m.endTime || m.start_time || m.end_time) && (
                            <div className="text-[10px] font-mono text-slate-500 space-y-0.5 my-2">
                              {(m.startTime || m.start_time) && (
                                <div>Starts: <span className="text-slate-700 dark:text-slate-300">{new Date(Number(m.startTime || m.start_time)).toLocaleString('en-IN')}</span></div>
                              )}
                              {(m.endTime || m.end_time) && (
                                <div>Ends: <span className="text-slate-700 dark:text-slate-300">{new Date(Number(m.endTime || m.end_time)).toLocaleString('en-IN')}</span></div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-slate-500 leading-relaxed max-w-md line-clamp-3">
                            {m.description || "No description provided."}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border
                            ${m.is_active
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                            }`}
                          >
                            {m.is_active ? "Active" : "Inactive"}
                          </span>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditModule(m)}
                              className="p-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                              title="Edit Module & Questions"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModule(m.id)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors border border-rose-500/20"
                              title="Delete Module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            /* Module Creator / Editor Interface */
            <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  {editingModule ? `Edit Module: ${title}` : "Create Placement Mission Module"}
                </h3>
                <button
                  onClick={() => setIsEditingModule(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold uppercase text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Pane: Config fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Module Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none transition-colors dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none transition-colors dark:text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Time Limit (Minutes)
                      </label>
                      <input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Cycle Mapping
                      </label>
                      <select
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      >
                        <option value="">Select Cycle...</option>
                        {cycles.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.is_active ? "(Active)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Start Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        End Time (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Publication Status
                    </label>
                    <select
                      value={publicationStatus}
                      onChange={(e) => setPublicationStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none dark:text-white text-xs font-bold"
                    >
                      <option value="DRAFT">DRAFT (Visible to Admin Only)</option>
                      <option value="PUBLISHED">PUBLISHED (Visible to Students)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Marks
                      </label>
                      <input
                        type="number"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Positive Marks
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={marksPerQuestion}
                        onChange={(e) => setMarksPerQuestion(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Negative Marks
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={negativeMarks}
                        onChange={(e) => setNegativeMarks(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-slate-300 select-none cursor-pointer">
                      Module Status is Active (Eligible for purchase/attempts)
                    </label>
                  </div>
                </div>

                {/* Right Pane: AI MCQ Parser & JSON Import */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-6 pt-6 md:pt-0">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                      Add Questions
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Configure module test questions using AI generation, manual entries, or bulk JSON imports.
                    </p>
                  </div>

                  {/* Add mode tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setAddMode("auto"); setJsonError(""); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                        ${addMode === "auto"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      Auto-Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddMode("manual"); setJsonError(""); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                        ${addMode === "manual"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      Manual Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddMode("bulk-code"); setJsonError(""); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                        ${addMode === "bulk-code"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      Code Import
                    </button>
                  </div>

                  {/* Mode-specific content */}
                  {addMode === "auto" && (
                    <div className="space-y-4">
                      <textarea
                        rows={6}
                        placeholder="Q1. What is 2+2?
A) 3
B) 4
C) 5
Answer: B"
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none transition-colors dark:text-white resize-none font-mono text-xs"
                      />

                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-slate-500">
                          Structured Questions: <strong className="text-emerald-500 font-bold">{parsedQuestions.length}</strong>
                        </span>

                        <button
                          type="button"
                          onClick={handleParseQuestionsAI}
                          disabled={parsingAI}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
                        >
                          <Activity className={`w-3.5 h-3.5 ${parsingAI ? "animate-spin" : ""}`} />
                          <span>{parsingAI ? "PARSING..." : "Parse with Gemini AI"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {addMode === "manual" && (
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Question Text
                        </label>
                        <textarea
                          rows={2}
                          value={manualQuestion.question}
                          onChange={(e) => setManualQuestion({ ...manualQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white"
                          placeholder="Type question text..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map((idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="manualCorrect"
                              checked={manualQuestion.correctAnswerIndex === idx}
                              onChange={() => setManualQuestion({ ...manualQuestion, correctAnswerIndex: idx })}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                            />
                            <input
                              type="text"
                              value={manualQuestion.options[idx]}
                              onChange={(e) => {
                                const newOpts = [...manualQuestion.options];
                                newOpts[idx] = e.target.value;
                                setManualQuestion({ ...manualQuestion, options: newOpts });
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-emerald-500 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddManualQuestion}
                          className="px-4 py-2 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-700 dark:border-slate-700"
                        >
                          Add Question
                        </button>
                      </div>
                    </div>
                  )}

                  {addMode === "bulk-code" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Paste JSON array of questions</span>
                        <button
                          type="button"
                          onClick={() => {
                            const promptText = `Generate a JSON array of placement MCQ questions in this exact structure:
[
  {
    "question": "Insert question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswerIndex": 1
  }
]`;
                            navigator.clipboard.writeText(promptText);
                            showToast("JSON Prompt template copied to clipboard!", "success");
                          }}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-200 dark:border-indigo-800/50 flex items-center space-x-1"
                        >
                          <UploadCloud className="w-3 h-3" />
                          <span>Copy Prompt for External AI</span>
                        </button>
                      </div>

                      {jsonError && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-mono whitespace-pre-wrap leading-tight">
                          {jsonError}
                        </div>
                      )}

                      <textarea
                        rows={6}
                        placeholder='[{"question": "What is 2+2?", "options": ["3", "4", "5", "6"], "correctAnswerIndex": 1}]'
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none transition-colors dark:text-white resize-none font-mono text-xs"
                      />

                      <button
                        type="button"
                        onClick={handleParseJSON}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                      >
                        Import JSON Code
                      </button>
                    </div>
                  )}

                  {/* Summary of all structured questions */}
                  {parsedQuestions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>Structured Questions: <strong className="text-emerald-500 font-mono font-bold">{parsedQuestions.length}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Clear all structured questions?")) {
                              setParsedQuestions([]);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-600 text-[10px]"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 custom-scrollbar">
                        {parsedQuestions.map((q, idx) => (
                          <div key={idx} className="text-xs space-y-1 border-b border-slate-200 dark:border-slate-800/80 pb-2 last:border-b-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className="font-bold text-slate-700 dark:text-slate-300">
                                {idx + 1}. {q.question}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = parsedQuestions.filter((_, qIdx) => qIdx !== idx);
                                  setParsedQuestions(updated);
                                }}
                                className="text-rose-500 hover:text-rose-600 text-[10px] uppercase font-bold"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pl-2 text-[10px] text-slate-500">
                              {q.options?.map((opt, oIdx) => (
                                <span key={oIdx} className={Number(q.correctAnswerIndex) === oIdx ? "text-emerald-500 font-bold" : ""}>
                                  {String.fromCharCode(65 + oIdx)}) {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditingModule(false)}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModule}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 inline-flex items-center space-x-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Module</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: ATTEMPTS AUDIT LOGS ================= */}
      {activeTab === "attempts" && (
        <div className="space-y-6">
          <div className="glass-panel border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            {attempts.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">No student attempts recorded for this cycle yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Module / Cycle
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Metrics
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Status / Validity
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {attempts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center">
                            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {a.studentName}
                          </div>
                          <div className="text-xs text-slate-500">{a.studentEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{a.moduleTitle}</div>
                          <div className="text-xs text-slate-400">{a.cycleName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono">
                          <div className="text-emerald-500 font-bold">{a.score}% ({a.xpEarned} XP)</div>
                          <div className="text-xs text-slate-400">Duration: {a.completionTime}s</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border
                              ${a.status === "submitted"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                : a.status === "active"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                              }`}
                            >
                              {a.status}
                            </span>
                            {!a.isValid && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-600/10 border border-rose-600/30 text-rose-500 inline-flex items-center" title={`By ${a.invalidatedBy}: ${a.invalidatedReason}`}>
                                <XCircle className="w-3 h-3 mr-1" />
                                Invalidated
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {a.isValid && a.status === "submitted" ? (
                            <button
                              onClick={() => {
                                setSelectedAttemptId(a.id);
                                setIsInvalidating(true);
                              }}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                            >
                              Invalidate
                            </button>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase rounded-xl disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase rounded-xl disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Invalidate Attempt Confirmation Dialog */}
          {isInvalidating && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center text-rose-500 gap-2 mb-2">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-lg font-black uppercase tracking-wider">
                    Invalidate Attempt
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to invalidate this scored placement attempt? This action cannot be undone. The XP earned will be deducted, and leaderboard ranking snapshots will recalculate immediately.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Reason for Invalidation
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Integrity violation / Screen share detected"
                    value={invalidationReason}
                    onChange={(e) => setInvalidationReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none transition-colors dark:text-white resize-none text-xs"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsInvalidating(false);
                      setSelectedAttemptId(null);
                      setInvalidationReason("");
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvalidateAttempt}
                    disabled={loading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    Invalidate Scored Attempt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
