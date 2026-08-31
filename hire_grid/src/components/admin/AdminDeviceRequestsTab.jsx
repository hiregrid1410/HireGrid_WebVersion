import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Check, X, ShieldAlert, Laptop, ArrowRight } from "lucide-react";
import { showToast } from "../common/Toast";
import DataTable from "../common/DataTable";

export function AdminDeviceRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchRequests = async () => {
    try {
      const res = await api.get("/device-requests");
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      console.error("Fetch device requests error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (request, status) => {
    try {
      await api.put(`/device-requests/${request.id}`, { status });
      showToast(`Device request ${status} successfully!`, "success");
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error("Device Request Process Failed", err);
      showToast("Unable to process request: " + (err.message || "Failed"), "error");
    }
  };

  const filtered = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const columns = [
    {
      label: "Requested Date",
      key: "createdAt",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
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
          <div className="text-xs text-slate-400 mt-0.5">{row.userEmail}</div>
        </div>
      ),
    },
    {
      label: "Requested Device Profile",
      key: "deviceName",
      render: (row) => (
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Laptop className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold">{row.deviceName || "Unknown Device"}</span>
        </div>
      ),
    },
    {
      label: "Status",
      key: "status",
      render: (row) => {
        const styles = {
          pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[row.status]}`}>
            {row.status.toUpperCase()}
          </span>
        );
      },
    },
    {
      label: "Action",
      key: "id",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => setSelectedRequest(row)}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          Review
        </button>
      ),
    },
  ];

  const filterTabs = (
    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl whitespace-nowrap scrollbar-none border border-slate-200/50 dark:border-slate-800">
      {["all", "pending", "approved", "rejected"].map((s) => (
        <button
          key={s}
          onClick={() => setStatusFilter(s)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${statusFilter === s ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Device Change Requests</h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Verify and approve device reset requests when premium students switch browsers or computers.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchKey="userName"
        searchPlaceholder="Search by student name..."
        filters={filterTabs}
      />

      {/* Slide-out Review Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-8 flex flex-col h-full z-50 animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-6 mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider text-sm">
                Device Change Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
              {/* User details */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Student Profile</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    {selectedRequest.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{selectedRequest.userName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedRequest.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Device Specifications</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center gap-3">
                  <Laptop className="w-6 h-6 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {selectedRequest.deviceName || "Unknown Device"}
                    </p>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 font-mono">
                      ID: {selectedRequest.deviceId || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Advisory */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3.5">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-amber-700 dark:text-amber-400">Security Advisory</h5>
                  <p className="text-xs text-amber-600 dark:text-amber-500/90 mt-1 leading-relaxed">
                    By approving this request, you reset the student's registered browser lock. They will be logged out of their previous browser session, and this requested device will be registered as their primary active device.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-200 dark:border-slate-850 pt-6 mt-6 flex gap-4">
              {selectedRequest.status === "pending" ? (
                <>
                  <button
                    onClick={() => handleAction(selectedRequest, "rejected")}
                    className="flex-1 py-3 border border-rose-500/20 bg-rose-550/10 text-rose-500 hover:bg-rose-550/20 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => handleAction(selectedRequest, "approved")}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve & Reset
                  </button>
                </>
              ) : (
                <div className="w-full text-center py-2.5 font-bold uppercase font-mono text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  Request {selectedRequest.status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
