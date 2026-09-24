import React, { useState, useEffect } from "react";
import { OperationType, collection, db, deleteDoc, doc, handleFirestoreError, onSnapshot, query } from "../../firebase";
import { Trash2, MessageSquare, AlertCircle, Sparkles, AlertTriangle, Eye, X } from "lucide-react";
import DataTable from "../common/DataTable";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { showToast } from "../common/Toast";

export function AdminFeedbacksTab({ isContentManager = false }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "feedbacks")),
      (snapshot) => {
        setFeedbacks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "feedbacks");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "feedbacks", deleteId));
      showToast("Feedback deleted successfully.", "success");
      setSelectedFeedback(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "feedbacks");
    } finally {
      setDeleteId(null);
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case "bug":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "improvement":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "feature":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const filtered = feedbacks.filter((f) => {
    if (filterType === "all") return true;
    return f.feedbackType === filterType;
  });

  const columns = [
    {
      label: "Date Submitted",
      key: "createdAt",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      label: "Student Profile",
      key: "userName",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-white">{row.userName || "Anonymous Student"}</div>
          <div className="text-xs text-slate-400 mt-0.5">{row.userEmail || "No Email"}</div>
        </div>
      ),
    },
    {
      label: "Feedback Category",
      key: "feedbackType",
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getBadgeStyle(row.feedbackType)}`}>
          {row.feedbackType || "General"}
        </span>
      ),
    },
    {
      label: "Message Snippet",
      key: "message",
      render: (row) => <div className="max-w-xs truncate text-slate-600 dark:text-slate-350">{row.message}</div>,
    },
    {
      label: "Action",
      key: "id",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setSelectedFeedback(row)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Read
          </button>
          {!isContentManager && (
            <button
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterTabs = (
    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl whitespace-nowrap scrollbar-none border border-slate-200/50 dark:border-slate-800">
      {["all", "general", "bug", "improvement", "feature"].map((s) => (
        <button
          key={s}
          onClick={() => setFilterType(s)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterType === s ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"}`}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Student Feedback Inbox</h2>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Review feature suggestions, UI/UX requests, and bugs reported by users in real-time.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchKey="message"
        searchPlaceholder="Search feedback messages..."
        filters={filterTabs}
      />

      {/* Review Drawer */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedFeedback(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-8 flex flex-col h-full z-50 animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-6 mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider text-sm">
                Feedback Message
              </h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-105 dark:border-slate-850 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  {(selectedFeedback.userName || "A").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedFeedback.userName || "Anonymous Student"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedFeedback.userEmail || "No Email"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getBadgeStyle(selectedFeedback.feedbackType)}`}>
                  {selectedFeedback.feedbackType || "General"}
                </span>
                <span className="text-xs text-slate-400 block mt-1 font-mono">
                  Submitted on: {selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleString() : "N/A"}
                </span>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>
            </div>

            {!isContentManager && (
              <div className="border-t border-slate-200 dark:border-slate-850 pt-6 mt-6">
                <button
                  onClick={() => setDeleteId(selectedFeedback.id)}
                  className="w-full py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Delete Feedback
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Feedback"
        message="Are you sure you want to permanently delete this student feedback?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
