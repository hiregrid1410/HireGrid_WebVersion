import React, { useState } from "react";
import { MessageSquare, CheckCircle } from "lucide-react";
import { db, doc, setDoc } from "../../firebase";
import { showToast } from "../common/Toast";

export function StudentFeedbackView({ currentUser }) {
  const [feedbackType, setFeedbackType] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      const fbId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      await setDoc(doc(db, "feedbacks", fbId), {
        id: fbId,
        userId: currentUser?.id || "anonymous",
        userName: currentUser?.name || "Anonymous",
        userEmail: currentUser?.email || "",
        feedbackType,
        message,
        createdAt: Date.now(),
      });
      setSuccess(true);
      setMessage("");
    } catch (err) {
      showToast("Failed to send feedback: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="std-panel max-w-lg mx-auto animate-in fade-in duration-300">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-6 w-6 mr-3 text-emerald-500" />
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Send Feedback</h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        Let us know what you think, report a bug, or suggest improvements. We read all incoming student feedback!
      </p>

      {success ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={20} />
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">Thank you!</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Your feedback has been submitted successfully to system console.</p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-mono">
              Feedback Category
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all cursor-pointer"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Report a Bug / Problem</option>
              <option value="improvement">Need Improvement</option>
              <option value="feature">Feature Request</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-mono">
              Your Message
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide constructive feedback here..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 transition-colors shadow-md shadow-emerald-600/10"
          >
            {loading ? "Sending..." : "Submit Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
