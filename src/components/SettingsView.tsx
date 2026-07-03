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
  Briefcase
} from "lucide-react";
import { auth, initAuth } from "../lib/firebase.ts";
import { User as FirebaseUser } from "firebase/auth";

export function SettingsView() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Local Preference State
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    realtimeSync: true,
    compactMode: false,
    publicProfile: true,
    twoFactor: false
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => setUser(u),
      () => setUser(null)
    );
    return () => unsubscribe();
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">System Settings</h2>
          <p className="text-zinc-500 text-sm">Manage your profile, security, and interface preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : showSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          <span>{showSaved ? "Changes Saved" : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar (Local) */}
        <div className="space-y-1">
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 bg-zinc-800/50 text-indigo-400 rounded-lg text-sm font-medium border border-zinc-700/50 transition-all">
            <User className="h-4 w-4" />
            <span>Profile Information</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-zinc-800/30 text-zinc-400 rounded-lg text-sm font-medium transition-all group">
            <Bell className="h-4 w-4 group-hover:text-zinc-200" />
            <span className="group-hover:text-zinc-200">Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-zinc-800/30 text-zinc-400 rounded-lg text-sm font-medium transition-all group">
            <Shield className="h-4 w-4 group-hover:text-zinc-200" />
            <span className="group-hover:text-zinc-200">Security & Privacy</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-zinc-800/30 text-zinc-400 rounded-lg text-sm font-medium transition-all group">
            <Eye className="h-4 w-4 group-hover:text-zinc-200" />
            <span className="group-hover:text-zinc-200">Display Settings</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Section */}
          <section className="bg-[#18181b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                {user?.displayName ? user.displayName[0] : user?.email ? user.email[0].toUpperCase() : "A"}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">{user?.displayName || "Apollo Executive"}</h3>
                <p className="text-zinc-500 text-sm font-mono">{user?.email || "No email connected"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                   <User className="h-3 w-3" />
                   <span>Full Display Name</span>
                </label>
                <input 
                  type="text" 
                  defaultValue={user?.displayName || "Apollo Executive"} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1.5">
                   <Briefcase className="h-3 w-3" />
                   <span>Organization Role</span>
                </label>
                <input 
                  type="text" 
                  defaultValue="Principal Delivery Manager" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
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
                    value={user?.email || "theodesmon71@gmail.com"} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed italic"
                  />
                  <Lock className="absolute right-4 top-3 h-4 w-4 text-zinc-700" />
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
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
                  className={`w-10 h-5 rounded-full transition-all relative ${prefs.realtimeSync ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.realtimeSync ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-zinc-100">Email Delivery Summaries</p>
                  <p className="text-[10px] text-zinc-500">Weekly executive reports delivered directly to your inbox.</p>
                </div>
                <button 
                  onClick={() => togglePref('emailNotifications')}
                  className={`w-10 h-5 rounded-full transition-all relative ${prefs.emailNotifications ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.emailNotifications ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-zinc-100">Compact View Mode</p>
                  <p className="text-[10px] text-zinc-500">Reduce padding and font sizes for high-density information displays.</p>
                </div>
                <button 
                  onClick={() => togglePref('compactMode')}
                  className={`w-10 h-5 rounded-full transition-all relative ${prefs.compactMode ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.compactMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4">
             <div className="flex items-center space-x-2 text-red-400">
                <LogOut className="h-4 w-4" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Account Session</h4>
             </div>
             <p className="text-[10px] text-zinc-500 leading-relaxed">
                Terminate all active enterprise sessions across devices. This will require a new Google Workspace re-authentication on next login.
             </p>
             <button 
              onClick={() => auth.signOut()}
              className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-bold rounded-lg border border-red-600/20 transition-all"
             >
                Sign Out of Apollo Platform
             </button>
          </section>
        </div>
      </div>
    </div>
  );
}
