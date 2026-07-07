import React, { useState, useEffect } from "react";
import { 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Globe, 
  Smartphone, 
  LogOut, 
  Save, 
  Check, 
  Loader2,
  Lock,
  Mail,
  Briefcase,
  KeyRound,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.tsx";
import api from "../api/client.ts";

interface Session {
  id: string;
  sessionId: string;
  ipAddress: string;
  deviceInfo: string;
  createdAt: string;
  lastActiveAt: string;
  isActive: boolean;
}

export function SettingsView() {
  const { user, logout, securityProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "notifications" | "security" | "display">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Session State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState("");

  // Local Preference State
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    realtimeSync: true,
    compactMode: false,
    publicProfile: true,
    twoFactor: false
  });

  // Fetch sessions when on security tab
  useEffect(() => {
    if (activeSubTab === "security") {
      fetchSessions();
    }
  }, [activeSubTab]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      setSessionError("");
      const res = await api.get("/auth/sessions");
      setSessions(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to load sessions", err);
      setSessionError("Failed to fetch active device sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }, 800);
  };

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.post("/auth/change-password", {
        oldPassword,
        newPassword
      });
      setPasswordSuccess("Your password has been updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || 
        "Failed to change password. Please verify your old password matches."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await api.post("/auth/sessions/terminate", { sessionId });
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      console.error("Failed to terminate session", err);
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      await api.post("/auth/sessions/terminate-all");
      fetchSessions();
    } catch (err) {
      console.error("Failed to terminate all sessions", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">System & Profile Settings</h2>
          <p className="text-zinc-500 text-sm">Manage your enterprise identity, RBAC profile, security parameters, and preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : showSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{showSaved ? "Changes Saved" : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar (Local) */}
        <div className="space-y-1">
          <button 
            onClick={() => setActiveSubTab("profile")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
              activeSubTab === "profile" 
                ? "bg-zinc-800/50 text-indigo-400 border-zinc-700/50" 
                : "border-transparent hover:bg-zinc-800/30 text-zinc-400"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile Information</span>
          </button>
          <button 
            onClick={() => setActiveSubTab("notifications")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
              activeSubTab === "notifications" 
                ? "bg-zinc-800/50 text-indigo-400 border-zinc-700/50" 
                : "border-transparent hover:bg-zinc-800/30 text-zinc-400"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
          <button 
            onClick={() => setActiveSubTab("security")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
              activeSubTab === "security" 
                ? "bg-zinc-800/50 text-indigo-400 border-zinc-700/50" 
                : "border-transparent hover:bg-zinc-800/30 text-zinc-400"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security & Privacy</span>
          </button>
          <button 
            onClick={() => setActiveSubTab("display")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
              activeSubTab === "display" 
                ? "bg-zinc-800/50 text-indigo-400 border-zinc-700/50" 
                : "border-transparent hover:bg-zinc-800/30 text-zinc-400"
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Display Settings</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {activeSubTab === "profile" && (
            <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                  {user?.firstName ? user.firstName[0] : (user as any)?.name ? (user as any).name[0] : user?.email ? user.email[0].toUpperCase() : "A"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{user?.firstName || (user as any)?.name} {user?.lastName || ""}</h3>
                  <p className="text-zinc-500 text-sm font-mono">{user?.email || "No email connected"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                     <User className="h-3 w-3" />
                     <span>First Name</span>
                  </label>
                  <input 
                    type="text" 
                    readOnly
                    value={user?.firstName || ""} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                     <User className="h-3 w-3" />
                     <span>Last Name</span>
                  </label>
                  <input 
                    type="text" 
                    readOnly
                    value={user?.lastName || ""} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                     <Briefcase className="h-3 w-3" />
                     <span>Enterprise Department</span>
                  </label>
                  <input 
                    type="text" 
                    readOnly
                    value={user?.department || "Corporate"} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                     <ShieldCheck className="h-3 w-3" />
                     <span>Active Roles</span>
                  </label>
                  <input 
                    type="text" 
                    readOnly
                    value={securityProfile?.roles?.map(r => r.name).join(", ") || "No Roles Assigned"} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                     <Mail className="h-3 w-3" />
                     <span>Primary Email Address</span>
                  </label>
                  <div className="relative group">
                    <input 
                      type="email" 
                      readOnly
                      value={user?.email || ""} 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed italic"
                    />
                    <Lock className="absolute right-4 top-3 h-4 w-4 text-zinc-700" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSubTab === "notifications" && (
            <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Notification Channels</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-zinc-100">Email Delivery Summaries</p>
                    <p className="text-[10px] text-zinc-500">Weekly executive status reports delivered directly to your inbox.</p>
                  </div>
                  <button 
                    onClick={() => togglePref('emailNotifications')}
                    className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${prefs.emailNotifications ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.emailNotifications ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeSubTab === "security" && (
            <div className="space-y-6">
              {/* Change Password Form */}
              <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
                <h4 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center space-x-2">
                  <KeyRound className="h-4 w-4 text-indigo-400" />
                  <span>Update Password</span>
                </h4>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                  {passwordError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Password</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                    <p className="text-[10px] text-zinc-500">The default password set during registration is <code className="text-indigo-400 px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded">Welcome@123</code></p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 cursor-pointer transition-all"
                    >
                      {isChangingPassword && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span>Change Password</span>
                    </button>
                  </div>
                </form>
              </section>

              {/* Active Sessions List */}
              <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-indigo-400" />
                    <span>Active Sessions</span>
                  </h4>
                  <button 
                    onClick={handleTerminateAllSessions}
                    className="text-rose-500 hover:text-rose-400 text-xs font-semibold cursor-pointer"
                  >
                    Terminate All Sessions
                  </button>
                </div>

                {loadingSessions ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : sessionError ? (
                  <p className="text-xs text-rose-400">{sessionError}</p>
                ) : sessions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No other active device sessions found.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {sessions.map(sess => (
                      <div key={sess.id} className="flex justify-between items-center p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">{sess.deviceInfo || "Web Browser"}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">IP: {sess.ipAddress}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">•</span>
                            <span className="text-[10px] text-zinc-500">Last active: {new Date(sess.lastActiveAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleTerminateSession(sess.sessionId)}
                          className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:text-rose-500 border border-zinc-800 hover:border-rose-500/20 bg-zinc-900/50 rounded-lg cursor-pointer transition-all"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeSubTab === "display" && (
            <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Interface Preferences</h4>
              
              <div className="space-y-4">
                {/* Toggle 1 */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-zinc-100">Real-time Data Synchronization</p>
                    <p className="text-[10px] text-zinc-500">Automatically push updates to the Executive Briefing Dashboard.</p>
                  </div>
                  <button 
                    onClick={() => togglePref('realtimeSync')}
                    className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${prefs.realtimeSync ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.realtimeSync ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {/* Toggle 2 */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-zinc-100">Compact View Mode</p>
                    <p className="text-[10px] text-zinc-500">Reduce padding and font sizes for high-density information displays.</p>
                  </div>
                  <button 
                    onClick={() => togglePref('compactMode')}
                    className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${prefs.compactMode ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.compactMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
             <div className="flex items-center space-x-2 text-red-400">
                <LogOut className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Account Session</h4>
             </div>
             <p className="text-[10px] text-zinc-500 leading-relaxed">
                Terminate your current active enterprise session. You will be redirected to the login interface.
             </p>
             <button 
              onClick={logout}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-bold rounded-lg border border-red-600/20 transition-all cursor-pointer"
             >
                Sign Out of AuraPM Platform
             </button>
          </section>
        </div>
      </div>
    </div>
  );
}

