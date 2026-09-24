import React from "react";
import { User, Award, Flame, Star, Zap, BookOpen, ShieldCheck } from "lucide-react";

export function StudentProfileView({
  currentUser,
  profileForm,
  setProfileForm,
  onSaveProfile,
  stats,
  medalInfo,
  moduleScores = {},
  activeBranches = [],
  isChangingBranch,
  setIsChangingBranch,
  onSwitchBranch,
}) {
  const testsAttempted = Object.keys(moduleScores).length;
  const scoreValues = Object.values(moduleScores);
  const averageScore =
    scoreValues.length > 0
      ? Math.round(scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length)
      : 0;

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      {/* ── Left Column: Profile Card & Stats ── */}
      <div className="lg:col-span-1 space-y-6">
        <div className="std-panel text-center relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-500 p-1 mx-auto shadow-lg">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#0E1629] flex items-center justify-center text-slate-800 dark:text-slate-100 font-bold text-xl">
              {getInitials(currentUser?.name)}
            </div>
          </div>

          <h3 className="mt-4 font-black text-slate-800 dark:text-slate-100 text-lg leading-tight">
            {currentUser?.name || "Unnamed Operator"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{currentUser?.email}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider rounded-full">
            {currentUser?.branch || "No Branch Assigned"}
          </span>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-850 grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 dark:bg-[#050B14] p-3 rounded-xl border border-slate-200 dark:border-slate-900">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">XP Rank</span>
              <span className="text-lg font-black text-amber-500 block mt-1">{stats?.xp || 0} XP</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#050B14] p-3 rounded-xl border border-slate-200 dark:border-slate-900">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Streak</span>
              <span className="text-lg font-black text-orange-500 block mt-1">{stats?.streak ?? 0} Days</span>
            </div>
          </div>
        </div>

        {/* Overview Stats list */}
        <div className="std-panel space-y-4">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-2">Performance Summary</h4>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-850">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <BookOpen size={14} className="text-emerald-500" />
              Practice Modules Completed
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{testsAttempted}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-850">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <Star size={14} className="text-purple-500" />
              Average Accuracy Score
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{averageScore}%</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-850">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <Award size={14} className="text-yellow-500" />
              Rank Level Medal
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{medalInfo?.fullName || "Bronze V"}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" />
              Plan Subscription
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {currentUser?.hasFullPremium || currentUser?.activePlanId ? "Premium Active" : "Free Entitlement"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Column: Edit Profile details ── */}
      <div className="lg:col-span-2 std-panel space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Operator Profile Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Keep your student credential telemetry updated.</p>
        </div>

        <form onSubmit={onSaveProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all"
                placeholder="Operator Full Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Academic Semester</label>
              <select
                value={profileForm.semester}
                onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all"
              >
                <option value="" disabled>Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s.toString()}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block font-mono">Academic Branch</label>
            <div className="flex justify-between items-center p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14]">
              <div className="truncate pr-2">
                <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider font-bold">Current Specialization</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {currentUser?.branch || "No specialization assigned"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingBranch(!isChangingBranch)}
                className="px-3.5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white font-bold text-xs rounded-lg transition-all shrink-0"
              >
                {isChangingBranch ? "Collapse Panel" : "Switch Specialty"}
              </button>
            </div>

            {isChangingBranch && (
              <div className="mt-3 p-4 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-100 dark:bg-[#090F1D] space-y-2 animate-in slide-in-from-top-2 duration-250">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Select specialization</span>
                <div className="grid gap-2 sm:grid-cols-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {activeBranches
                    .filter((b) => !b.isGeneral && b.status === "ACTIVE" && b.id !== currentUser?.branchId)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onSwitchBranch(b)}
                        className="text-left px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#050B14] hover:border-emerald-500 hover:bg-emerald-500/5 rounded-lg transition-all text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        {b.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">College Name</label>
              <input
                type="text"
                placeholder="College affiliation..."
                value={profileForm.collegeName || ""}
                onChange={(e) => setProfileForm({ ...profileForm, collegeName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Graduation Year</label>
              <input
                type="text"
                placeholder="e.g. 2027"
                value={profileForm.graduationYear || ""}
                onChange={(e) => setProfileForm({ ...profileForm, graduationYear: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all text-center"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">University Affiliation</label>
            <input
              type="text"
              placeholder="Board/University affiliation..."
              value={profileForm.universityName || ""}
              onChange={(e) => setProfileForm({ ...profileForm, universityName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-[#050B14] text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-850 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-emerald-600/10 transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
