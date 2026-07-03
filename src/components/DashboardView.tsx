import React, { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, CheckCircle, Clock, Users, Flame, AlertCircle, Calendar, Zap, Percent } from "lucide-react";

interface Props {
  projectId: string;
}

export function DashboardView({ projectId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getDashboard(projectId);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <h3 className="font-semibold">Dashboard Error</h3>
        <p className="text-sm">{error || "No project dataset found"}</p>
      </div>
    );
  }

  const chartData = [
    { name: "Planned Value", amount: data.budget || 0 },
    { name: "Progress (EV)", amount: Math.round((data.budget || 0) * ((data.progress || 0) / 100)) },
    { name: "Logged Value (Est)", amount: (data.totalActualHours || 0) * 75 }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Metadata Card */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 shadow-lg shadow-black/10">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-mono text-zinc-500">PROJECT METRICS UNIT</span>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">{data.projectName}</h2>
            <p className="text-zinc-400 text-sm mt-1">{data.description || "No project description available."}</p>
          </div>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-mono text-xs rounded-full border border-zinc-700">
              {data.projectCode}
            </span>
            <span className={`px-3 py-1 font-mono text-xs rounded-full border ${
              data.projectStatus === "ACTIVE" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {data.projectStatus}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Overall Execution Progress</span>
            <span className="font-mono font-medium">{data.progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
              style={{ width: `${data.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Summary Widget */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 shadow-lg shadow-black/10">
        <h3 className="text-xs font-semibold tracking-wide text-zinc-400 font-mono mb-4 flex items-center space-x-2">
          <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>PROJECT EXECUTION QUICK STATS</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Duration */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500 font-medium">Estimated Duration</span>
              <Calendar className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold font-mono text-zinc-100">{data.quickStats?.durationDays ?? 0}</span>
                <span className="text-zinc-500 text-xs">Days</span>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1">
                Active schedule scope: {((data.quickStats?.durationDays ?? 0) / 7).toFixed(1)} Weeks
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800/40 flex justify-between text-[10px] text-zinc-600 font-mono">
              <span>Start Gate</span>
              <span>Delivery Target</span>
            </div>
          </div>

          {/* Active Tasks Status Distribution */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500 font-medium">Active Backlog Distribution</span>
              <CheckCircle className="h-4 w-4 text-indigo-400" />
            </div>
            
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold font-mono text-zinc-100">
                  {data.quickStats?.activeTaskCounts?.total ?? 0}
                </span>
                <span className="text-zinc-500 text-xs">Active Work Packages</span>
              </div>
              
              {(() => {
                const todo = data.quickStats?.activeTaskCounts?.todo ?? 0;
                const ip = data.quickStats?.activeTaskCounts?.inProgress ?? 0;
                const ir = data.quickStats?.activeTaskCounts?.inReview ?? 0;
                const total = todo + ip + ir || 1;
                
                const todoPct = (todo / total) * 100;
                const ipPct = (ip / total) * 100;
                const irPct = (ir / total) * 100;
                
                return (
                  <div className="mt-3 space-y-2">
                    <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden flex">
                      <div className="bg-zinc-600 h-2" style={{ width: `${todoPct}%` }} title={`Todo: ${todo}`} />
                      <div className="bg-indigo-600 h-2" style={{ width: `${ipPct}%` }} title={`In Progress: ${ip}`} />
                      <div className="bg-amber-500 h-2" style={{ width: `${irPct}%` }} title={`In Review: ${ir}`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" />
                        <span>Todo: {todo}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                        <span>In Dev: {ip}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        <span>Review: {ir}</span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Resource Utilization */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500 font-medium">Resource Utilization</span>
              <Percent className="h-4 w-4 text-emerald-400" />
            </div>
            
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold font-mono text-zinc-100">
                  {data.quickStats?.resourceUtilization?.overallPercent ?? 0}%
                </span>
                <span className="text-zinc-500 text-xs">Capacity Utilized</span>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, data.quickStats?.resourceUtilization?.overallPercent ?? 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Logged: {data.quickStats?.resourceUtilization?.totalLoggedHours ?? 0}h</span>
                  <span>Cap: {data.quickStats?.resourceUtilization?.totalCapacityHours ?? 0}h</span>
                  <span>Alloc: {data.quickStats?.resourceUtilization?.avgAllocationPercent ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Indicator */}
        <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-xl shadow-lg shadow-black/10 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-indigo-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block">Execution Progress</span>
            <span className="text-xl font-bold font-mono text-zinc-100">{data.progress}%</span>
          </div>
        </div>

        {/* Health Factor */}
        <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-xl shadow-lg shadow-black/10 flex items-center space-x-4">
          <div className={`p-3 border rounded-lg ${
            data.projectHealth === "ON_TRACK" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block">Project Health Score</span>
            <span className="text-xl font-bold font-mono text-zinc-100">{data.projectHealth}</span>
          </div>
        </div>

        {/* Work Hours Spent */}
        <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-xl shadow-lg shadow-black/10 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-indigo-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block">Total Hours Spent</span>
            <span className="text-xl font-bold font-mono text-zinc-100">{data.totalActualHours}h</span>
          </div>
        </div>

        {/* Team Strength */}
        <div className="bg-[#18181b] border border-zinc-800 p-5 rounded-xl shadow-lg shadow-black/10 flex items-center space-x-4">
          <div className="p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block">Allocated Members</span>
            <span className="text-xl font-bold font-mono text-zinc-100">{data.allocatedTeamCount}</span>
          </div>
        </div>
      </div>

      {/* Main Graphs Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EVM Chart */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 shadow-lg shadow-black/10 lg:col-span-2">
          <h3 className="font-semibold text-zinc-200 text-sm mb-4">Earned Value Allocation Comparison (USD)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 shadow-lg shadow-black/10">
          <h3 className="font-semibold text-zinc-200 text-sm mb-4">Project Audit Activity Stream</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {data.activityFeed && data.activityFeed.length > 0 ? (
              data.activityFeed.map((act: any, idx: number) => (
                <div key={idx} className="flex space-x-3 text-xs leading-relaxed border-b border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="pt-0.5 text-zinc-500">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div>
                    <span className="font-medium text-zinc-300 block">
                      {act.action} by {act.performedByName || "Alex Rivera"}
                    </span>
                    <span className="text-zinc-500 font-mono block mt-0.5">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {act.entityType}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 italic">No project execution history tracked yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
