import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  Clock,
  Layers,
  RefreshCw,
  X,
  AlertCircle
} from "lucide-react";
import { api } from "../../lib/api";
import { showToast } from "../common/Toast";
import { PlatformBadge, PlatformFilterTabs } from "./PlatformSelector";
import { ConfirmDialog } from "../common/ConfirmDialog";

export function AdminExamsTab() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("both");
  const [publicationStatus, setPublicationStatus] = useState("PUBLISHED");
  const [isSaving, setIsSaving] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/exams");
      if (res.success && Array.isArray(res.exams)) {
        setExams(res.exams);
      } else {
        setExams([]);
      }
    } catch (err) {
      console.error("Failed to load exams:", err);
      showToast("Failed to load exams: " + (err.message || "Network error"), "error");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setTitle("");
    setDescription("");
    setPlatform("both");
    setPublicationStatus("PUBLISHED");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exam) => {
    setEditingExamId(exam.id);
    setTitle(exam.title || "");
    setDescription(exam.description || "");
    setPlatform(exam.platform || "both");
    setPublicationStatus(exam.publicationStatus || exam.publication_status || "PUBLISHED");
    setIsModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Exam title is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: editingExamId || undefined,
        title: title.trim(),
        description: description.trim(),
        platform,
        publicationStatus
      };

      await api.post("/exams", payload);
      showToast(editingExamId ? "Exam updated successfully!" : "Exam created successfully!", "success");
      setIsModalOpen(false);
      fetchExams();
    } catch (err) {
      showToast(err.message || "Failed to save exam", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/exams/${deleteId}`);
      showToast("Exam deleted successfully", "success");
      setDeleteId(null);
      fetchExams();
    } catch (err) {
      showToast(err.message || "Failed to delete exam", "error");
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      (exam.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const examPlatform = (exam.platform || "both").toLowerCase();
    const matchesPlatform = platformFilter === "all" || examPlatform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Exams Management</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, schedule, and configure formal examinations and assessments across platforms.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchExams}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Exams"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#2563EB]" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exams by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-[#E2E8F0] rounded-xl outline-none focus:border-[#2563EB] text-[#0F172A] placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#64748B] font-medium hidden sm:inline">Platform:</span>
          <PlatformFilterTabs
            selectedPlatform={platformFilter}
            onSelectPlatform={setPlatformFilter}
          />
        </div>
      </div>

      {/* Exams List Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Exam Title</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748B]">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
                      <span>Loading exams data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#64748B]">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-sm text-[#0F172A]">No exams found</p>
                      <p className="text-xs text-[#64748B]">
                        {searchQuery
                          ? "No exams match your search query."
                          : "No exams have been created yet. Click 'Create Exam' to schedule one."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0F172A] text-xs">{exam.title}</p>
                      {exam.description && (
                        <p className="text-[11px] text-[#64748B] truncate max-w-sm mt-0.5">
                          {exam.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <PlatformBadge platform={exam.platform || "both"} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (exam.publicationStatus || exam.publication_status || "PUBLISHED").toUpperCase() === "PUBLISHED"
                            ? "bg-[#DCFCE7] text-[#16A34A]"
                            : "bg-[#FEF3C7] text-[#D97706]"
                        }`}
                      >
                        {exam.publicationStatus || exam.publication_status || "PUBLISHED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] font-mono text-[11px]">
                      {exam.created_at || exam.createdAt
                        ? new Date(exam.created_at || exam.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(exam)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Exam"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(exam.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-[#0F172A] mb-1">
              {editingExamId ? "Edit Examination" : "Create New Examination"}
            </h3>
            <p className="text-xs text-[#64748B] mb-5">
              Configure exam parameters and platform availability.
            </p>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#0F172A] font-semibold mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS NQT Full-Length Mock Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#2563EB] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the topics and rules covered in this exam..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#2563EB] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] font-semibold mb-1">Platform Visibility</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#2563EB] text-[#0F172A]"
                >
                  <option value="both">Both (Web & App)</option>
                  <option value="web">Web Only</option>
                  <option value="app">Mobile App Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] font-semibold mb-1">Publication Status</label>
                <select
                  value={publicationStatus}
                  onChange={(e) => setPublicationStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs outline-none focus:border-[#2563EB] text-[#0F172A]"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft (Admin Only)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? "Saving..." : editingExamId ? "Update Exam" : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Examination"
        message="Are you sure you want to delete this examination? This will remove the exam configuration."
        confirmLabel="Delete Exam"
        onConfirm={handleDeleteExam}
        onCancel={() => setDeleteId(null)}
        isDestructive={true}
      />
    </div>
  );
}

