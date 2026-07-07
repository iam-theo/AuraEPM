import React, { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { WidgetRegistry } from "./WidgetRegistry.tsx";
import { Shield, Layout, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  projectId: string;
}

export function DashboardView({ projectId }: Props) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, [projectId]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      // Fetch resolved dashboard from the new Enterprise Dashboard Engine
      const data = await api.getMyDashboard();
      setDashboard(data);
    } catch (err: any) {
      console.error("Dashboard resolution failed:", err);
      setError("Failed to resolve your enterprise dashboard. Please contact IT.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Resolving Effective Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-8 rounded-xl flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-bold">Policy Restriction or Error</h3>
        <p className="text-sm max-w-md mt-2">{error}</p>
        <button 
          onClick={loadDashboard}
          className="mt-6 flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 px-4 py-2 rounded-lg transition-colors text-xs font-bold"
        >
          <RefreshCw className="h-3 w-3" /> Retry Resolution
        </button>
      </div>
    );
  }

  const widgets = dashboard?.widgets || [];

  if (widgets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 border-2 border-dashed border-zinc-800 rounded-2xl p-12">
        <Layout className="h-16 w-16 opacity-10" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-zinc-300">Empty Workspace</h3>
          <p className="text-xs max-w-xs mt-1">No dashboard widgets have been assigned to your profile or role. Use the Dashboard Builder in the Admin Console to configure your view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Layout className="h-5 w-5 text-indigo-500" />
            Dynamic Workspace
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-tighter">Effective Dashboard resolved via EPPM Policy Engine</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Policy Active</span>
          <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live Updates</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((item: any, idx: number) => {
          const WidgetComponent = WidgetRegistry[item.widget.code];
          
          if (!WidgetComponent) {
            return (
              <div key={item.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-zinc-700" />
                <p className="text-[10px] text-zinc-600 font-mono">UNKNOWN_WIDGET: {item.widget.code}</p>
              </div>
            );
          }

          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={item.w > 2 ? "col-span-1 md:col-span-2 lg:col-span-2" : "col-span-1"}
            >
              <WidgetComponent {...item.widget} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
