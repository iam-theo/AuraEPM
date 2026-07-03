import React, { useEffect, useState } from "react";
import { api } from "./lib/api.ts";

// Import Modular Feature Components
import { DashboardView } from "./components/DashboardView.tsx";
import { TeamView } from "./components/TeamView.tsx";
import { TasksView } from "./components/TasksView.tsx";
import { GanttView } from "./components/GanttView.tsx";
import { CalendarView } from "./components/CalendarView.tsx";
import { GoogleCalendarView } from "./components/GoogleCalendarView.tsx";
import { GoogleMeetStreamView } from "./components/GoogleMeetStreamView.tsx";
import { TimeTrackingView } from "./components/TimeTrackingView.tsx";
import { IssuesRisksView } from "./components/IssuesRisksView.tsx";
import { DeliverablesDocsView } from "./components/DeliverablesDocsView.tsx";
import { MeetingsCommentsView } from "./components/MeetingsCommentsView.tsx";
import { ChatView } from "./components/ChatView.tsx";
import { SettingsView } from "./components/SettingsView.tsx";
import { AuditReportsView } from "./components/AuditReportsView.tsx";
import { AICopilot } from "./components/AICopilot.tsx";

// Lucide Icons
import {
  Briefcase,
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Video,
  Shield,
  History,
  Compass,
  BellRing,
  Radio,
  Globe,
  MessageSquare,
  Settings as SettingsIcon
} from "lucide-react";

type Tab =
  | "dashboard"
  | "team"
  | "tasks"
  | "gantt"
  | "calendar"
  | "google-calendar"
  | "meet-stream"
  | "time"
  | "issues"
  | "docs"
  | "meetings"
  | "chat"
  | "reports"
  | "settings";

export default function App() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Simulated Authorization Role State
  const [userRole, setUserRole] = useState<string>("PROJECT_MANAGER");

  // Notifications bell counter
  const [unreadCount, setUnreadCount] = useState<number>(3);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await api.getProjectsList();
        setProjects(data || []);
        if (data && data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch projects list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const getActiveProjectName = () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    return proj ? proj.name : "Portfolio Tracker";
  };

  const getActiveProjectCode = () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    return proj ? proj.code : "PROJ";
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderActiveView = () => {
    if (!selectedProjectId) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-400 italic">
          Please select or register a project to begin execution tracking.
        </div>
      );
    }

    const renderViewContent = () => {
      switch (activeTab) {
        case "dashboard":
          return <DashboardView projectId={selectedProjectId} />;
        case "team":
          return <TeamView projectId={selectedProjectId} />;
        case "tasks":
          return <TasksView projectId={selectedProjectId} />;
        case "gantt":
          return <GanttView projectId={selectedProjectId} />;
        case "calendar":
          return <CalendarView projectId={selectedProjectId} />;
        case "google-calendar":
          return <GoogleCalendarView projectId={selectedProjectId} />;
        case "meet-stream":
          return <GoogleMeetStreamView projectId={selectedProjectId} />;
        case "time":
          return <TimeTrackingView projectId={selectedProjectId} />;
        case "issues":
          return <IssuesRisksView projectId={selectedProjectId} />;
        case "docs":
          return <DeliverablesDocsView projectId={selectedProjectId} />;
        case "meetings":
          return <MeetingsCommentsView projectId={selectedProjectId} />;
        case "chat":
          return <ChatView projectId={selectedProjectId} />;
        case "reports":
          return <AuditReportsView projectId={selectedProjectId} />;
        case "settings":
          return <SettingsView />;
        default:
          return <DashboardView projectId={selectedProjectId} />;
      }
    };

    return <div key={refreshKey} className="h-full">{renderViewContent()}</div>;
  };

  const sidebarTabs: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "team", label: "Resource Assignment", icon: Users },
    { id: "tasks", label: "Work Packages (Tasks)", icon: CheckSquare },
    { id: "gantt", label: "Gantt Timeline Schedule", icon: Compass },
    { id: "calendar", label: "Release Calendar", icon: Calendar },
    { id: "google-calendar", label: "Realtime Google Calendar", icon: Globe },
    { id: "time", label: "Time Tracking Logs", icon: Clock },
    { id: "issues", label: "Defects & Risk Matrix", icon: AlertTriangle },
    { id: "docs", label: "Documents & Deliverables", icon: FileText },
    { id: "meetings", label: "Briefings & Comments", icon: Video },
    { id: "chat", label: "Live Project Chat", icon: MessageSquare },
    { id: "meet-stream", label: "In-App Meet Room", icon: Radio },
    { id: "reports", label: "Audit & Executive Reports", icon: History },
    { id: "settings", label: "System & Profile", icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col font-sans select-none antialiased selection:bg-indigo-500/30">
      
      {/* Top Main Navigation Header Bar */}
      <header className="bg-[#09090b] text-zinc-100 h-16 px-6 flex items-center justify-between border-b border-zinc-800 shrink-0 sticky top-0 z-50 shadow-sm shadow-[#09090b]/50">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-500/20 text-white shadow-lg shadow-indigo-600/10">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-100 flex items-center space-x-1.5">
              <span>Apollo Execution</span>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20 font-mono uppercase tracking-wider">
                Module
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">Enterprise Project Execution Tracker Platform</p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center space-x-4">
          
          {/* Active Project Ingress Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-500 font-medium hidden md:inline">Current Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#18181b] border border-zinc-800 text-zinc-200 rounded-lg p-2 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Simulated RBAC selector */}
          <div className="flex items-center space-x-2 text-xs">
            <Shield className="h-4 w-4 text-zinc-500 hidden md:inline" />
            <span className="text-zinc-500 font-medium hidden md:inline">Simulated Role:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="bg-[#18181b] border border-zinc-800 text-zinc-200 rounded-lg p-2 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <option value="PROJECT_MANAGER">Project Manager (PM)</option>
              <option value="DEVELOPER">Senior Developer</option>
              <option value="QA">QA Specialist</option>
              <option value="GUEST">Guest Reader</option>
            </select>
          </div>

          {/* Notification Indicator Counter */}
          <button
            onClick={() => {
              setUnreadCount(0);
              alert("Mock System Notification: Timesheet approvals complete, and Risk Matrix rating mitigations established.");
            }}
            className="relative p-2 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
          >
            <BellRing className="h-4 w-4 text-zinc-100" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-zinc-950" />
            )}
          </button>
        </div>
      </header>

      {/* Main Multi-Pane Visual Splitter Panel */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar Drawer */}
        <aside className="w-64 bg-[#18181b] border-r border-zinc-800 text-zinc-300 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/20">
            <span className="text-[10px] text-zinc-500 font-mono block">ACTIVE METRIC ANCHOR</span>
            <span className="font-semibold text-zinc-100 truncate block text-xs mt-0.5">{getActiveProjectName()}</span>
            <span className="text-[9px] text-zinc-400 font-mono block mt-1">CODE: {getActiveProjectCode()}</span>
          </div>

          {/* Tab Button list */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800/60 text-center font-mono text-[9px] text-zinc-500 bg-zinc-950/10">
            RBAC LEVEL: {userRole}
          </div>
        </aside>

        {/* Dynamic Content Pane Area */}
        <main className="flex-1 bg-[#09090b] p-6 overflow-y-auto min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>
      {selectedProjectId && (
        <AICopilot projectId={selectedProjectId} onActionExecuted={triggerRefresh} />
      )}
    </div>
  );
}
