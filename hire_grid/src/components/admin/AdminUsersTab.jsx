import React, { useState, useEffect } from "react";
import { OperationType, collection, db, deleteDoc, doc, getDoc, getDocs, handleFirestoreError, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from "../../firebase";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import { Trash2, UserPlus, ShieldCheck, Pencil, Key, Laptop, Award, Calendar, X, Plus, LogOut, ArrowRight, Shield } from "lucide-react";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { logAudit } from "../../auditLogger";
import DataTable from "../common/DataTable";

export function AdminUsersTab({ isSuperAdmin, adminName }) {
  const [activeTab, setActiveTab] = useState("students"); // students, staff, grant_matrix
  const [adminUsers, setAdminUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [plans, setPlans] = useState([]);

  // Create Staff state
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "content_manager" });
  const [error, setError] = useState("");

  // Edit Staff state
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "", role: "content_manager" });
  const [editError, setEditError] = useState("");

  // Access Grant State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [grantType, setGrantType] = useState("full_premium");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("permanent");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Selected student for Profile Drawer
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  // Deletions state
  const [deleteAdminId, setDeleteAdminId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [deleteError, setDeleteError] = useState("");

  const fetchAdmins = async () => {
    try {
      const res = await api.get("/admin_users");
      if (res.success) setAdminUsers(res.admin_users);
    } catch (err) {
      console.error("Failed to load staff accounts:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users");
      if (res.success && res.users) {
        setStudents(res.users.filter((u) => u.role === "student" || !u.role));
      }
    } catch (err) {
      console.error("Fetch students error:", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchStudents();

    const unsubStudents = onSnapshot(
      query(collection(db, "users")),
      (snapshot) => {
        if (snapshot.docs.length > 0) {
          const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setStudents(fetched.filter((u) => u.role === "student"));

          // Sync drawer state if open
          if (selectedStudentProfile) {
            const updated = fetched.find((u) => u.id === selectedStudentProfile.id);
            if (updated) setSelectedStudentProfile(updated);
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "users")
    );

    const unsubCompanies = onSnapshot(
      query(collection(db, "companies")),
      (snapshot) => {
        setCompanies(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "companies")
    );

    const unsubNodes = onSnapshot(
      collection(db, "hierarchy_nodes"),
      (snapshot) => {
        setNodes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error(error)
    );

    const unsubPlans = onSnapshot(
      collection(db, "plans"),
      (snapshot) => {
        setPlans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error(error)
    );

    return () => {
      unsubStudents();
      unsubCompanies();
      unsubNodes();
      unsubPlans();
    };
  }, []);

  const handleUpdateDeviceLimit = async (studentId, newLimit) => {
    try {
      await api.put(`/users/${studentId}`, { maxDevices: newLimit });
      showToast(`Device limit updated to ${newLimit}.`, "success");
      fetchStudents();
    } catch (err) {
      showToast("Failed to update device limit: " + (err.message || "Error"), "error");
    }
  };

  const handleResetDevices = async (studentId) => {
    try {
      await api.put(`/users/${studentId}`, { allowedDevices: [], deviceId: null });
      showToast("Student device registrations reset successfully.", "success");
      fetchStudents();
    } catch (err) {
      showToast("Failed to reset devices: " + (err.message || "Error"), "error");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setError("All fields are required.");
      return;
    }
    try {
      await api.post("/admin_users", newAdmin);
      setIsCreatingAdmin(false);
      setNewAdmin({ name: "", email: "", password: "", role: "content_manager" });
      setError("");
      showToast("Staff account created successfully.", "success");
      fetchAdmins();
    } catch (err) {
      setError(err.message || "Failed to create account.");
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.email) {
      setEditError("Name and Email are required.");
      return;
    }
    try {
      const updateData = { name: editForm.name, email: editForm.email.trim(), role: editForm.role };
      if (editForm.password) updateData.password = editForm.password;

      await api.put(`/admin_users/${editingAdmin.id}`, updateData);
      setEditingAdmin(null);
      setEditError("");
      showToast("Staff account updated.", "success");
      fetchAdmins();
    } catch (err) {
      setEditError(err.message || "Failed to update account.");
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!deleteAdminId) return;
    try {
      await api.delete(`/admin_users/${deleteAdminId}`);
      showToast("Staff account deleted.", "success");
      fetchAdmins();
    } catch (err) {
      console.error("Failed to delete admin:", err);
    } finally {
      setDeleteAdminId(null);
    }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || (grantType !== "full_premium" && !selectedItemId)) {
      showToast("Please select both a student and an item.", "warning");
      return;
    }

    try {
      let expiresAt = null;
      if (selectedDuration !== "permanent") {
        const months = parseInt(selectedDuration, 10);
        expiresAt = Date.now() + months * 30 * 24 * 60 * 60 * 1000;
      }

      if (grantType === "plan") {
        await api.put(`/users/${selectedStudentId}`, { activePlanId: selectedItemId, planExpiry: expiresAt }).catch(() => {});
        await updateDoc(doc(db, "users", selectedStudentId), { activePlanId: selectedItemId, planExpiry: expiresAt });
        showToast("Subscription plan assigned successfully.", "success");
      } else {
        let updateField = "";
        if (grantType === "full_premium") updateField = "fullPremiumExpiry";
        else if (grantType === "company") updateField = `grantedCompanyAccess.${selectedItemId}`;
        else if (grantType === "subject") updateField = `grantedSubjectAccess.${selectedItemId}`;
        else if (grantType === "topic") updateField = `grantedTopicAccess.${selectedItemId}`;
        else if (grantType === "exam") updateField = `grantedExamAccess.${selectedItemId}`;
        else if (grantType === "module") updateField = `grantedModuleAccess.${selectedItemId}`;

        await api.put(`/users/${selectedStudentId}`, {
          [updateField]: expiresAt,
          ...(grantType === "full_premium" ? { hasFullPremium: true } : {}),
        }).catch(() => {});
        await updateDoc(doc(db, "users", selectedStudentId), {
          [updateField]: expiresAt,
          ...(grantType === "full_premium" ? { hasFullPremium: true } : {}),
        });
        showToast("Access granted successfully.", "success");
      }

      setSelectedItemId("");
      setSelectedDuration("permanent");
      fetchStudents();
    } catch (err) {
      showToast(err.message || "Failed to grant access.", "error");
    }
  };

  const handleRevokeAccess = async (studentId, type, itemId) => {
    try {
      const { deleteField } = await import("../../firebase");
      let updateField = "";
      if (type === "full_premium") {
        await api.put(`/users/${studentId}`, { fullPremiumExpiry: "DELETE_FIELD", hasFullPremium: false }).catch(() => {});
        await updateDoc(doc(db, "users", studentId), { fullPremiumExpiry: deleteField(), hasFullPremium: false });
      } else if (type === "plan") {
        await api.put(`/users/${studentId}`, { activePlanId: "DELETE_FIELD", planExpiry: "DELETE_FIELD" }).catch(() => {});
        await updateDoc(doc(db, "users", studentId), { activePlanId: deleteField(), planExpiry: deleteField() });
      } else {
        if (type === "company") updateField = `grantedCompanyAccess.${itemId}`;
        else if (type === "subject") updateField = `grantedSubjectAccess.${itemId}`;
        else if (type === "topic") updateField = `grantedTopicAccess.${itemId}`;
        else if (type === "exam") updateField = `grantedExamAccess.${itemId}`;
        else if (type === "module") updateField = `grantedModuleAccess.${itemId}`;

        await updateDoc(doc(db, "users", studentId), { [updateField]: deleteField() });
      }
      showToast("Access revoked successfully.", "success");
      fetchStudents();
    } catch (err) {
      showToast(err.message || "Failed to revoke access.", "error");
    }
  };

  const initiateDeleteStudent = (studentId, name) => {
    if (!isSuperAdmin) {
      showToast("Permission Denied: Only Super Admins can delete users.", "warning");
      return;
    }
    setUserToDelete({ id: studentId, name });
    setDeleteStatus("idle");
    setDeleteError("");
  };

  const executeDeleteStudent = async () => {
    if (!userToDelete) return;
    setDeleteStatus("deleting");
    try {
      let operations = [];
      const studentId = userToDelete.id;

      const addQueryDocs = async (colName, filterField) => {
        try {
          const snap = await getDocs(query(collection(db, colName), where(filterField, "==", studentId)));
          snap.forEach((d) => operations.push({ ref: d.ref }));
        } catch (e) {}
      };

      await addQueryDocs("scores", "studentId");
      await addQueryDocs("gateScores", "studentId");
      await addQueryDocs("purchases", "userId");
      await addQueryDocs("payment_requests", "userId");
      await addQueryDocs("notifications", "userId");

      operations.push({ ref: doc(db, "users", studentId) });

      const BATCH_SIZE = 500;
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        operations.slice(i, i + BATCH_SIZE).forEach((op) => batch.delete(op.ref));
        await batch.commit();
      }

      if (adminName) {
        await logAudit(adminName, `Permanently Deleted User: ID=${studentId}, Email=${userToDelete.name}`).catch(() => {});
      }

      setDeleteStatus("success");
      setSelectedStudentProfile(null);
      fetchStudents();
    } catch (err) {
      setDeleteError(err.message || err.toString());
      setDeleteStatus("error");
    }
  };

  const getItemName = (type, id) => {
    if (type === "company") return companies.find((c) => c.id === id)?.name || id;
    if (type === "exam") return nodes.find((n) => n.id === id && n.type === "general_branch")?.name || id;
    if (["subject", "topic"].includes(type)) return nodes.find((n) => n.id === id)?.name || id;
    if (type === "plan") return plans.find((p) => p.id === id)?.name || id;
    return id;
  };

  const openEditAdmin = (user) => {
    setEditingAdmin(user);
    setEditForm({ name: user.name, email: user.email, password: "", role: user.role });
    setEditError("");
  };

  // Build Tables columns
  const studentColumns = [
    {
      label: "Name & Email",
      key: "name",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-white">{row.name || "N/A"}</div>
          <div className="text-xs text-slate-400 mt-0.5">{row.email}</div>
        </div>
      ),
    },
    {
      label: "Registered Devices",
      key: "allowedDevices",
      render: (row) => {
        const allowedCount = Array.isArray(row.allowedDevices) ? row.allowedDevices.length : row.deviceId ? 1 : 0;
        const currentMax = row.maxDevices !== undefined ? Number(row.maxDevices) : 1;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            {allowedCount} / {currentMax} Devices
          </span>
        );
      },
    },
    {
      label: "Role",
      key: "role",
      render: () => <span className="text-xs uppercase tracking-wider font-mono text-slate-400">Student</span>,
    },
    {
      label: "Action",
      key: "id",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => setSelectedStudentProfile(row)}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          View Profile
        </button>
      ),
    },
  ];

  const staffColumns = [
    {
      label: "Name",
      key: "name",
      sortable: true,
      render: (row) => <div className="font-bold text-slate-850 dark:text-white">{row.name}</div>,
    },
    {
      label: "Email / ID",
      key: "email",
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{row.email}</span>,
    },
    {
      label: "Role",
      key: "role",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 capitalize">
          {row.role.replace("_", " ")}
        </span>
      ),
    },
    {
      label: "Actions",
      key: "id",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => openEditAdmin(row)}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-500 rounded-lg border border-slate-200 dark:border-slate-750 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteAdminId(row.id)}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 dark:border-slate-750 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const tabsContent = (
    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl whitespace-nowrap scrollbar-none border border-slate-200/50 dark:border-slate-800">
      <button
        onClick={() => setActiveTab("students")}
        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "students" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
      >
        Students
      </button>
      <button
        onClick={() => setActiveTab("staff")}
        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "staff" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
      >
        Staff & Permissions
      </button>
      <button
        onClick={() => setActiveTab("grant_matrix")}
        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === "grant_matrix" ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
      >
        Access Grant Manager
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">User Accounts</h2>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Configure system staff clearances and students' premium parameters.
          </p>
        </div>
      </div>

      {activeTab === "students" && (
        <DataTable
          columns={studentColumns}
          data={students}
          searchKey="name"
          searchPlaceholder="Search students..."
          filters={tabsContent}
        />
      )}

      {activeTab === "staff" && (
        <DataTable
          columns={staffColumns}
          data={adminUsers}
          searchKey="name"
          searchPlaceholder="Search staff accounts..."
          filters={tabsContent}
          actions={
            <button
              onClick={() => setIsCreatingAdmin(true)}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          }
        />
      )}

      {activeTab === "grant_matrix" && (
        <div className="space-y-6">
          {tabsContent}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-400 mb-4">Grant Access</h3>
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Select Student</label>
                  <input
                    type="text"
                    placeholder="Filter student list..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500"
                  />
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="">Select a student...</option>
                    {students
                      .filter((s) =>
                        (s.name || "").toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                        (s.email || "").toLowerCase().includes(studentSearchQuery.toLowerCase())
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Grant Type</label>
                  <select
                    value={grantType}
                    onChange={(e) => {
                      setGrantType(e.target.value);
                      setSelectedItemId("");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="full_premium">Full Premium (All Access)</option>
                    <option value="plan">Subscription Plan</option>
                    <option value="company">Individual Company</option>
                    <option value="subject">Individual Subject</option>
                    <option value="topic">Individual Topic</option>
                    <option value="exam">Individual Branch</option>
                    <option value="module">Individual Module</option>
                  </select>
                </div>

                {grantType !== "full_premium" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Select Item</label>
                    <select
                      required
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-xs outline-none focus:border-emerald-500"
                    >
                      <option value="">Select an item...</option>
                      {grantType === "plan" &&
                        plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price || 0})
                          </option>
                        ))}
                      {grantType === "company" &&
                        companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.isPremium ? "(Premium)" : ""}
                          </option>
                        ))}
                      {grantType !== "company" &&
                        grantType !== "plan" &&
                        nodes
                          .filter((n) => n.type === (grantType === "exam" ? "general_branch" : `general_${grantType}`))
                          .map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.name} {n.isPremium ? "(Premium)" : ""}
                            </option>
                          ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Duration</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="12">1 Year</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                >
                  Apply Grant Permission
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-x-auto">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-400 mb-4">Manual Permission Grants</h3>
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <thead className="text-slate-400 text-xs font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Active Permissions Matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
                  {students
                    .filter(
                      (s) =>
                        s.hasFullPremium ||
                        (s.grantedCompanyAccess && Object.keys(s.grantedCompanyAccess).length > 0) ||
                        (s.grantedSubjectAccess && Object.keys(s.grantedSubjectAccess).length > 0) ||
                        (s.grantedTopicAccess && Object.keys(s.grantedTopicAccess).length > 0) ||
                        (s.grantedExamAccess && Object.keys(s.grantedExamAccess).length > 0) ||
                        (s.grantedModuleAccess && Object.keys(s.grantedModuleAccess).length > 0)
                    )
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800 dark:text-white">{student.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{student.email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {student.hasFullPremium && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <span>
                                  Full Premium {student.fullPremiumExpiry ? `(Exp: ${new Date(student.fullPremiumExpiry).toLocaleDateString()})` : "(Permanent)"}
                                </span>
                                <button onClick={() => handleRevokeAccess(student.id, "full_premium", null)} className="hover:text-rose-500 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            )}
                            {student.activePlanId && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <span>
                                  Plan: {getItemName("plan", student.activePlanId)} {student.planExpiry ? `(Exp: ${new Date(student.planExpiry).toLocaleDateString()})` : "(Permanent)"}
                                </span>
                                <button onClick={() => handleRevokeAccess(student.id, "plan", null)} className="hover:text-rose-500 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            )}
                            {["company", "subject", "topic", "exam", "module"].map((type) => {
                              const accessMap =
                                student[
                                  type === "company"
                                    ? "grantedCompanyAccess"
                                    : type === "subject"
                                      ? "grantedSubjectAccess"
                                      : type === "topic"
                                        ? "grantedTopicAccess"
                                        : type === "exam"
                                          ? "grantedExamAccess"
                                          : "grantedModuleAccess"
                                ];
                              if (!accessMap) return null;
                              return Object.entries(accessMap).map(([itemId, expiry]) => {
                                const isExpired = expiry !== null && Date.now() > expiry;
                                return (
                                  <span
                                    key={`${type}-${itemId}`}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isExpired ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}
                                  >
                                    <span>
                                      {getItemName(type, itemId)}{" "}
                                      <span className="opacity-60 text-[9px] uppercase">
                                        ({type === "exam" ? "branch" : type})
                                      </span>{" "}
                                      {expiry ? `(Exp: ${new Date(expiry).toLocaleDateString()})` : "(Permanent)"}
                                    </span>
                                    <button onClick={() => handleRevokeAccess(student.id, type, itemId)} className="hover:text-rose-500 transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                );
                              });
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Staff creation dialog */}
      {isCreatingAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center mb-6">
              <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" />
              New Staff Clearances
            </h3>
            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs mb-4 font-mono">{error}</div>}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-455 dark:text-slate-500 font-mono">Email / User ID</label>
                <input
                  type="text"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-455 dark:text-slate-500 font-mono">Password</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-455 dark:text-slate-500 font-mono">Designated Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                >
                  <option value="content_manager">Content Manager</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingAdmin(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff edit dialog */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-8 animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              Edit Clearances — {editingAdmin.name}
            </h3>
            {editError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs mb-4 font-mono">{editError}</div>}
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Email / User ID</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-450 dark:text-slate-500 font-mono">Designated Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-255 dark:border-slate-805 bg-white dark:bg-slate-950 text-slate-805 dark:text-white text-sm outline-none focus:border-emerald-500"
                >
                  <option value="content_manager">Content Manager</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Drawer */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedStudentProfile(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-8 flex flex-col h-full z-50 animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-6 mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase font-mono tracking-wider text-sm">
                Student Profile details
              </h3>
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-extrabold text-lg shrink-0">
                  {selectedStudentProfile.name ? selectedStudentProfile.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <p className="font-bold text-slate-855 dark:text-white text-base">{selectedStudentProfile.name || "N/A"}</p>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">{selectedStudentProfile.email}</p>
                </div>
              </div>

              {/* Devices Control */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Allowed Devices Config</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Registered Devices limit:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {(Array.isArray(selectedStudentProfile.allowedDevices) ? selectedStudentProfile.allowedDevices.length : selectedStudentProfile.deviceId ? 1 : 0)} / {selectedStudentProfile.maxDevices || 1}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateDeviceLimit(selectedStudentProfile.id, (Number(selectedStudentProfile.maxDevices) || 1) + 1)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-350 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-500" /> Increase Limit
                    </button>
                    <button
                      onClick={() => handleResetDevices(selectedStudentProfile.id)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-350 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Laptop className="w-3.5 h-3.5 text-rose-500" /> Reset Registrations
                    </button>
                  </div>
                </div>
              </div>

              {/* Granted Access Permissions */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Granted Workspace access</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2.5">
                  {!selectedStudentProfile.hasFullPremium &&
                    (!selectedStudentProfile.grantedCompanyAccess || Object.keys(selectedStudentProfile.grantedCompanyAccess).length === 0) &&
                    (!selectedStudentProfile.grantedSubjectAccess || Object.keys(selectedStudentProfile.grantedSubjectAccess).length === 0) &&
                    (!selectedStudentProfile.grantedTopicAccess || Object.keys(selectedStudentProfile.grantedTopicAccess).length === 0) &&
                    (!selectedStudentProfile.grantedExamAccess || Object.keys(selectedStudentProfile.grantedExamAccess).length === 0) &&
                    (!selectedStudentProfile.grantedModuleAccess || Object.keys(selectedStudentProfile.grantedModuleAccess).length === 0) ? (
                      <p className="text-xs text-slate-500 font-medium italic">No active premium access clearances.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedStudentProfile.hasFullPremium && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-bold">
                            Full Premium
                            <button onClick={() => handleRevokeAccess(selectedStudentProfile.id, "full_premium", null)}>
                              <X className="w-3 h-3 hover:text-rose-500" />
                            </button>
                          </span>
                        )}
                        {selectedStudentProfile.activePlanId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-bold">
                            Plan: {getItemName("plan", selectedStudentProfile.activePlanId)}
                            <button onClick={() => handleRevokeAccess(selectedStudentProfile.id, "plan", null)}>
                              <X className="w-3 h-3 hover:text-rose-500" />
                            </button>
                          </span>
                        )}
                        {["company", "subject", "topic", "exam", "module"].map((type) => {
                          const accessMap =
                            selectedStudentProfile[
                              type === "company"
                                ? "grantedCompanyAccess"
                                : type === "subject"
                                  ? "grantedSubjectAccess"
                                  : type === "topic"
                                    ? "grantedTopicAccess"
                                    : type === "exam"
                                      ? "grantedExamAccess"
                                      : "grantedModuleAccess"
                            ];
                          if (!accessMap) return null;
                          return Object.entries(accessMap).map(([itemId, expiry]) => (
                            <span key={`${type}-${itemId}`} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold">
                              {getItemName(type, itemId)} ({type})
                              <button onClick={() => handleRevokeAccess(selectedStudentProfile.id, type, itemId)}>
                                <X className="w-3 h-3 hover:text-rose-500" />
                              </button>
                            </span>
                          ));
                        })}
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-slate-200 dark:border-slate-850 pt-6 mt-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-rose-550 mb-3 font-semibold">Danger Zone</h4>
              <button
                onClick={() => initiateDeleteStudent(selectedStudentProfile.id, selectedStudentProfile.name || selectedStudentProfile.email)}
                className="w-full py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Delete Student Account
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-rose-550/20 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-500 mb-6">
              <Shield className="w-8 h-8" />
              <h3 className="text-xl font-bold uppercase tracking-wider font-mono text-sm">Clear Student Data</h3>
            </div>

            <div className="space-y-4 mb-8 text-slate-700 dark:text-slate-350 text-sm">
              <p>You are about to permanently delete the profile of <span className="font-bold text-slate-900 dark:text-white">{userToDelete.name}</span>. This will purge:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
                <li>Primary User Identity Credentials</li>
                <li>All device security tokens & configurations</li>
                <li>Placement mission cycle achievements & leaderboard scores</li>
                <li>Access matrix records & purchased premium plans</li>
                <li>Inbox alerts & custom feedback notifications</li>
              </ul>
              <p className="font-bold text-rose-600 dark:text-rose-400">This process is irreversible. Continue?</p>
            </div>

            {deleteStatus === "error" && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-mono text-rose-500">
                Purge Failure: {deleteError}
              </div>
            )}

            {deleteStatus === "success" ? (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <p className="font-bold text-emerald-500 mb-1">Purge Complete</p>
                <p className="text-xs text-slate-400 mb-4">Student profile wiped successfully.</p>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={deleteStatus === "deleting"}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteStudent}
                  disabled={deleteStatus === "deleting"}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                >
                  {deleteStatus === "deleting" ? "Purging..." : "Confirm Purge"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteAdminId !== null}
        title="Delete Staff Account"
        message="Are you sure you want to revoke permissions and delete this staff account?"
        onConfirm={confirmDeleteAdmin}
        onCancel={() => setDeleteAdminId(null)}
      />
    </div>
  );
}
