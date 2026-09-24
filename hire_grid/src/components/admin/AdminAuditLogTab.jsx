import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import { ShieldAlert, RefreshCw } from "lucide-react";
import DataTable from "../common/DataTable";

export function AdminAuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/security-logs");
      if (res.success) {
        setLogs(res.logs || []);
      } else {
        showToast(res.error || "Failed to load security logs.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to security logs API.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getEventBadge = (type) => {
    switch (type) {
      case "screenshot_attempt":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "print_attempt":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "copy_attempt":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "tab_switch":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "window_blur":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === "all") return true;
    return log.eventType === filterType;
  });

  const columns = [
    {
      label: "Violation Time",
      key: "createdAt",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      label: "Student",
      key: "userName",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-white">{row.userName}</div>
          <div className="text-xs text-slate-450 dark:text-slate-500 font-mono mt-0.5">{row.userEmail}</div>
        </div>
      ),
    },
    {
      label: "Violation Trigger",
      key: "eventType",
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider font-mono ${getEventBadge(row.eventType)}`}>
          {row.eventType.replace("_", " ")}
        </span>
      ),
    },
    {
      label: "Telemetry Details & Context",
      key: "details",
      render: (row) => <span className="text-slate-600 dark:text-slate-350 text-xs">{row.details}</span>,
    },
  ];

  const filterTabs = (
    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl whitespace-nowrap scrollbar-none border border-slate-200/50 dark:border-slate-800 overflow-x-auto max-w-full">
      {["all", "screenshot_attempt", "print_attempt", "copy_attempt", "tab_switch", "window_blur"].map((s) => (
        <button
          key={s}
          onClick={() => setFilterType(s)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterType === s ? "bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
        >
          {s.replace("_", " ")}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            Security & Anti-Cheating Telemetry
          </h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Real-time administrative feed capturing student screenshots, tab switching, and printing violations during exams.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider"
          title="Sync Violation Stream"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
          <span>Sync</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        searchKey="userName"
        searchPlaceholder="Search logs by student name..."
        filters={filterTabs}
      />
    </div>
  );
}
