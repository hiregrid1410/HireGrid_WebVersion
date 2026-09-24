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
    <aside className={`std-sidebar ${sidebarOpen ? "std-sidebar--mobile-open" : "std-sidebar--collapsed"}`}>
      {/* Sidebar Header */}
      <div className="std-sidebar-brand">
        {sidebarOpen ? (
          <img
            src="/dark_logo.png"
            alt="HireGridX Logo"
            className="std-sidebar-logo-img"
          />
        ) : (
          <img
            src="/dark_logo.png"
            alt="HireGridX Logo"
            className="w-8 h-8 object-contain mx-auto bg-transparent"
          />
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
