import React, { useState, useEffect, useRef } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  BookOpen,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  FileText,
  Timer,
  Flag,
  Flame,
  Zap,
  Award,
  Bell,
  Building2,
  Info,
  ShieldCheck,
  Lock,
  MessageSquare,
  CreditCard,
  Maximize,
  ShieldAlert,
  AlertTriangle,
  X,
  ListFilter,
} from "lucide-react";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { useTheme } from "../../ThemeContext";
import { PremiumPurchaseView } from "../../components/student/PremiumPurchaseView";
import { SvgDiagram } from "../../components/common/SvgDiagram";
import { StudentHierarchyView } from "../../components/student/StudentHierarchyView";
import { PlacementMissionView } from "../../components/student/PlacementMissionView";
import { hasAccess, isPlanVisibleToStudent } from "../../lib/accessControl";

// Redesigned Student Views & CSS
import "../../components/student/student.css";
import { StudentSidebar } from "../../components/student/StudentSidebar";
import { StudentHeader } from "../../components/student/StudentHeader";
import { StudentDashboardView } from "../../components/student/StudentDashboardView";
import { StudentProfileView } from "../../components/student/StudentProfileView";
import { StudentPlansView } from "../../components/student/StudentPlansView";
import { StudentFeedbackView } from "../../components/student/StudentFeedbackView";
import { StudentCompaniesView } from "../../components/student/StudentCompaniesView";
import { api } from "../../lib/api";
import { OperationType, auth, collection, db, doc, getDocs, handleFirestoreError, limit, logOut, onSnapshot, orderBy, query, setDoc, where, writeBatch } from "../../firebase";

import { MathText } from "../../components/common/MathText";
import { showToast } from "../../components/common/Toast";
import { useFullScreenSecurity } from "../../hooks/useFullScreenSecurity";
import { useWatermark } from "../../hooks/useWatermark";
import { validateProfile } from "../../utils/validators";
// Memory cache for Firestore master collections
let cachedMasterData = null;
let cachedMasterDataTime = 0;
const FIRESTORE_CACHE_TTL = 30000; // 30 seconds TTL

import {
  DashboardSkeleton,
  CompanyCardSkeleton,
  PlanCardSkeleton,
  ProfileSkeleton
} from "../../components/loading/Skeletons";
import { ProgressCircuitLoader } from "../../components/loading/ProgressCircuitLoader";

export default function StudentDashboard() {
  const { syncUserTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const syncTimeoutRef = useRef(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState(null);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  const user = location.state?.user || {
    email: auth.currentUser?.email || "",
    name: auth.currentUser?.displayName || "",
    role: "student",
  };

  const [modules, setModules] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [exams, setExams] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [activeMasterModule, setActiveMasterModule] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [moduleScores, setModuleScores] = useState({});
  const [assessmentPlanFilter, setAssessmentPlanFilter] = useState(null);
  const [isPlacementAttempt, setIsPlacementAttempt] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  // Anti-Cheating & Auto-Fullscreen System
  const [warningCount, setWarningCount] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());

  useEffect(() => {
    if (activeModule) {
      setVisitedQuestions(new Set());
    }
  }, [activeModule?.id]);

  useEffect(() => {
    if (activeModule && activeModule.questions && activeModule.questions[currentQuestionIndex]) {
      const qId = activeModule.questions[currentQuestionIndex].id;
      setVisitedQuestions(prev => {
        const next = new Set(prev);
        next.add(qId);
        return next;
      });
    }
  }, [activeModule, currentQuestionIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowNavigator(false);
      }
    };
    if (showNavigator) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNavigator]);
  const [attemptId, setAttemptId] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState({});

  const {
    watermarkOffset,
    watermarkOpacity,
    triggerWatermarkVisibility,
  } = useWatermark({
    activeModule,
    currentQuestionIndex,
    isFinished,
    isReviewing,
  });

  const {
    isFullscreen,
    setIsFullscreen,
    showWarningModal,
    setShowWarningModal,
    enterFullscreen,
    exitFullscreen,
    isFullscreenSupported,
    handleStartReview: baseStartReview,
    handleExitReview: baseExitReview,
  } = useFullScreenSecurity({
    activeModule,
    currentQuestionIndex,
    isFinished,
    isReviewing,
    setWarningCount,
  });

  const handleStartReview = () => {
    baseStartReview();
    setIsReviewing(true);
  };

  const handleExitReview = () => {
    baseExitReview();
    setIsReviewing(false);
  };

  // Heartbeat / Attempt state auto-sync (runs every 30s)
  useEffect(() => {
    const isTestActive = attemptId && activeModule && currentQuestionIndex >= 0 && !isFinished && !isReviewing;
    if (!isTestActive) return;

    const interval = setInterval(async () => {
      try {
        await api.post(`/attempts/${attemptId}/sync`, {
          answers,
          violationCount: warningCount,
        });
      } catch (err) {
        console.error("Auto-sync heartbeat failed:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [attemptId, activeModule, currentQuestionIndex, isFinished, isReviewing, answers, warningCount]);

  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    categoryXP: {},
  });

  const [earnedXP, setEarnedXP] = useState(0);
  const [currentUserDoc, setCurrentUserDoc] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isStartingModule, setIsStartingModule] = useState(false);
  const [submitState, setSubmitState] = useState(null); // null | 'submitting' | 'grading' | 'failed'
  const [showPreparingResult, setShowPreparingResult] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab) {
      return location.state.activeTab;
    }
    return location.pathname === "/placement-mission" ? "placement-mission" : "dashboard";
  });
  const [activeCompany, setActiveCompany] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [purchaseItem, setPurchaseItem] = useState(null);

  // Dashboard dynamic stats state
  const [placementMissions, setPlacementMissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("studentSidebarOpen");
    return saved !== null ? JSON.parse(saved) : window.innerWidth >= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [activeBranches, setActiveBranches] = useState([]);
  const [isChangingBranch, setIsChangingBranch] = useState(false);
  const [tempSelectedBranch, setTempSelectedBranch] = useState(null);
  const [showBranchConfirmation, setShowBranchConfirmation] = useState(false);
  const [settingBranchId, setSettingBranchId] = useState(null);
  const [onboardingSelectedBranchId, setOnboardingSelectedBranchId] = useState(null);

  useEffect(() => {
    if (currentUserDoc) {
      if (currentUserDoc.hasFullPremium || currentUserDoc.activePlanId) {
        const currentDeviceId = localStorage.getItem("hiregrid_device_id");
        if (
          currentUserDoc.deviceId &&
          currentUserDoc.deviceId !== currentDeviceId
        ) {
          setDeviceBlocked(true);
        } else {
          setDeviceBlocked(false);
        }
      }
    }
  }, [currentUserDoc]);




  useEffect(() => {
    if (location.pathname === "/placement-mission") {
      setActiveTab("placement-mission");
      setActiveModule(null);
      setActiveMasterModule(null);
      setActiveCompany(null);
      setActiveExam(null);
      setPurchaseItem(null);
    } else if (location.pathname === "/student-dashboard") {
      if (activeTab === "placement-mission") {
        setActiveTab("dashboard");
      }
    }
  }, [location.pathname]);

  // Fetch placement missions and leaderboard data for dashboard dynamic stats
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchMissionsAndLeaderboard = async () => {
      try {
        const missionsRes = await api.get("/placement-mission/missions").catch(() => null);
        if (missionsRes && missionsRes.success) {
          setPlacementMissions(missionsRes.missions || []);
        }
        const lbRes = await api.get("/placement-mission/leaderboard").catch(() => null);
        if (lbRes && lbRes.success) {
          setLeaderboard(lbRes.leaderboard || []);
        }
      } catch (e) {
        console.error("Dashboard metadata fetch error:", e);
      }
    };
    fetchMissionsAndLeaderboard();
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    localStorage.setItem("studentSidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setActiveModule(null);
    setActiveMasterModule(null);
    setActiveCompany(null);
    setActiveExam(null);
    setPurchaseItem(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
    if (tab === "placement-mission") {
      navigate("/placement-mission", { state: { activeTab: tab } });
    } else {
      navigate("/student-dashboard", { state: { activeTab: tab } });
    }
  };

  const handleStartAssessmentFlow = async (plan) => {
    try {
      const res = await api.get(`/plans/${plan.id}`);
      if (res.success && res.plan) {
        setAssessmentPlanFilter(res.plan);
        setActiveTab("companies");
        setActiveCompany(null);
        setActiveModule(null);
        setActiveMasterModule(null);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to start assessment: " + err.message, "error");
    }
  };

  const hasItemAccess = (item, type, hierarchyPath = null) => {
    let path = hierarchyPath || [];
    if (path.length === 0) {
      if (
        type === "module" &&
        activeCompany &&
        item.parentId &&
        String(item.parentId) === String(activeCompany.id)
      ) {
        path = [{ node: activeCompany, type: "company" }];
      } else if (
        type === "module" &&
        activeExam &&
        item.parentId &&
        String(item.parentId) === String(activeExam.id)
      ) {
        path = [{ node: activeExam, type: "exam" }];
      }
    }
    const activePlan = currentUserDoc?.activePlanId
      ? plans.find((p) => p.id === currentUserDoc.activePlanId)
      : null;
    return hasAccess(item, type, currentUserDoc, path, activePlan, plans);
  };

  const hasAccessToCompany = (company) => hasItemAccess(company, "company");

  const [accessRequestSent, setAccessRequestSent] = useState({});

  const submitAccessRequest = async (item, type) => {
    if (!currentUserDoc) return;
    try {
      const reqId = crypto.randomUUID();
      await setDoc(doc(db, "access_requests", reqId), {
        id: reqId,
        userId: currentUserDoc.id,
        userName: currentUserDoc.name || currentUserDoc.email,
        userEmail: currentUserDoc.email,
        itemId: item.id,
        itemType: type,
        itemName: item.name || item.title || "Unknown Item",
        status: "pending",
        createdAt: Date.now(),
      });
      setAccessRequestSent((prev) => ({ ...prev, [item.id]: true }));
      showToast("Access request submitted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to submit request.", "error");
    }
  };

  const handleCompanyClick = (c) => {
    setActiveCompany(c);
    setPurchaseItem(null);
  };

  // Removes handlePurchase

  // Profile Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Leaderboard Category
  const [lbCategory, setLbCategory] = useState("general");
  const [lbContextId, setLbContextId] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: user.name || "",
    branch: user.branch || "",
    semester: user.semester || "",
    collegeName: user.collegeName || "",
    universityName: user.universityName || "",
    graduationYear: user.graduationYear || "",
  });

  const getMedalTier = (xp) => {
    const tiers = [
      {
        name: "Bronze",
        min: 0,
        max: 1000,
        color: "text-orange-700 dark:text-orange-500",
        barFrom: "from-orange-600",
        barTo: "to-amber-500",
      },
      {
        name: "Silver",
        min: 1000,
        max: 2500,
        color: "text-slate-400",
        barFrom: "from-slate-400",
        barTo: "to-slate-300",
      },
      {
        name: "Gold",
        min: 2500,
        max: 4500,
        color: "text-amber-400",
        barFrom: "from-amber-500",
        barTo: "to-yellow-300",
      },
      {
        name: "Platinum",
        min: 4500,
        max: 7500,
        color: "text-teal-400",
        barFrom: "from-teal-500",
        barTo: "to-emerald-400",
      },
      {
        name: "Diamond",
        min: 7500,
        max: 12000,
        color: "text-cyan-400",
        barFrom: "from-emerald-500",
        barTo: "to-cyan-400",
      },
      {
        name: "Crown",
        min: 12000,
        max: 18000,
        color: "text-amber-200",
        barFrom: "from-amber-200",
        barTo: "to-orange-300",
      },
      {
        name: "Ace",
        min: 18000,
        max: 25000,
        color: "text-red-500",
        barFrom: "from-red-600",
        barTo: "to-rose-400",
      },
      {
        name: "Conqueror",
        min: 25000,
        max: Infinity,
        color: "text-rose-500",
        barFrom: "from-fuchsia-600",
        barTo: "to-rose-500",
      },
    ];
    const tier =
      tiers
        .slice()
        .reverse()
        .find((t) => xp >= t.min) || tiers[0];

    let subTier = "";
    let tierRange = tier.max - tier.min;

    if (
      ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Crown"].includes(
        tier.name,
      )
    ) {
      const subdiv = tierRange / 5;
      const progress = xp - tier.min;
      const step = 4 - Math.floor(Math.min(progress, tierRange - 1) / subdiv); // V down to I
      const roman = ["I", "II", "III", "IV", "V"];
      subTier = " " + roman[step];
    }

    const maxVal = tier.max === Infinity ? xp : tier.max;
    const percentage =
      tier.max === Infinity ? 100 : ((xp - tier.min) / tierRange) * 100;

    return { ...tier, fullName: tier.name + subTier, maxVal, percentage };
  };

  const getEliteFlair = (rank) => {
    switch (rank) {
      case 1:
        return {
          text: "S1 Grandmaster",
          style:
            "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm border-none",
        };
      case 2:
        return {
          text: "S1 Master",
          style:
            "bg-gradient-to-r from-purple-500 to-emerald-500 text-white shadow-sm border-none",
        };
      case 3:
        return {
          text: "S1 Diamond",
          style:
            "bg-gradient-to-r from-emerald-400 to-cyan-500 text-white shadow-sm border-none",
        };
      case 4:
        return {
          text: "S1 Platinum",
          style:
            "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border border-teal-300 dark:border-teal-700",
        };
      case 5:
        return {
          text: "S1 Gold",
          style:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
        };
      default:
        return null;
    }
  };



  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch master data once on mount
    const fetchMasterData = async () => {
      setLoadingMetadata(true);
      setMetadataError(null);

      const now = Date.now();
      if (cachedMasterData && (now - cachedMasterDataTime < FIRESTORE_CACHE_TTL)) {
        setModules(cachedMasterData.modules);
        setCompanies(cachedMasterData.companies);
        setExams(cachedMasterData.exams);
        setPlans(cachedMasterData.plans);
        if (cachedMasterData.activeBranches && cachedMasterData.activeBranches.length > 0) {
          setActiveBranches(cachedMasterData.activeBranches);
        }
        setLoadingMetadata(false);
        return;
      }

      try {
        const [modsSnap, compSnap, examsSnap, plansSnap, branchesRes, compRes] = await Promise.all([
          getDocs(query(collection(db, "modules"), orderBy("createdAt", "asc"))),
          getDocs(collection(db, "companies")),
          getDocs(collection(db, "exams")),
          getDocs(collection(db, "plans")),
          api.get("/branches/active").catch(() => ({ success: false, branches: [] })),
          api.get("/companies").catch(() => ({ success: false, companies: [] }))
        ]);
        
        const freshModules = modsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const fsCompanies = compSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const apiCompanies = compRes.success && compRes.companies ? compRes.companies : [];

        const compMap = new Map();
        fsCompanies.forEach(c => compMap.set(c.id, c));
        apiCompanies.forEach(c => {
          const existing = compMap.get(c.id);
          compMap.set(c.id, existing ? { ...existing, ...c } : c);
        });
        const freshCompanies = Array.from(compMap.values());

        const freshExams = examsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const freshPlans = plansSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const freshBranches = branchesRes.success && branchesRes.branches ? branchesRes.branches : [];

        setModules(freshModules);
        setCompanies(freshCompanies);
        setExams(freshExams);
        setPlans(freshPlans);
        if (freshBranches.length > 0) {
          setActiveBranches(freshBranches);
        }

        // Cache the master data
        cachedMasterData = {
          modules: freshModules,
          companies: freshCompanies,
          exams: freshExams,
          plans: freshPlans,
          activeBranches: freshBranches
        };
        cachedMasterDataTime = Date.now();

        setLoadingMetadata(false);
      } catch (err) {
        console.error("Error loading dashboard metadata:", err);
        setMetadataError(err.message || "Failed to load dashboard data. Please try again.");
        setLoadingMetadata(false);
      }
    };
    fetchMasterData();

    // Subscribe to user stats only
    const unsubUser = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (d.theme) syncUserTheme(d);
          setCurrentUserDoc({ id: docSnap.id, ...d });
          setModuleScores(d.moduleScores || {});
          const todayStr = new Date().toLocaleDateString('en-CA');
          const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
          const lastAttemptDate = d.lastExamAttemptDate || "";
          let currentStreak = d.streak || 0;

          if (lastAttemptDate !== todayStr && lastAttemptDate !== yesterdayStr && currentStreak > 0) {
            currentStreak = 0;
            setDoc(
              doc(db, "users", auth.currentUser.uid),
              { streak: 0 },
              { merge: true }
            ).catch(err => console.error("Error resetting broken streak:", err));
          }

          setStats({
            xp: d.xp || 0,
            streak: currentStreak,
            categoryXP: d.categoryXP || {},
          });
          setProfileForm((prev) => ({
            ...prev,
            name: d.name || prev.name,
            branch: d.branch || prev.branch,
            branchId: d.branchId || d.branch_id || prev.branchId,
            semester: d.semester || prev.semester,
            collegeName: d.collegeName || prev.collegeName,
            universityName: d.universityName || prev.universityName,
            graduationYear: d.graduationYear || prev.graduationYear,
          }));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, "users"),
    );

    return () => {
      unsubUser();
    };
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    // Scores table removed for database optimization
  }, [activeModule]);

  useEffect(() => {
    if (
      !activeModule ||
      isFinished ||
      isReviewing ||
      timeLeft === null ||
      currentQuestionIndex === -1
    )
      return;
    if (timeLeft <= 0) {
      handleFinishTest(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, activeModule, isFinished, isReviewing, currentQuestionIndex, attemptId]);

  // Anti-Cheating Security Listener (Tab Switch, Window Blur, Fullscreen Exit)
  useEffect(() => {
    const isSecurityActive =
      activeModule &&
      ((currentQuestionIndex >= 0 && !isFinished && !isReviewing) || isReviewing);

    if (!isSecurityActive) return;

    const triggerViolation = (type = "tab_switch") => {
      triggerWatermarkVisibility();

      api.post("/security-logs", {
        eventType: type === "blur" ? "window_blur" : "tab_switch",
        details: isReviewing
          ? `Review mode violation (tab switch/window blur) on module "${activeModule.title}"`
          : `Assessment violation triggered (tab switch / window minimized) on module "${activeModule.title}" (Question ${currentQuestionIndex + 1})`
      }).catch(() => {});

      setWarningCount((prev) => {
        const nextCount = prev + 1;
        if (attemptId && !isReviewing) {
          api.post(`/attempts/${attemptId}/sync`, { violationCount: nextCount }).catch(() => {});
        }
        if (nextCount >= 3) {
          if (isReviewing) {
            showToast(
              "ANTI-CHEATING SYSTEM VIOLATION: Maximum allowed security warnings exceeded (3/3). Exiting review screen.",
              "warning", 6000
            );
            handleExitReview();
          } else {
            showToast(
              "ANTI-CHEATING SYSTEM VIOLATION: Maximum allowed security warnings exceeded (3/3). Your exam is being automatically submitted immediately.",
              "warning", 6000
            );
            handleFinishTest(true);
          }
        } else {
          setShowWarningModal(true);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation("visibility");
      }
    };

    const handleBlur = () => {
      triggerViolation("blur");
    };

    const handleFullscreenChange = () => {
      const inFS = !!(
        document.fullscreenElement || document.webkitFullscreenElement
      );
      setIsFullscreen(inFS);
      if (!inFS) {
        triggerViolation("fullscreen");
      }
    };

    const handleKeydown = (e) => {
      const isScreenshotKey = e.key === "PrintScreen" || 
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "s" || e.key === "S"));
      const isPrintKey = (e.ctrlKey && e.key === "p") || (e.metaKey && e.key === "p");

      if (isScreenshotKey || isPrintKey) {
        e.preventDefault();
        triggerWatermarkVisibility();

        const eventType = isScreenshotKey ? "screenshot_attempt" : "print_attempt";
        const details = isScreenshotKey
          ? (isReviewing 
              ? `Screenshot capture attempt detected in review mode on module "${activeModule.title}"`
              : `Screenshot capture attempt detected (shortcut keys) on module "${activeModule.title}" (Question ${currentQuestionIndex + 1})`)
          : (isReviewing
              ? `Print screen / PDF export attempt in review mode on module "${activeModule.title}"`
              : `Print screen / PDF export attempt detected on module "${activeModule.title}" (Question ${currentQuestionIndex + 1})`);

        api.post("/security-logs", { eventType, details }).catch(() => {});
        showToast("Anti-Cheat: Screen capturing or printing is disabled. This incident has been reported to the Super Admin.", "warning");
      }
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      triggerWatermarkVisibility();
      api.post("/security-logs", {
        eventType: "copy_attempt",
        details: isReviewing
          ? `Copy/Paste block triggered in review mode on module "${activeModule.title}"`
          : `Copy/Paste block triggered on module "${activeModule.title}" (Question ${currentQuestionIndex + 1})`
      }).catch(() => {});
      showToast("Anti-Cheat: Copy/Paste is disabled during exams.", "warning");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerWatermarkVisibility();
      api.post("/security-logs", {
        eventType: "copy_attempt",
        details: isReviewing
          ? `Right-click context menu block triggered in review mode on module "${activeModule.title}"`
          : `Right-click context menu block triggered on module "${activeModule.title}" (Question ${currentQuestionIndex + 1})`
      }).catch(() => {});
    };

    const handleBeforePrint = () => {
      triggerWatermarkVisibility();
      api.post("/security-logs", {
        eventType: "print_attempt",
        details: isReviewing
          ? `Print dialog trigger in review mode on module "${activeModule.title}"`
          : `Print dialog trigger detected on module "${activeModule.title}" (Question ${currentQuestionIndex + 1})`
      }).catch(() => {});
      document.body.style.display = "none";
    };
    const handleAfterPrint = () => {
      document.body.style.display = "block";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.style.display = "block";
    };
  }, [activeModule, currentQuestionIndex, isFinished, isReviewing, attemptId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!user || user.role !== "student") {
    return <Navigate to="/" replace />;
  }

  const handleStartModule = async (mod, path) => {
    if (isStartingModule) return;
    setIsStartingModule(true);

    try {
      if (!hasItemAccess(mod, "module", path)) {
        showToast("Access Denied. You do not have permission to view this content.", "warning");
        setIsStartingModule(false);
        return;
      }

      if (mod.isMaster) {
        setActiveMasterModule(mod);
      } else {
        const isPlacement = activeTab === "placement-mission" || mod.is_placement_mission || mod.isPlacementMission;
        setIsPlacementAttempt(isPlacement);
        setSubmittedResult(null);

        const url = isPlacement ? "/placement-mission/attempts/start" : "/attempts/start";
        const res = await api.post(url, { moduleId: mod.id });
        const fetchedQuestions = res.questions || [];
        const fullModuleObj = { ...mod, questions: fetchedQuestions };
        setActiveModule(fullModuleObj);
        setAttemptId(res.attemptId);
        setWarningCount(res.violationCount || 0);

        const serverAnswers = { ...(res.answers || {}) };
        delete serverAnswers._question_order;
        setAnswers(serverAnswers);

        setMarkedForReview({});
        setIsFinished(false);
        setIsReviewing(false);
        setShowWarningModal(false);
        setTimeLeft(res.timeLeft);
        setCurrentQuestionIndex(-1);
      }
    } catch (err) {
      showToast("Failed to initialize secure assessment: " + err.message, "error");
    } finally {
      setIsStartingModule(false);
    }
  };

  const handleStartActualTest = () => {
    setWarningCount(0);
    setShowWarningModal(false);
    enterFullscreen();
    setCurrentQuestionIndex(0);
  };

  const handleSelectOption = (index) => {
    if (!activeModule) return;
    const currentQ = activeModule.questions[currentQuestionIndex];
    
    // Save answers locally for instant UI update
    setAnswers((prev) => {
      const updated = { ...prev, [currentQ.id]: index };
      
      // Debounce database sync to improve performance and prevent connection pool choke
      if (attemptId) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          const url = isPlacementAttempt ? `/placement-mission/attempts/${attemptId}/sync` : `/attempts/${attemptId}/sync`;
          api.post(url, { answers: { [currentQ.id]: index } }).catch(() => {});
        }, 1500);
      }
      return updated;
    });
  };

  const handleFinishTest = async (bypassConfirm = false) => {
    if (submitState) return;
    if (!activeModule || !auth.currentUser) return;

    if (!bypassConfirm) {
      const confirmSubmit = window.confirm("Are you sure you want to finish and submit your test?");
      if (!confirmSubmit) return;
    }

    exitFullscreen();
    setShowWarningModal(false);

    setSubmitState("submitting");
    setShowPreparingResult(false);

    // Setup preparing status timer if grading takes > 3 seconds
    const preparingTimer = setTimeout(() => {
      setShowPreparingResult(true);
    }, 3000);

    try {
      setSubmitState("submitting");
      const url = isPlacementAttempt ? `/placement-mission/attempts/${attemptId}/submit` : `/attempts/${attemptId}/submit`;
      
      // Submit and grade attempt securely on the backend immediately without artificial delays
      const result = await api.post(url, {
        answers
      });

      clearTimeout(preparingTimer);

      if (result.success) {
        const percentage = result.score;
        const correctCount = result.correctCount;
        const totalQ = result.totalQuestions;
        const gainedXP = result.xpEarned;

        setSubmittedResult({
          score: percentage,
          correctCount,
          totalQuestions: totalQ,
          xpEarned: gainedXP
        });

        if (result.correctAnswers) {
          setCorrectAnswers(result.correctAnswers);
        }

        const newScores = {
          ...moduleScores,
          [activeModule.id]: Math.max(
            percentage,
            moduleScores[activeModule.id] || 0,
          ),
        };

        setEarnedXP(gainedXP);
        setModuleScores(newScores);

        // Update daily study streak
        try {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
          const lastAttemptDate = currentUserDoc?.lastExamAttemptDate || "";
          const currentStreak = currentUserDoc?.streak || 0;
          let newStreak = currentStreak;

          if (lastAttemptDate === todayStr) {
            newStreak = currentStreak;
          } else if (lastAttemptDate === yesterdayStr) {
            newStreak = currentStreak + 1;
          } else {
            newStreak = 1;
          }

          await setDoc(
            doc(db, "users", auth.currentUser.uid),
            {
              streak: newStreak,
              lastExamAttemptDate: todayStr,
            },
            { merge: true }
          );
        } catch (streakErr) {
          console.error("Failed to update daily streak:", streakErr);
        }

        setIsFinished(true);
        setSubmitState(null);
        showToast(`Test finished successfully! Score: ${percentage}%, XP Earned: ${gainedXP}`, "success");
      } else {
        setSubmitState(null);
        showToast("Error scoring test: " + (result.error || "Unknown error"), "error");
      }
    } catch (err) {
      clearTimeout(preparingTimer);
      console.error("Score submission error:", err);
      setSubmitState(null);
      showToast("Submission failed: " + err.message, "error");
    }
  };

  const handleNextQuestion = () => {
    if (!activeModule) return;
    if (currentQuestionIndex < activeModule.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // On the last question, find the first unanswered question to wrap around
      const unansweredIdx = activeModule.questions.findIndex(
        (q) => answers[q.id] === undefined
      );
      if (unansweredIdx !== -1) {
        setCurrentQuestionIndex(unansweredIdx);
      } else {
        // If all are answered, wrap to the first question
        setCurrentQuestionIndex(0);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (!activeModule) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const toggleReview = () => {
    if (!activeModule) return;
    const qId = activeModule.questions[currentQuestionIndex].id;
    setMarkedForReview((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleClearSelection = () => {
    if (!activeModule) return;
    const qId = activeModule.questions[currentQuestionIndex].id;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const calculateScore = () => {
    if (!activeModule) return 0;

    if (submittedResult && submittedResult.correctCount !== undefined) {
      return submittedResult.correctCount;
    }

    let score = 0;
    const modPositive =
      activeModule.marksPerQuestion !== undefined
        ? Number(activeModule.marksPerQuestion)
        : 1;
    const modNegative =
      activeModule.negativeMarks !== undefined
        ? Number(activeModule.negativeMarks)
        : 0.5;

    activeModule.questions.forEach((q) => {
      const qPos =
        q.positiveMarksOverride !== undefined
          ? Number(q.positiveMarksOverride)
          : modPositive;
      const qNeg =
        q.negativeMarksOverride !== undefined
          ? Number(q.negativeMarksOverride)
          : modNegative;

      const correctIdx = q.correctAnswerIndex !== undefined && q.correctAnswerIndex !== null
        ? q.correctAnswerIndex
        : correctAnswers[q.id];

      if (answers[q.id] !== undefined && answers[q.id] !== null) {
        if (Number(answers[q.id]) === Number(correctIdx)) {
          score += qPos;
        } else {
          score -= qNeg;
        }
      }
    });
    return Math.max(0, score);
  };

  const handleLogout = async () => {
    await logOut();
    navigate("/");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const validation = validateProfile(profileForm);
    if (!validation.isValid) {
      showToast(validation.error, "error");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          name: profileForm.name,
          branch: profileForm.branch,
          branchId: profileForm.branchId || currentUserDoc?.branchId || null,
          semester: profileForm.semester,
          collegeName: profileForm.collegeName,
          universityName: profileForm.universityName,
          graduationYear: profileForm.graduationYear,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
      setIsProfileOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save profile", "error");
    }
  };

  const branches = [
    "Computer Science",
    "Information Technology",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
    "Electronics & Communication",
    "Chemical Engineering",
    "Aerospace Engineering",
    "Automobile Engineering",
    "Biotechnology",
    "Other",
  ];

  const userFlair = null;
  const medalInfo = getMedalTier(stats?.xp || 0);

  if (deviceBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans p-6 text-center z-50 relative">
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          <Lock className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
            Device Blocked
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium mb-8">
            Your premium account is currently registered to another device. For
            security reasons, premium accounts are limited to one active device.
          </p>
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  const deviceId = localStorage.getItem("hiregrid_device_id") || "dev_" + Math.random().toString(36).substring(2);
                  await api.post("/device-requests", {
                    userId: auth.currentUser?.uid,
                    userName: currentUserDoc?.name || auth.currentUser?.email || "Student",
                    userEmail: currentUserDoc?.email || auth.currentUser?.email,
                    deviceId,
                    deviceName: navigator.userAgent.includes("Mobile") ? "Mobile Browser" : "Desktop Browser",
                  });
                  showToast("Permission request sent to Super Admin! You will be notified once approved.", "success");
                } catch (err) {
                  showToast("Request failed: " + (err.message || "Error submitting request."), "error");
                }
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span>Request Multi-Device Permission</span>
            </button>
            <button
              onClick={() => {
                logOut();
                navigate("/");
              }}
              className="w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl uppercase tracking-widest transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Intercept if user is student and has not selected branch
  const hasNoBranchSelected = currentUserDoc && currentUserDoc.role === "student" && !currentUserDoc.branchId && !currentUserDoc.branch_id;
  if (hasNoBranchSelected) {
    // Filter out the General system fallback branch so it is not shown as a student choice
    const availableStudentBranches = activeBranches.filter(b => !b.isGeneral && b.status === "ACTIVE");

    const handleSaveOnboardingBranch = async () => {
      if (!onboardingSelectedBranchId) return;
      const chosenBranch = availableStudentBranches.find(b => b.id === onboardingSelectedBranchId);
      if (!chosenBranch) return;

      setSettingBranchId(onboardingSelectedBranchId);
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            branchId: chosenBranch.id,
            branch: chosenBranch.name,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
        showToast(`Branch set to ${chosenBranch.name} successfully!`, "success");
        // Instantly update local state to dismiss the onboarding screen
        setCurrentUserDoc(prev => ({
          ...prev,
          branchId: chosenBranch.id,
          branch_id: chosenBranch.id,
          branch: chosenBranch.name
        }));
      } catch (err) {
        showToast("Failed to set branch: " + err.message, "error");
      } finally {
        setSettingBranchId(null);
      }
    };

    return (
      <div className="min-h-screen bg-[#070D19] flex items-center justify-center font-sans p-4 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-circuit-pattern opacity-10 animate-circuit" />
        
        <div className="bg-[#0E1629] border border-slate-850 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center relative z-10 transform transition-all animate-in fade-in zoom-in-95 duration-300">
          <BookOpen className="w-16 h-16 text-emerald-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-wide mb-3">
            Choose Your Branch
          </h2>
          <p className="text-xs text-slate-450 font-medium mb-8">
            Select your academic branch to personalize companies, learning content and placement opportunities available to you.
          </p>
          
          <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2 mb-8 select-branch-container animate-fade-in custom-scrollbar">
            {availableStudentBranches.map((b) => {
              const isSelected = onboardingSelectedBranchId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={settingBranchId !== null}
                  onClick={() => setOnboardingSelectedBranchId(b.id)}
                  className={`w-full text-left px-6 py-4 rounded-2xl border font-bold transition-all flex justify-between items-center group hover:scale-[1.01] ${
                    isSelected 
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-white" 
                      : "border-slate-200 dark:border-slate-850 bg-white dark:bg-[#050B14] hover:bg-emerald-500/5 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Custom Radio Button */}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-750 bg-slate-950"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-left">
                      <div className={`text-base transition-colors ${isSelected ? "text-emerald-500" : ""}`}>
                        {b.name}
                      </div>
                      {b.description && (
                        <div className="text-xs text-slate-500 font-medium mt-1">{b.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {availableStudentBranches.length === 0 && (
              <div className="text-center py-6 text-slate-500 font-semibold">
                No academic branches are active right now. Please contact the administrator.
              </div>
            )}
          </div>

          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => {
                logOut();
                navigate("/");
              }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold rounded-xl transition-colors uppercase tracking-widest text-xs"
            >
              Sign Out
            </button>
            <button
              disabled={!onboardingSelectedBranchId || settingBranchId !== null}
              onClick={handleSaveOnboardingBranch}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-750 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 text-xs uppercase tracking-widest"
            >
              {settingBranchId ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingMetadata) {
    return <ProgressCircuitLoader fullScreen indeterminate label="Loading your workspace..." />;
  }

  if (metadataError) {
    return (
      <div className="min-h-screen bg-[#070D19] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full glass-panel border border-rose-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-rose-500/10 border-t-rose-500 flex items-center justify-center">
              <span className="text-rose-500 text-xl font-bold">!</span>
            </div>
          </div>
          
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 font-mono">
            Connection Failed
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6">
            {metadataError}
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                logOut();
                navigate("/");
              }}
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors uppercase tracking-widest text-[10px]"
            >
              Sign Out
            </button>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors uppercase tracking-widest text-[10px]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="std-layout relative">
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-[#070D19]/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {submitState && (
        <div className="fixed inset-0 z-[9999] bg-[#070D19]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-300">
          <ProgressCircuitLoader
            indeterminate
            label={submitState === "submitting" ? "Submitting your assessment..." : "Calculating your result..."}
          />
          <p className="text-sm text-slate-400 font-medium mt-4 max-w-md">
            Please don't close or refresh this page. Your responses are being processed and graded securely.
          </p>
        </div>
      )}

      {/* Sidebar Navigation */}
      <StudentSidebar
        activeTab={activeTab}
        onTabSelect={handleNavClick}
        user={currentUserDoc || user}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      {/* Main Wrapper */}
      <div className="std-main-wrapper">
        {/* Top Header */}
        {!activeModule && (
          <StudentHeader
            user={currentUserDoc || user}
            stats={stats}
            medalInfo={medalInfo}
            activeTab={activeTab}
            onMenuClick={() => setSidebarOpen(true)}
            onEditProfile={() => setActiveTab("profile")}
          />
        )}

        {/* Scrollable Content Container */}
        <div className="std-content-scroll custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            {/* Global Plan Assessment Mode warning banner */}
            {assessmentPlanFilter && !activeModule && (
              <div className="bg-emerald-600/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center justify-between shadow-xl mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div>
                    <span className="text-sm font-bold text-white">Plan Assessment Mode: {assessmentPlanFilter.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">Displaying only companies and branches locked to this plan.</p>
                  </div>
                </div>
                <button
                  onClick={() => setAssessmentPlanFilter(null)}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-wider font-mono"
                >
                  Exit Assessment
                </button>
              </div>
            )}

            {/* Sub Tests (Master Modules) Detail view */}
            {activeMasterModule && !activeModule && (
              <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
                <button
                  onClick={() => setActiveMasterModule(null)}
                  className="flex items-center text-xs font-bold text-slate-450 hover:text-emerald-400 transition-colors mb-6 uppercase tracking-wider gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Modules
                </button>
                <div className="std-panel relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10"></div>
                  <h2 className="text-2xl font-black text-slate-100 mb-2 tracking-tight">
                    {activeMasterModule.title}
                  </h2>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 whitespace-pre-wrap">
                    {activeMasterModule.description || "Complete all the sub-modules below."}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeMasterModule.subTests?.map((subTest) => {
                      const prevScore = moduleScores[subTest.id];
                      const hasCompleted = prevScore !== undefined;

                      return (
                        <div
                          key={subTest.id}
                          className="p-5 border border-slate-200 dark:border-slate-850 rounded-xl hover:border-slate-400 dark:hover:border-slate-700 transition-all bg-white dark:bg-[#050B14] flex flex-col items-start justify-between min-h-[150px] group shadow-sm"
                        >
                          <div>
                            <h4 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {subTest.title}
                            </h4>
                            <div className="text-xs font-medium text-slate-500 mb-6 flex items-center">
                              <BookOpen className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                              {subTest.questions?.length || 0} Questions
                            </div>
                          </div>

                          <div className="w-full flex items-center justify-between mt-auto pt-2 border-t border-slate-850/50">
                            {hasCompleted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                                Score: {prevScore}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-900 rounded">
                                Not Started
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setActiveModule({
                                  ...subTest,
                                  timeLimit: 30,
                                  passPercentage: activeMasterModule.passPercentage || 60,
                                  questions: subTest.questions || [],
                                  moduleType: activeMasterModule.moduleType || "general",
                                  parentId: activeMasterModule.parentId,
                                });
                                setCurrentQuestionIndex(0);
                                setAnswers({});
                                setMarkedForReview({});
                                setIsFinished(false);
                                setIsReviewing(false);
                                setTimeLeft(30 * 60);
                              }}
                              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                              {hasCompleted ? "Retake" : "Start"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Secure Exam assessment screen */}
            {activeModule && (
              <div className="max-w-3xl mx-auto">
                {!isFinished && currentQuestionIndex === -1 && (
                  <button
                    onClick={() => {
                      exitFullscreen();
                      setActiveModule(null);
                    }}
                    className="flex items-center text-xs font-bold text-slate-455 hover:text-emerald-400 transition-colors mb-6 uppercase tracking-wider gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </button>
                )}
                <div className="glass-panel rounded-2xl shadow-lg border border-emerald-500/20 p-6 md:p-10 transition-colors">
                  {isFinished ? (
                    isReviewing ? (
                      <div
                        className="select-none-all relative overflow-hidden"
                        onContextMenu={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          msUserSelect: "none",
                        }}
                      >


                        {/* Dynamic Watermark */}
                        <div className="watermark-overlay" style={{ transform: `translate(${watermarkOffset.x}px, ${watermarkOffset.y}px) rotate(-25deg) scale(1.2)` }}>
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="watermark-item select-none text-slate-400 dark:text-slate-650"
                              style={{ opacity: watermarkOpacity, transition: "opacity 0.3s ease-in-out" }}
                            >
                              {currentUserDoc ? `${currentUserDoc.name || "Student"} • ${currentUserDoc.email ? currentUserDoc.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : ""} • ID: ${currentUserDoc.id ? currentUserDoc.id.substring(0, 8) : ""}` : "Protected Assessment"}
                              <br />
                              {new Date().toLocaleDateString()} • Attempt: {attemptId ? attemptId.substring(0, 8) : "Active"}
                            </div>
                          ))}
                        </div>

                        {/* Anti-Cheating Violation Modal Overlay inside Review */}
                        {showWarningModal && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                            <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-center">
                              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-10 h-10 animate-bounce" />
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                                Anti-Cheating Security Alert
                              </h3>
                              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">
                                Tab switching, window minimization, or exiting fullscreen is strictly prohibited!
                              </p>
                              <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl mb-6 text-slate-700 dark:text-slate-300 text-sm">
                                <p className="font-bold text-base mb-1">
                                  Warning Status: <span className="text-rose-500 font-mono font-black">{warningCount} of 3 Allowed Warnings</span>
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Exceeding 3 warnings will result in immediate termination of review session.
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  enterFullscreen();
                                  setShowWarningModal(false);
                                }}
                                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-base shadow-lg transition-all"
                              >
                                Re-enter Fullscreen & Continue Review
                              </button>
                            </div>
                          </div>
                        )}

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                          Review Answers
                        </h2>
                        <div className="space-y-8">
                          {activeModule.questions.map((q, qIdx) => {
                            const userAnswer = answers[q.id];
                            const actualCorrectIndex = q.correctAnswerIndex !== null && q.correctAnswerIndex !== undefined
                              ? q.correctAnswerIndex
                              : correctAnswers[q.id];
                            const isCorrect =
                              userAnswer === actualCorrectIndex;
                            return (
                              <div
                                key={q.id}
                                className="p-6 rounded-xl border border-emerald-500/20 bg-slate-100 dark:bg-slate-900/40"
                              >
                                <div className="flex items-start">
                                  <div className="mt-1 mr-3 shrink-0">
                                    {isCorrect ? (
                                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    ) : (
                                      <XCircle className="w-6 h-6 text-rose-500" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      {q.difficulty && (
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                            q.difficulty.toLowerCase() === "easy"
                                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                              : q.difficulty.toLowerCase() === "medium"
                                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                              : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                                          }`}
                                        >
                                          {q.difficulty}
                                        </span>
                                      )}
                                      {q.topic && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 uppercase tracking-wider">
                                          {q.topic}
                                        </span>
                                      )}
                                      {(q.subTopic || q.sub_topic) && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
                                          {q.subTopic || q.sub_topic}
                                        </span>
                                      )}
                                      {q.subject && !q.topic && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 uppercase tracking-wider">
                                          {q.subject}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-4">
                                      {qIdx + 1}.{" "}
                                      <MathText content={q.question} />
                                    </div>
                                    {(q.image || q.svgCode || q.svg_code) && (
                                      <SvgDiagram
                                        svgCode={q.image || q.svgCode || q.svg_code}
                                        className="max-h-48"
                                        containerClassName="mb-4"
                                      />
                                    )}
                                    <div className="space-y-2">
                                      {q.options.map((opt, optIdx) => {
                                        const isUserPick =
                                          userAnswer === optIdx;
                                        const isTrueCorrect =
                                          actualCorrectIndex === optIdx;
                                        let ring =
                                          "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400";
                                        if (isTrueCorrect)
                                          ring =
                                            "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm";
                                        else if (isUserPick)
                                          ring =
                                            "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-900 dark:text-rose-200 font-bold shadow-sm";

                                        return (
                                          <div
                                            key={optIdx}
                                            className={`px-4 py-3 rounded-xl border flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between transition-colors ${ring}`}
                                          >
                                            <div className="flex items-start flex-1 mr-3 w-full sm:w-auto">
                                              <span className="mr-3 font-mono font-bold opacity-80 mt-0.5">
                                                {String.fromCharCode(65 + optIdx)}.
                                              </span>
                                              <div className="flex-grow">
                                                {opt.startsWith("data:image/") ||
                                                opt.trim().startsWith("<svg") ? (
                                                  <SvgDiagram
                                                    svgCode={opt}
                                                    className="max-h-24 w-auto object-contain"
                                                    containerClassName=""
                                                  />
                                                ) : (
                                                  <MathText content={opt} />
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-7 sm:pl-0">
                                              {isUserPick && !isTrueCorrect && (
                                                <span className="px-2.5 py-1 rounded-md bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 text-xs font-black uppercase tracking-wider">
                                                  Your Choice (Wrong)
                                                </span>
                                              )}
                                              {isTrueCorrect && (
                                                <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center shadow-sm">
                                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                  Correct Answer
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {q.explanation && (
                                      <div className="mt-4 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
                                          Explanation
                                        </p>
                                        <div className="text-sm text-indigo-900 dark:text-indigo-200">
                                          <MathText content={q.explanation} />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-8 flex justify-center">
                          <button
                            onClick={handleExitReview}
                            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors"
                          >
                            Back to Result
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        {(() => {
                          const score = calculateScore();
                          const total = submittedResult ? submittedResult.totalQuestions : activeModule.questions.length;
                          const percentage = submittedResult ? submittedResult.score : Math.round((score / total) * 100);
                          const isPassed =
                            percentage >= (activeModule.passPercentage || 60);

                          return (
                            <>
                              <div
                                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPassed ? "bg-emerald-100 dark:bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-lime-400" : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"}`}
                              >
                                {isPassed ? (
                                  <CheckCircle2 className="w-10 h-10" />
                                ) : (
                                  <XCircle className="w-10 h-10" />
                                )}
                              </div>
                              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                Module Completed!
                              </h2>
                              <p className="text-emerald-400/80 mb-6 font-medium">
                                You scored {percentage}% (Requiring{" "}
                                {activeModule.passPercentage || 60}% to pass).
                              </p>

                              <div className="flex justify-center flex-wrap gap-4 mb-10">
                                <div className="bg-slate-50 dark:bg-slate-900 px-8 py-6 rounded-xl border border-emerald-500/20">
                                  <p className="text-sm text-emerald-400/80 uppercase tracking-widest font-bold mb-1">
                                    Your Score
                                  </p>
                                  <p
                                    className={`text-5xl font-black ${isPassed ? "text-emerald-800 dark:text-lime-400" : "text-rose-600 dark:text-rose-400"}`}
                                  >
                                    {score}{" "}
                                    <span className="text-2xl text-slate-400 border-l border-slate-300 dark:border-slate-600 pl-2 ml-1">
                                      / {total}
                                    </span>
                                  </p>
                                </div>

                                {isPassed && earnedXP > 0 && (
                                  <div className="bg-gradient-to-br from-emerald-500 via-purple-500 to-rose-500 px-8 py-6 rounded-xl border border-emerald-400 shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center text-white min-w-[160px]">
                                    <p className="text-sm uppercase tracking-widest font-bold mb-1 text-emerald-100">
                                      Earned XP
                                    </p>
                                    <div className="flex items-center text-5xl font-black">
                                      <Zap className="w-10 h-10 mr-2 text-amber-300 fill-current" />
                                      +{earnedXP}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-center space-x-4">
                                <button
                                  onClick={handleStartReview}
                                  className="px-6 py-3 glass-panel border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-bold rounded-xl transition-colors shadow-sm"
                                >
                                  Review Answers
                                </button>
                                <button
                                  onClick={() => setActiveModule(null)}
                                  className="px-6 py-3 btn-eng-primary font-bold rounded-xl shadow-md transition-colors"
                                >
                                  Return to Dashboard
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )
                  ) : currentQuestionIndex === -1 ? (
                    <div className="text-center py-8">
                      <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-6">
                        {activeModule.title}
                      </h2>
                      {activeModule.description && (
                        <p className="text-emerald-500 font-medium mb-8 max-w-2xl mx-auto">
                          {activeModule.description}
                        </p>
                      )}
                      <div className="bg-slate-50 dark:bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 mb-8 max-w-xl mx-auto grid grid-cols-2 gap-6">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Total Questions
                          </span>
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                            {activeModule.questionCount || (activeModule.questions || []).length}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Total Marks
                          </span>
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-200">
                            {(() => {
                              const tm = Number(activeModule.totalMarks);
                              if (
                                activeModule.totalMarks !== undefined &&
                                activeModule.totalMarks !== null &&
                                activeModule.totalMarks !== "" &&
                                !isNaN(tm) &&
                                tm > 0
                              ) {
                                return tm;
                              }
                              return (activeModule.questions || []).reduce(
                                (sum, q) => {
                                  const val = Number(
                                    q.positiveMarksOverride !== undefined &&
                                      q.positiveMarksOverride !== null &&
                                      q.positiveMarksOverride !== ""
                                      ? q.positiveMarksOverride
                                      : activeModule.marksPerQuestion || 1,
                                  );
                                  return sum + (isNaN(val) ? 1 : val);
                                },
                                0,
                              );
                            })()}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Marking Scheme
                          </span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            +{Number(activeModule.marksPerQuestion || 1)} / -
                            {Number(
                              activeModule.negativeMarks !== undefined &&
                                activeModule.negativeMarks !== null
                                ? activeModule.negativeMarks
                                : 0.5,
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Passing Mark
                          </span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {activeModule.passPercentage || 60}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider mb-8">
                        * Some questions may have individual marking overrides.
                      </div>
                      <button
                        onClick={handleStartActualTest}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                      >
                        Accept & Start Mission
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="select-none-all relative overflow-hidden"
                      onContextMenu={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        msUserSelect: "none",
                      }}
                    >


                      {/* Dynamic Watermark */}
                      <div className="watermark-overlay" style={{ transform: `translate(${watermarkOffset.x}px, ${watermarkOffset.y}px) rotate(-25deg) scale(1.2)` }}>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="watermark-item select-none text-slate-400 dark:text-slate-650"
                            style={{ opacity: watermarkOpacity, transition: "opacity 0.3s ease-in-out" }}
                          >
                            {currentUserDoc ? `${currentUserDoc.name || "Student"} • ${currentUserDoc.email ? currentUserDoc.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : ""} • ID: ${currentUserDoc.id ? currentUserDoc.id.substring(0, 8) : ""}` : "Protected Assessment"}
                            <br />
                            {new Date().toLocaleDateString()} • Attempt: {attemptId ? attemptId.substring(0, 8) : "Active"}
                          </div>
                        ))}
                      </div>

                      {/* Anti-Cheating Violation Modal Overlay */}
                      {showWarningModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-center">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                              <AlertTriangle className="w-10 h-10 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                              Anti-Cheating Security Alert
                            </h3>
                            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">
                              Tab switching, window minimization, or exiting fullscreen is strictly prohibited!
                            </p>
                            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl mb-6 text-slate-700 dark:text-slate-300 text-sm">
                              <p className="font-bold text-base mb-1">
                                Warning Status: <span className="text-rose-500 font-mono font-black">{warningCount} of 3 Allowed Warnings</span>
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Exceeding 3 warnings will result in immediate automatic exam submission.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                enterFullscreen();
                                setShowWarningModal(false);
                              }}
                              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-base shadow-lg transition-all"
                            >
                              Re-enter Fullscreen & Continue Exam
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap justify-between items-center mb-8 border-b border-emerald-500/20 pb-4 gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {activeModule.title}
                          </h2>
                          <div className="flex items-center space-x-3 mt-1">
                            <p className="text-sm text-emerald-400/80 font-medium font-mono">
                              Question {currentQuestionIndex + 1} of{" "}
                              {activeModule.questions.length}
                            </p>
                            <button
                              onClick={() => setShowNavigator(true)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700"
                            >
                              <ListFilter className="w-3.5 h-3.5" />
                              <span>Questions</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={handleFinishTest}
                            disabled={submitState !== null}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {submitState ? "Submitting..." : "Submit Test"}
                          </button>
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center shadow-sm ${warningCount > 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300"}`}>
                            <ShieldAlert className="w-4 h-4 mr-1.5" />
                            <span>Anti-Cheat Guard</span>
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-black/10 font-mono">
                              Warnings: {warningCount}/3
                            </span>
                          </div>

                          {!isFullscreen && (
                            <button
                              onClick={enterFullscreen}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center transition-all shadow"
                            >
                              <Maximize className="w-4 h-4 mr-1.5" /> Fullscreen
                            </button>
                          )}

                          {timeLeft !== null && (
                            <div
                              className={`px-4 py-2 rounded-lg font-mono font-bold text-lg flex items-center ${timeLeft < 60 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 animate-pulse" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                            >
                              <Timer className="w-5 h-5 mr-2" />
                              {formatTime(timeLeft)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="mb-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-3 flex-1 max-w-md mr-4">
                            <span>Progress</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                                style={{ width: `${(Object.keys(answers).length / activeModule.questions.length) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {Object.keys(answers).length} / {activeModule.questions.length} Questions Completed
                          </span>
                        </div>

                        <div className="flex items-start justify-between mb-6">
                          <div className="text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {activeModule.questions[currentQuestionIndex].difficulty && (
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                    activeModule.questions[currentQuestionIndex].difficulty.toLowerCase() === "easy"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                      : activeModule.questions[currentQuestionIndex].difficulty.toLowerCase() === "medium"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                                  }`}
                                >
                                  {activeModule.questions[currentQuestionIndex].difficulty}
                                </span>
                              )}
                              {activeModule.questions[currentQuestionIndex].topic && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 uppercase tracking-wider">
                                  {activeModule.questions[currentQuestionIndex].topic}
                                </span>
                              )}
                              {(activeModule.questions[currentQuestionIndex].subTopic || activeModule.questions[currentQuestionIndex].sub_topic) && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 uppercase tracking-wider">
                                  {activeModule.questions[currentQuestionIndex].subTopic || activeModule.questions[currentQuestionIndex].sub_topic}
                                </span>
                              )}
                              {activeModule.questions[currentQuestionIndex].subject && !activeModule.questions[currentQuestionIndex].topic && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 uppercase tracking-wider">
                                  {activeModule.questions[currentQuestionIndex].subject}
                                </span>
                              )}
                            </div>
                            <MathText
                              content={
                                activeModule.questions[currentQuestionIndex]
                                  .question
                              }
                            />
                          </div>
                          <button
                            onClick={toggleReview}
                            className={`ml-4 shrink-0 px-3 py-1.5 rounded-lg flex items-center text-sm font-bold transition-colors border-2 ${markedForReview[activeModule.questions[currentQuestionIndex].id] ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-750"}`}
                          >
                            <Flag className="w-4 h-4 mr-1.5" />
                            Review
                          </button>
                        </div>

                        {(activeModule.questions[currentQuestionIndex].image ||
                          activeModule.questions[currentQuestionIndex].svgCode ||
                          activeModule.questions[currentQuestionIndex].svg_code) && (
                          <div className="mb-8">
                            <SvgDiagram
                              svgCode={
                                activeModule.questions[currentQuestionIndex].image ||
                                activeModule.questions[currentQuestionIndex].svgCode ||
                                activeModule.questions[currentQuestionIndex].svg_code
                              }
                              className="max-h-64 rounded-lg shadow-sm border border-emerald-500/20"
                              containerClassName=""
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          {activeModule.questions[
                            currentQuestionIndex
                          ].options.map((option, idx) => {
                            const isSelected =
                              answers[
                                activeModule.questions[currentQuestionIndex].id
                              ] === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectOption(idx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex items-start ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100"
                                    : "border-emerald-500/20 glass-panel text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600"
                                }`}
                              >
                                <span className="shrink-0 w-6 text-slate-400 font-bold mr-2 mt-1">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <div className="flex-1">
                                  {option.startsWith("data:image/") ||
                                  option.trim().startsWith("<svg") ? (
                                    <SvgDiagram
                                      svgCode={option}
                                      className="max-h-24 w-auto object-contain"
                                      containerClassName=""
                                    />
                                  ) : (
                                    <MathText content={option} />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-6 border-t border-emerald-500/20 flex-wrap gap-4">
                        <div className="flex space-x-3">
                          <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center px-6 py-3 glass-panel border-[1.5px] border-emerald-500/20 text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hidden font-bold rounded-xl shadow-sm transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5 mr-1" />
                            Prev
                          </button>

                          {answers[
                            activeModule.questions[currentQuestionIndex].id
                          ] !== undefined && (
                            <button
                              onClick={handleClearSelection}
                              className="flex items-center px-6 py-3 glass-panel border-[1.5px] border-emerald-500/20 text-slate-700 dark:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-xl shadow-sm transition-colors"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleClearSelection();
                              handleNextQuestion();
                            }}
                            disabled={
                              currentQuestionIndex ===
                              activeModule.questions.length - 1
                            }
                            className="flex items-center px-6 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:hidden"
                          >
                            Skip
                            <ChevronRight className="w-5 h-5 ml-1" />
                          </button>
                        </div>
                        <div className="flex space-x-3 ml-auto">
                          <button
                            onClick={handleNextQuestion}
                            className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
                          >
                            Next
                            <ChevronRight className="w-5 h-5 ml-1" />
                          </button>
                        </div>
                      </div>

                      {/* Question Navigator Drawer Overlay */}
                      {showNavigator && activeModule && (
                        <div 
                          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in"
                          onClick={() => setShowNavigator(false)}
                        >
                          <div 
                            className="w-full max-w-[360px] h-full bg-slate-900 border-l border-emerald-500/20 shadow-2xl flex flex-col p-6 text-white animate-slide-in-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-emerald-500/20">
                              <div>
                                <h3 className="text-lg font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                                  <ListFilter className="w-5 h-5 text-emerald-500" />
                                  <span>Question Navigator</span>
                                </h3>
                              </div>
                              <button 
                                onClick={() => setShowNavigator(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                              >
                                <X className="w-6 h-6" />
                              </button>
                            </div>

                            {/* Progress Stats */}
                            <div className="py-4 space-y-3">
                              {(() => {
                                const total = activeModule.questions.length;
                                const answered = Object.keys(answers).length;
                                const marked = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
                                const remaining = total - answered;
                                const progressPct = total > 0 ? (answered / total) * 100 : 0;

                                return (
                                  <>
                                    <div className="flex justify-between text-xs font-bold text-slate-400">
                                      <span>{answered} Answered</span>
                                      <span>{remaining} Remaining</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                                      <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
                                      <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50">
                                        <span className="block text-emerald-400 text-sm font-bold font-mono">{answered}</span>
                                        <span>Answered</span>
                                      </div>
                                      <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50">
                                        <span className="block text-amber-400 text-sm font-bold font-mono">{marked}</span>
                                        <span>Review</span>
                                      </div>
                                      <div className="bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/50">
                                        <span className="block text-slate-300 text-sm font-bold font-mono">{remaining}</span>
                                        <span>Remaining</span>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Questions Grid */}
                            <div className="flex-1 overflow-y-auto pr-1 my-2 custom-scrollbar">
                              <div className="grid grid-cols-5 gap-2.5 p-1">
                                {activeModule.questions.map((q, idx) => {
                                  const isAnswered = answers[q.id] !== undefined;
                                  const isReview = markedForReview[q.id];
                                  const isCurrent = currentQuestionIndex === idx;
                                  const isVisited = visitedQuestions.has(q.id);

                                  let bgClass = "bg-slate-800/40 border-slate-700/80 text-slate-400 hover:border-slate-500 hover:text-white";

                                  if (isCurrent) {
                                    bgClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/30 font-black shadow-[0_0_8px_rgba(16,185,129,0.2)]";
                                  } else if (isReview) {
                                    bgClass = "border-amber-500 bg-amber-500/10 text-amber-400 font-bold";
                                  } else if (isAnswered) {
                                    bgClass = "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold";
                                  } else if (isVisited) {
                                    bgClass = "border-slate-500 bg-slate-800/60 text-slate-300";
                                  }

                                  return (
                                    <button
                                      key={q.id}
                                      onClick={() => {
                                        setCurrentQuestionIndex(idx);
                                        if (window.innerWidth < 768) {
                                          setShowNavigator(false);
                                        }
                                      }}
                                      className={`h-11 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center relative ${bgClass}`}
                                      aria-current={isCurrent ? "true" : undefined}
                                      title={`Go to Question ${idx + 1}`}
                                    >
                                      <span>{idx + 1}</span>
                                      {isReview && (
                                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Legend */}
                            <div className="pt-4 border-t border-emerald-500/20 space-y-2 text-xs font-semibold text-slate-400">
                              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/60" />
                                  <span>Answered</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="w-3.5 h-3.5 rounded bg-slate-800/40 border border-slate-700/80" />
                                  <span>Not Answered</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="w-3.5 h-3.5 rounded bg-amber-500/10 border border-amber-500" />
                                  <span>Review</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="w-3.5 h-3.5 rounded bg-slate-800/60 border border-slate-500" />
                                  <span>Visited</span>
                                </div>
                                <div className="col-span-2 flex items-center space-x-2">
                                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500 ring-2 ring-emerald-500/30" />
                                  <span>Current Question</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
                  </div>
                </div>
              )}

              {/* Standard Dashboard Tab views */}
              {!activeModule && !activeMasterModule && (
                <>
                  {activeTab === "dashboard" && (
                    loadingMetadata ? (
                      <DashboardSkeleton />
                    ) : (
                      <StudentDashboardView
                        user={currentUserDoc || user}
                        stats={stats}
                        medalInfo={medalInfo}
                        modules={modules}
                        moduleScores={moduleScores}
                        companies={companies}
                        activeBranches={activeBranches}
                        placementMissions={placementMissions}
                        leaderboard={leaderboard}
                        onTabChange={handleNavClick}
                        onStartModule={handleStartModule}
                      />
                    )
                  )}

                  {activeTab === "general" && (
                    <StudentHierarchyView
                      currentUser={currentUserDoc}
                      onOpenModule={handleStartModule}
                      assessmentPlanFilter={assessmentPlanFilter}
                      onSelectPurchaseItem={(item, type) => setPurchaseItem({ item, type })}
                      onRedirectToTab={(tab) => setActiveTab(tab)}
                    />
                  )}

                  {activeTab === "companies" && (
                    loadingMetadata ? (
                      <CompanyCardSkeleton />
                    ) : (
                      <StudentCompaniesView
                        companies={companies}
                        activeCompany={activeCompany}
                        setActiveCompany={setActiveCompany}
                        assessmentPlanFilter={assessmentPlanFilter}
                        hasAccessToCompany={hasAccessToCompany}
                        hasItemAccess={hasItemAccess}
                        modules={modules}
                        moduleScores={moduleScores}
                        purchaseItem={purchaseItem}
                        onSelectPurchaseItem={(item, type) => setPurchaseItem({ item, type, currentUser: currentUserDoc })}
                        onBackFromPurchase={() => setPurchaseItem(null)}
                        submitAccessRequest={submitAccessRequest}
                        accessRequestSent={accessRequestSent}
                        onStartModule={handleStartModule}
                        plans={plans}
                        currentUser={currentUserDoc}
                      />
                    )
                  )}

                  {activeTab === "placement-mission" && (
                    <PlacementMissionView
                      currentUser={currentUserDoc}
                      onStartModule={handleStartModule}
                    />
                  )}

                  {activeTab === "plans" && (
                    loadingMetadata ? (
                      <PlanCardSkeleton />
                    ) : (
                      <StudentPlansView
                        plans={plans}
                        currentUser={currentUserDoc}
                        purchaseItem={purchaseItem}
                        onSelectPurchaseItem={(item, type) => setPurchaseItem({ item, type })}
                        onBackFromPurchase={() => setPurchaseItem(null)}
                        onStartAssessmentFlow={handleStartAssessmentFlow}
                      />
                    )
                  )}

                  {activeTab === "feedback" && (
                    <StudentFeedbackView currentUser={currentUserDoc} />
                  )}

                  {activeTab === "profile" && (
                    loadingMetadata ? (
                      <ProfileSkeleton />
                    ) : (
                      <StudentProfileView
                        currentUser={currentUserDoc}
                        profileForm={profileForm}
                        setProfileForm={setProfileForm}
                        onSaveProfile={handleSaveProfile}
                        stats={stats}
                        medalInfo={medalInfo}
                        moduleScores={moduleScores}
                        activeBranches={activeBranches}
                        isChangingBranch={isChangingBranch}
                        setIsChangingBranch={setIsChangingBranch}
                        onSwitchBranch={async (b) => {
                          setTempSelectedBranch(b);
                          setShowBranchConfirmation(true);
                        }}
                      />
                    )
                  )}
                </>
              )}
            </div> {/* Closes Div #4 (max-w-7xl) */}
          </div> {/* Closes Div #3 (std-content-scroll) */}
        </div> {/* Closes Div #2 (std-main-wrapper) */}

      {/* Switch Specialty confirmation Modal */}
      {showBranchConfirmation && tempSelectedBranch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#0E1629] border border-slate-850 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-6 text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 text-emerald-500 mx-auto bg-emerald-500/10 rounded-full p-2 mb-2 flex items-center justify-center animate-pulse">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-100 uppercase tracking-wider font-mono">
              Confirm Specialty Switch
            </h3>
            <p className="text-xs text-slate-450 font-medium">
              Change academic focus from <span className="font-bold text-emerald-455">'{currentUserDoc?.branch || "None"}'</span> to <span className="font-bold text-emerald-455">'{tempSelectedBranch.name}'</span>?
            </p>
            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-left text-[11px] text-amber-500 space-y-1">
              <p className="font-bold uppercase">Attention:</p>
              <p>Your eligible companies, learning path modules, and missions may change according to this specialization.</p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowBranchConfirmation(false);
                  setTempSelectedBranch(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowBranchConfirmation(false);
                  setIsChangingBranch(false);
                  setIsProfileOpen(false);
                  try {
                    await setDoc(
                      doc(db, "users", auth.currentUser.uid),
                      {
                        branchId: tempSelectedBranch.id,
                        branch: tempSelectedBranch.name,
                        updatedAt: Date.now(),
                      },
                      { merge: true }
                    );
                    showToast(`Successfully switched to ${tempSelectedBranch.name}!`, "success");
                    setCurrentUserDoc(prev => ({
                      ...prev,
                      branchId: tempSelectedBranch.id,
                      branch_id: tempSelectedBranch.id,
                      branch: tempSelectedBranch.name
                    }));
                    setProfileForm(prev => ({
                      ...prev,
                      branch: tempSelectedBranch.name,
                      branchId: tempSelectedBranch.id
                    }));
                    window.location.reload();
                  } catch (err) {
                    showToast("Failed to switch specialty: " + err.message, "error");
                  }
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-600/10"
              >
                Switch Specialty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
