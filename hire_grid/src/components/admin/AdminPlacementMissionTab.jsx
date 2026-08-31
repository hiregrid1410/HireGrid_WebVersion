import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import { SvgDiagram } from "../common/SvgDiagram";
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
  ImageIcon,
  Timer,
  ArrowLeft,
  ArrowRight,
  Shield,
  HelpCircle,
  Check
} from "lucide-react";
import DataTable from "../common/DataTable";

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
  const [wizardStep, setWizardStep] = useState(1); // 1: Basics, 2: Questions, 3: Scheduling, 4: Security, 5: Scoring, 6: Review
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
    correctAnswerIndex: 0,
    image: ""
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
      image: manualQuestion.image || "",
      svgCode: manualQuestion.image || "",
      type: currentSubject
    };

    setParsedQuestions([...parsedQuestions, newQ]);
    showToast("Question added successfully!", "success");

    // Reset manual input
    setManualQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      image: ""
    });
  };

  const handleManualImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setManualQuestion({ ...manualQuestion, image: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleQuestionListImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        const updated = [...parsedQuestions];
        updated[index] = { ...updated[index], image: dataUrl, svgCode: dataUrl, svg_code: dataUrl };
        setParsedQuestions(updated);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveQuestionListImage = (index) => {
    const updated = [...parsedQuestions];
    updated[index] = { ...updated[index], image: "", svgCode: "", svg_code: "" };
    setParsedQuestions(updated);
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
    setWizardStep(1);
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
    setWizardStep(1);

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
        await api.put(`/placement-mission/content-manager/modules/${editingModule.id}`, payload);
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
        const res = await api.post("/placement-mission/content-manager/modules", payload);
        if (res.success && res.moduleId) {
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            Placement Missions
          </h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Define Weekly Cycles, construct MCQ evaluation modules, and audit student exam telemetry.
          </p>
        </div>

        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl whitespace-nowrap scrollbar-none border border-slate-205/50 dark:border-slate-800">
          {["cycles", "modules", "attempts"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsEditingModule(false);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: CYCLES */}
      {activeTab === "cycles" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-emerald-600/5 border border-emerald-500/10 p-6 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Seasonal Operations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Recalculating rank snapshots forces synchronizing Top 10 leaderboards immediately. Starting new cycle archives current active records.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRecalculateLeaderboard}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading && "animate-spin text-emerald-500"}`} />
                <span>Sync Rankings</span>
              </button>
              <button
                onClick={() => setIsCreatingCycle(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Start New Cycle
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-450 dark:text-slate-400 text-xs font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Cycle Name</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{c.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                        {c.is_active ? "ACTIVE" : "COMPLETED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Cycle modal */}
          {isCreatingCycle && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-8 animate-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider text-sm mb-2">New Weekly Cycle</h3>
                <p className="text-xs text-slate-500 mb-4">Starting a new cycle transitions previous cycles as completed, initializing a blank active leaderboard partition.</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Cycle Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Week 4"
                      value={newCycleName}
                      onChange={(e) => setNewCycleName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => { setIsCreatingCycle(false); setNewCycleName(""); }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCycle}
                      disabled={loading}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                    >
                      Create & Activate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MODULES */}
      {activeTab === "modules" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!isEditingModule ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-emerald-600/5 border border-emerald-500/10 p-6 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Mission Tests List</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure individual testing module segments containing parsed questions.</p>
                </div>
                <button
                  onClick={startCreateModule}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assessment</span>
                </button>
              </div>

              {/* Status filtering tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl whitespace-nowrap scrollbar-none border border-slate-200/50 dark:border-slate-800 overflow-x-auto max-w-full">
                {["all", "draft", "published", "active", "scheduled", "expired"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setModulesFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${modulesFilter === f ? "bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  .map((m) => (
                    <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:scale-[1.005] transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                            {m.cycleName || "No Cycle"}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getLifecycleBadgeClass(m.lifecycleStatus)}`}>
                            {m.lifecycleStatus}
                          </span>
                          <div className="text-xs text-slate-400 font-mono ml-auto flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{m.time_limit} mins</span>
                          </div>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{m.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{m.description || "No description provided."}</p>

                        {(m.startTime || m.start_time || m.endTime || m.end_time) && (
                          <div className="text-[10px] text-slate-400 font-mono mt-3 space-y-0.5 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                            {m.startTime || m.start_time ? <div>Starts: <span className="font-semibold text-slate-500">{new Date(Number(m.startTime || m.start_time)).toLocaleString()}</span></div> : null}
                            {m.endTime || m.end_time ? <div>Ends: <span className="font-semibold text-slate-500">{new Date(Number(m.endTime || m.end_time)).toLocaleString()}</span></div> : null}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${m.is_active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>
                          {m.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditModule(m)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(m.id)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            /* Wizard creation UI */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {editingModule ? `Edit Module: ${title}` : "Create Placement Assessment"}
                </h3>
                <button
                  onClick={() => setIsEditingModule(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Steps Indicator */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-2">
                  <span>Step {wizardStep} of 6</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {wizardStep === 1 && "Assessment Basics"}
                    {wizardStep === 2 && "Question Management"}
                    {wizardStep === 3 && "Scheduling Parameters"}
                    {wizardStep === 4 && "Exam Security Controls"}
                    {wizardStep === 5 && "Scoring Configurations"}
                    {wizardStep === 6 && "Review & Confirm"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-full flex-1 border-r border-white dark:border-slate-900 last:border-0 transition-all ${
                        idx + 1 <= wizardStep ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="py-4">
                {/* Step 1: Basics */}
                {wizardStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Module Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                        placeholder="e.g. Technical Quiz"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Description</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500 resize-none"
                        placeholder="Provide details about the test..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Cycle Mapping</label>
                      <select
                        value={selectedCycleId}
                        onChange={(e) => setSelectedCycleId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-xs outline-none focus:border-emerald-500"
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
                )}

                {/* Step 2: Questions Selection */}
                {wizardStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md">
                      {["auto", "manual", "bulk-code"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setAddMode(m); setJsonError(""); }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${addMode === m ? "bg-emerald-650 dark:bg-emerald-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {m.replace("-", " ")}
                        </button>
                      ))}
                    </div>

                    {addMode === "auto" && (
                      <div className="space-y-4">
                        <textarea
                          rows={5}
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder="Paste raw MCQ question text..."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleParseQuestionsAI}
                          disabled={parsingAI}
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Activity className={`w-3.5 h-3.5 ${parsingAI && "animate-spin"}`} />
                          <span>Parse with Gemini AI</span>
                        </button>
                      </div>
                    )}

                    {addMode === "manual" && (
                      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Question Text</label>
                          <textarea
                            rows={2}
                            value={manualQuestion.question}
                            onChange={(e) => setManualQuestion({ ...manualQuestion, question: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500"
                            placeholder="Type question text..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="manualCorrectIdx"
                                checked={manualQuestion.correctAnswerIndex === i}
                                onChange={() => setManualQuestion({ ...manualQuestion, correctAnswerIndex: i })}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 bg-transparent rounded border-slate-300"
                              />
                              <input
                                type="text"
                                value={manualQuestion.options[i]}
                                onChange={(e) => {
                                  const opts = [...manualQuestion.options];
                                  opts[i] = e.target.value;
                                  setManualQuestion({ ...manualQuestion, options: opts });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-lg text-xs outline-none focus:border-emerald-500"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <label className="text-[10px] font-bold uppercase text-slate-450 dark:text-slate-500 font-mono block">Image Attachment</label>
                          <div className="flex items-center space-x-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleManualImageUpload}
                              className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-500"
                            />
                            {manualQuestion.image && (
                              <button
                                type="button"
                                onClick={() => setManualQuestion({ ...manualQuestion, image: "" })}
                                className="text-xs text-rose-500 hover:text-rose-600 font-bold"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddManualQuestion}
                          className="px-4 py-2 bg-slate-800 dark:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-750 transition-all border border-slate-750"
                        >
                          Add Question
                        </button>
                      </div>
                    )}

                    {addMode === "bulk-code" && (
                      <div className="space-y-4">
                        {jsonError && (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-mono break-all">{jsonError}</div>
                        )}
                        <textarea
                          rows={5}
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder='[{"question": "Insert question text here", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswerIndex": 1}]'
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-emerald-500 outline-none text-xs dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleParseJSON}
                          className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-sm"
                        >
                          Import JSON Array
                        </button>
                      </div>
                    )}

                    {/* Parsed questions preview list */}
                    {parsedQuestions.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center text-xs font-mono uppercase text-slate-450 dark:text-slate-500 font-bold">
                          <span>Imported Questions ({parsedQuestions.length})</span>
                          <button type="button" onClick={() => setParsedQuestions([])} className="text-rose-500 hover:text-rose-600">Clear All</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl custom-scrollbar">
                          {parsedQuestions.map((q, idx) => (
                            <div key={idx} className="text-xs space-y-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 last:border-b-0">
                              <div className="flex justify-between gap-3">
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white">{idx + 1}. {q.question}</p>
                                  {(q.image || q.svgCode || q.svg_code) && (
                                    <div className="max-w-[120px] my-1 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                                      <SvgDiagram svgCode={q.image || q.svgCode || q.svg_code} />
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setParsedQuestions(parsedQuestions.filter((_, i) => i !== idx))}
                                  className="text-rose-500 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pl-2 text-[10px] text-slate-450">
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
                )}

                {/* Step 3: Scheduling */}
                {wizardStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Start Schedule Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">End Schedule Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Duration Time Limit (Minutes)</label>
                      <input
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Security */}
                {wizardStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Publication Status</label>
                      <select
                        value={publicationStatus}
                        onChange={(e) => setPublicationStatus(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-xs outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="DRAFT">DRAFT (Visible to Content Manager / Admins Only)</option>
                        <option value="PUBLISHED">PUBLISHED (Eligible to students for premium attempts)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isActiveCheck"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded bg-transparent border-slate-350"
                      />
                      <label htmlFor="isActiveCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                        Mark this mission module as ACTIVE (Eligible to purchase/attempts)
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 5: Scoring */}
                {wizardStep === 5 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Total Marks</label>
                      <input
                        type="number"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Positive Marks / Q</label>
                      <input
                        type="number"
                        step="0.1"
                        value={marksPerQuestion}
                        onChange={(e) => setMarksPerQuestion(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Negative Marks / Q</label>
                      <input
                        type="number"
                        step="0.1"
                        value={negativeMarks}
                        onChange={(e) => setNegativeMarks(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Review */}
                {wizardStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-4 text-sm">
                      <h4 className="font-bold text-slate-800 dark:text-white">Review Assessment details</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <div className="flex justify-between">
                          <span className="text-slate-450">Assessment Title:</span>
                          <span className="font-bold text-slate-800 dark:text-white">{title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Total Questions:</span>
                          <span className="font-bold text-slate-850 dark:text-white">{parsedQuestions.length} Questions</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Duration:</span>
                          <span className="font-bold text-slate-800 dark:text-white">{timeLimit} Minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Publication status:</span>
                          <span className="font-bold text-emerald-500">{publicationStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-455">Total Marks:</span>
                          <span className="font-bold text-slate-800 dark:text-white">{totalMarks} Marks</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-455">Marking Rules:</span>
                          <span className="font-bold text-slate-800 dark:text-white">+{marksPerQuestion} / -{negativeMarks} Marks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
                <button
                  type="button"
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep((s) => s - 1)}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-slate-205 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {wizardStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveModule}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-colors inline-flex items-center space-x-1.5"
                  >
                    {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Publish Assessment</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTEMPTS */}
      {activeTab === "attempts" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-105 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-450 dark:text-slate-400 text-xs font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Student</th>
                  <th className="px-6 py-4 text-left">Module / Cycle</th>
                  <th className="px-6 py-4 text-center">Score Metrics</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {a.studentName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{a.studentEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{a.moduleTitle}</div>
                      <div className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{a.cycleName}</div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono text-xs">
                      <div className="text-emerald-500 font-bold">{a.score}% ({a.xpEarned} XP)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Time: {a.completionTime}s</div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${a.status === "submitted" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                          {a.status.toUpperCase()}
                        </span>
                        {!a.isValid && (
                          <span className="text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <XCircle className="w-3.5 h-3.5" /> INVALIDATED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {a.isValid && a.status === "submitted" ? (
                        <button
                          onClick={() => { setSelectedAttemptId(a.id); setIsInvalidating(true); }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-bold uppercase transition-colors"
                        >
                          Invalidate
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {/* Invalidation Reason Modal */}
          {isInvalidating && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-8 animate-in zoom-in duration-200">
                <div className="flex items-center gap-2 text-rose-500 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="text-lg font-bold uppercase tracking-wider font-mono text-sm">Invalidate Scored Attempt</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">Revoking this scored attempt will deduct the XP points and force recalculate all leaderboard positioning snapshot matrices.</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Reason details</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Tab switching violations flagged"
                      value={invalidationReason}
                      onChange={(e) => setInvalidationReason(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => { setIsInvalidating(false); setSelectedAttemptId(null); setInvalidationReason(""); }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInvalidateAttempt}
                      disabled={loading}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                    >
                      Invalidate Attempt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
