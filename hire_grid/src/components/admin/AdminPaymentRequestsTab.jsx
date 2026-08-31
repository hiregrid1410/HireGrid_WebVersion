import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { OperationType, collection, db, deleteDoc, doc, handleFirestoreError, onSnapshot, orderBy, query, updateDoc } from "../../firebase";
import { Check, X, Trash2, Search, Filter, ShieldCheck, Download, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { logAudit } from "../../auditLogger";
import DataTable from "../common/DataTable";

export function AdminPaymentRequestsTab({ userName = "Admin" }) {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [deleteRequestId, setDeleteRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "payment_requests"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "payment_requests");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleAction = async (req, action) => {
    try {
      await updateDoc(doc(db, "payment_requests", req.id), { status: action });

      if (action === "approved") {
        const userRef = doc(db, "users", req.userId);
        let updateData = {};
        let expiry = null;

        if (req.duration !== null) {
          if (req.duration === 99999) {
            expiry = null;
          } else if (req.duration <= 12) {
            expiry = Date.now() + req.duration * 30 * 24 * 60 * 60 * 1000;
          } else if (req.duration === 999) {
            expiry = null;
          } else {
            expiry = Date.now() + req.duration * 24 * 60 * 60 * 1000;
          }
        }

        if (req.itemType === "full_premium") {
          updateData["fullPremiumExpiry"] = expiry;
          updateData["hasFullPremium"] = true;
        } else if (req.itemType === "plan") {
          updateData["activePlanId"] = req.itemId;
          updateData["planExpiry"] = expiry;
        } else if (req.itemType === "company") {
          updateData[`grantedCompanyAccess.${req.itemId}`] = expiry;
        } else if (req.itemType === "subject") {
          updateData[`grantedSubjectAccess.${req.itemId}`] = expiry;
        } else if (req.itemType === "topic") {
          updateData[`grantedTopicAccess.${req.itemId}`] = expiry;
        } else if (req.itemType === "exam") {
          updateData[`grantedExamAccess.${req.itemId}`] = expiry;
        } else if (req.itemType === "module") {
          updateData[`grantedModuleAccess.${req.itemId}`] = expiry;
        }

        if (Object.keys(updateData).length > 0) {
          await api.put(`/users/${req.userId}`, updateData).catch(() => {});
          await updateDoc(userRef, updateData);
        }
      }

      await logAudit(
        userName,
        `${action === "approved" ? "Approved" : "Rejected"} payment request for ${req.itemName} from ${req.userEmail}`
      );
      setSelectedRequest(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "payment_requests");
    }
  };

  const confirmDelete = async () => {
    if (!deleteRequestId) return;
    try {
      await deleteDoc(doc(db, "payment_requests", deleteRequestId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "payment_requests");
    } finally {
      setDeleteRequestId(null);
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
        <div className="font-mono text-xs">
          <div>{new Date(row.createdAt).toLocaleDateString()}</div>
          <div className="text-slate-400 mt-0.5">{new Date(row.createdAt).toLocaleTimeString()}</div>
        </div>
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
      label: "Plan & Duration",
      key: "itemName",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-750 dark:text-slate-200">{row.itemName}</span>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1 flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
              {(row.itemType || "full_premium").replace("_", " ")}
            </span>
            <span>• {row.duration ? `${row.duration} Months` : "Permanent"}</span>
          </div>
        </div>
      ),
    },
    {
      label: "Payment Details",
      key: "transactionId",
      render: (row) => (
        <div>
          <div className="font-mono text-xs font-semibold">{row.transactionId || "N/A"}</div>
          {row.paymentMethod && <div className="text-[10px] text-slate-400 mt-0.5 uppercase">{row.paymentMethod}</div>}
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
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setSelectedRequest(row)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Review
          </button>
          {row.status !== "pending" && (
            <button
              onClick={() => setDeleteRequestId(row.id)}
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
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Purchase Requests</h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Review student payment details, verify transaction proof, and grant premium workspace permissions.
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
                Review Request Details
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
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Items Requested</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Item Type</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1 capitalize">
                      {(selectedRequest.itemType || "full_premium").replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                      {selectedRequest.duration ? `${selectedRequest.duration} Months` : "Permanent"}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Plan Name</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">{selectedRequest.itemName}</p>
                </div>
              </div>

              {/* Transaction Proof */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Transaction Details</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedRequest.transactionId || "N/A"}</span>
                  </div>
                  {selectedRequest.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Method:</span>
                      <span className="font-bold text-slate-800 dark:text-white uppercase">{selectedRequest.paymentMethod}</span>
                    </div>
                  )}
                  {selectedRequest.amount && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="font-bold text-emerald-500 font-sans">₹{selectedRequest.amount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Proof if exists */}
              {selectedRequest.paymentProofUrl && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Payment Screenshot</h4>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/10">
                    <img
                      src={selectedRequest.paymentProofUrl}
                      alt="Payment proof"
                      className="max-h-60 w-full object-contain mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-200 dark:border-slate-850 pt-6 mt-6 flex gap-4">
              {selectedRequest.status === "pending" ? (
                <>
                  <button
                    onClick={() => handleAction(selectedRequest, "rejected")}
                    className="flex-1 py-3 border border-rose-500/20 bg-rose-550/10 text-rose-500 hover:bg-rose-550/20 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(selectedRequest, "approved")}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve Purchase
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

      <ConfirmDialog
        isOpen={deleteRequestId !== null}
        title="Delete Request Record"
        message="Are you sure you want to delete this request record forever?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRequestId(null)}
      />
    </div>
  );
}
