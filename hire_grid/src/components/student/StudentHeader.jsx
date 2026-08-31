import React from "react";
import { Menu, Flame, ShieldAlert, Award, User } from "lucide-react";

export function StudentHeader({
  user,
  stats,
  medalInfo,
  activeTab,
  onMenuClick,
  onEditProfile,
}) {
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const getPageTitle = (tab) => {
    switch (tab) {
      case "dashboard":
        return "Dashboard";
      case "general":
        return "My Learning";
      case "companies":
        return "Company Exams";
      case "placement-mission":
        return "Placement Mission";
      case "plans":
        return "Premium Plans";
      case "feedback":
        return "Send Feedback";
      case "profile":
        return "Operator Profile";
      default:
        return "Current Mission";
    }
  };

  return (
    <header className="std-header">
      <div className="std-header-left">
        <button
          onClick={onMenuClick}
          className="std-header-mobile-toggle"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
        <div className="std-header-title-wrap">
          <h1>{getPageTitle(activeTab)}</h1>
          <p>Let's continue your career preparation journey</p>
        </div>
      </div>

      <div className="std-header-right">
        {/* Streak indicator */}
        <div className="std-header-stat-badge std-header-stat-badge--streak" title="Daily Streak">
          <Flame size={16} fill="currentColor" />
          <span>{stats?.streak ?? 0} Day Streak</span>
        </div>

        {/* Level & Medal indicator */}
        <div className="std-header-stat-badge std-header-stat-badge--medal" title="Medal Tier">
          <Award size={16} />
          <span>{medalInfo?.fullName || "Bronze V"}</span>
        </div>



        {/* Profile Avatar Button */}
        <button
          onClick={onEditProfile}
          className="std-header-user-btn"
          title="Open Profile Settings"
        >
          <div className="std-header-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block">
            <p className="std-header-user-name truncate max-w-[120px]">
              {user?.name || "Unnamed Student"}
            </p>
            <p className="std-header-user-branch truncate max-w-[120px]">
              {user?.branch || "No Branch"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
