import React from "react";
import {
  Layout,
  BookOpen,
  Building2,
  Award,
  CreditCard,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";

export function StudentSidebar({
  activeTab,
  onTabSelect,
  user,
  sidebarOpen,
  onToggleSidebar,
  onLogout,
}) {
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <aside className={`std-sidebar ${!sidebarOpen ? "std-sidebar--collapsed" : ""}`}>
      {/* Sidebar Header */}
      <div className="std-sidebar-brand">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/20">
              <span className="text-white text-xs font-black font-mono">HG</span>
            </div>
            <span className="text-base font-black uppercase tracking-widest bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent drop-shadow-md">
              COMMAND
            </span>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="text-white text-xs font-black font-mono">HG</span>
          </div>
        )}

        {sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="std-sidebar-toggle"
            aria-label="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="std-sidebar-menu">
        {sidebarOpen && <div className="std-sidebar-section-title">Navigation</div>}
        
        <button
          onClick={() => onTabSelect("dashboard")}
          className={`std-sidebar-item ${activeTab === "dashboard" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><Layout size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Dashboard</span>}
        </button>

        <button
          onClick={() => onTabSelect("general")}
          className={`std-sidebar-item ${activeTab === "general" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><BookOpen size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">My Learning</span>}
        </button>

        <button
          onClick={() => onTabSelect("companies")}
          className={`std-sidebar-item ${activeTab === "companies" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><Building2 size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Company Exams</span>}
        </button>

        <button
          onClick={() => onTabSelect("placement-mission")}
          className={`std-sidebar-item ${activeTab === "placement-mission" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><Award size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Placement Mission</span>}
        </button>

        {sidebarOpen && <div className="std-sidebar-section-title">Account</div>}

        <button
          onClick={() => onTabSelect("plans")}
          className={`std-sidebar-item ${activeTab === "plans" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><CreditCard size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Premium Plans</span>}
        </button>

        <button
          onClick={() => onTabSelect("feedback")}
          className={`std-sidebar-item ${activeTab === "feedback" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><MessageSquare size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Send Feedback</span>}
        </button>

        <button
          onClick={() => onTabSelect("profile")}
          className={`std-sidebar-item ${activeTab === "profile" ? "std-sidebar-item--active" : ""}`}
        >
          <span className="std-sidebar-item-icon"><User size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Operator Profile</span>}
        </button>

        <button
          onClick={onLogout}
          className="std-sidebar-item hover:text-rose-400 mt-auto"
        >
          <span className="std-sidebar-item-icon text-rose-500"><LogOut size={18} /></span>
          {sidebarOpen && <span className="std-sidebar-item-text">Logout</span>}
        </button>
      </div>

      {/* Sidebar Rocket Card at bottom */}
      {sidebarOpen && (
        <div className="std-sidebar-footer">
          <div className="std-sidebar-rocket-card">
            <div className="std-sidebar-rocket-title flex items-center gap-1.5">
              <span>Keep Going, {user?.name?.split(" ")[0] || "operator"}!</span>
              <span className="animate-bounce">🚀</span>
            </div>
            <p className="std-sidebar-rocket-desc">
              Consistency today, Success tomorrow. Access your modules and assignments.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
