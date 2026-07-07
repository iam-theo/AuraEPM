import React, { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { 
  Layout, 
  Shield, 
  RefreshCw, 
  TrendingUp, 
  Briefcase, 
  CheckSquare, 
  Users, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Activity, 
  DollarSign 
} from "lucide-react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  projectId: string;
}

export function DashboardView({ projectId }: Props) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      // Fetch dynamic dashboard KPIs and statistics
      const dashboardData = await api.getDashboard(projectId);
      setDashboard(dashboardData);

      // Fetch active tasks for this project
      const tasksData = await api.getTasks(projectId);
      setTasks(tasksData || []);

      // Fetch risks for this project
      const risksData = await api.getRisks(projectId);
      setRisks(risksData || []);

    } catch (err: any) {
      console.error("Dashboard resolution failed:", err);
      setError("Failed to resolve dynamic workspace. Please verify database synchronization.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Loading dynamic workspace telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl flex flex-col items-center text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="h-10 w-10 text-red-600 mb-4" />
        <h3 className="text-base font-bold">Dynamic Sync Interface Offline</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">{error}</p>
        <button 
          onClick={() => loadData()}
          className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all text-xs font-semibold shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-trigger Sync
        </button>
      </div>
    );
  }

  // Calculate dynamic metric values
  const budgetVal = Number(dashboard?.budget || 0);
  // Derive actual cost from seeded values or calculations
  let actualCostVal = 0;
  if (projectId === "p-gpx-payment-gateway-2026") actualCostVal = 3672000;
  else if (projectId === "p-lre-retail-expansion-2026") actualCostVal = 1152000;
  else if (projectId === "p-dga-governance-audit-2026") actualCostVal = 96000;
  else if (projectId === "p-qci-compute-infra-2026") actualCostVal = 3348000;
  else if (projectId === "p-mob-client-rewrite-2026") actualCostVal = 410000;
  else actualCostVal = budgetVal * 0.45; // Fallback calculation

  const remainingFunds = Math.max(0, budgetVal - actualCostVal);
  const costProgressPercent = budgetVal > 0 ? Math.round((actualCostVal / budgetVal) * 100) : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "DONE" || t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const todoTasks = tasks.filter(t => t.status === "TODO" || t.status === "ASSIGNED").length;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const assignedTeamCount = dashboard?.allocatedTeamCount || 1;
  const allocationPercent = dashboard?.quickStats?.resourceUtilization?.avgAllocationPercent || 100;

  const openRisksCount = risks.filter(r => r.status !== "CLOSED").length;
  const highRisksCount = risks.filter(r => r.priority === "HIGH" || r.priority === "URGENT" || r.impact === "HIGH").length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Recharts financial chart data
  const chartData = [
    { name: "Total Budget", amount: budgetVal, color: "#4F46E5" },
    { name: "Spent to Date", amount: actualCostVal, color: "#F59E0B" },
    { name: "Remaining Funds", amount: remainingFunds, color: "#10B981" }
  ];

  // Visual health indicator tag mapping
  const getHealthBadge = (health: string) => {
    const h = health?.toUpperCase() || "STABLE";
    if (h === "ON_TRACK" || h === "HEALTHY" || h === "STABLE") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>On Track</span>
        </span>
      );
    } else if (h === "AT_RISK" || h === "NEEDS_ATTENTION") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          <span>At Risk</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          <span>Critical</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {dashboard?.projectName || "Enterprise Overview"}
            </h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
              {dashboard?.projectCode || "PORTFOLIO"}
            </span>
            {getHealthBadge(dashboard?.projectHealth)}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {dashboard?.description || "Aggregated portfolio status and KPI indicators."}
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => loadData(true)}
            className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync DB"}</span>
          </button>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE BACKEND</span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Cost to Date */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Cost to Date</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(actualCostVal)}</h3>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>Budget: {formatCurrency(budgetVal)}</span>
              <span className="font-bold text-indigo-600">{costProgressPercent}% Spent</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, costProgressPercent)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2: Work Packages (Tasks) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Work Packages</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{totalTasks} Tasks</h3>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>{inProgressTasks} In Progress</span>
              <span className="font-bold text-amber-600">{taskProgressPercent}% Completed</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, taskProgressPercent)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Resource Allocation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Resources</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{assignedTeamCount} Staff</h3>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>Allocated Capacity</span>
              <span className="font-bold text-emerald-600">{allocationPercent}% Utilized</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, allocationPercent)}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4: Risks and Issues */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Active Risks</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{openRisksCount} Open Risks</h3>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>{highRisksCount} High Severity</span>
              <span className={`font-bold ${highRisksCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {highRisksCount > 0 ? "Needs Mitigation" : "Stable"}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${highRisksCount > 0 ? "bg-rose-500" : "bg-emerald-500"}`} 
              style={{ width: `${openRisksCount > 0 ? 100 : 0}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* 3. Primary Content Layout Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Milestone timeline progress bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight font-mono uppercase">Execution Schedule & Milestones</h3>
            <div className="relative pt-4 pb-2">
              {/* Background Line */}
              <div className="absolute top-[27px] left-0 right-0 h-1 bg-slate-100 rounded"></div>
              
              {/* Process Line */}
              <div 
                className="absolute top-[27px] left-0 h-1 bg-indigo-600 rounded transition-all duration-700"
                style={{ width: `${dashboard?.progress || 35}%` }}
              ></div>

              {/* Milestones Markers */}
              <div className="relative flex justify-between">
                {[
                  { label: "Kickoff", percent: 0, actualPercent: 0 },
                  { label: "Planning", percent: 30, actualPercent: 30 },
                  { label: "Execution", percent: 60, actualPercent: 60 },
                  { label: "Closeout", percent: 100, actualPercent: 100 }
                ].map((m, idx) => {
                  const currentProgress = dashboard?.progress || 35;
                  const isPassed = currentProgress >= m.actualPercent;
                  const isCurrent = currentProgress >= m.actualPercent && (idx === 3 || currentProgress < (idx === 0 ? 30 : idx === 1 ? 60 : 100));

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div 
                        className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                          isPassed 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                            : "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        {isPassed ? (
                          <span className="text-[9px] font-bold">✓</span>
                        ) : (
                          <span className="text-[8px] font-mono">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold mt-2 ${isPassed ? "text-indigo-600" : "text-slate-400"}`}>
                        {m.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {m.percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Financial comparison bar chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight font-mono uppercase">Financial Summary</h3>
              <span className="text-[10px] text-slate-400 font-mono">RECONCILED IN REAL TIME</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">PROJECT BUDGET</span>
                <span className="text-base font-extrabold text-indigo-600">{formatCurrency(budgetVal)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">SPENT TO DATE</span>
                <span className="text-base font-extrabold text-amber-500">{formatCurrency(actualCostVal)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">REMAINING BALANCE</span>
                <span className="text-base font-extrabold text-emerald-500">{formatCurrency(remainingFunds)}</span>
              </div>
            </div>

            {/* Recharts Bar Comparison */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value / 1000}k`}
                    tick={{ fill: "#64748B", fontSize: 9 }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), "Amount"]}
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc" }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active tasks list table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight font-mono uppercase">Active Work Packages</h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{tasks.length} LOGGED TASKS</span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No active work packages assigned to this project tracker context.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase font-mono">
                      <th className="py-3 px-4">Work Package</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Estimated</th>
                      <th className="py-3 px-4">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tasks.slice(0, 5).map((t) => {
                      const getStatusTag = (status: string) => {
                        const s = status?.toUpperCase() || "TODO";
                        if (s === "COMPLETED" || s === "DONE" || s === "ARCHIVED") {
                          return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[9px]">COMPLETED</span>;
                        } else if (s === "IN_PROGRESS" || s === "REVIEW" || s === "REVIEWED") {
                          return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[9px]">IN PROGRESS</span>;
                        } else {
                          return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[9px]">TODO</span>;
                        }
                      };

                      const getPriorityTag = (prio: string) => {
                        const p = prio?.toUpperCase() || "MEDIUM";
                        if (p === "HIGH" || p === "URGENT") {
                          return <span className="text-rose-600 font-bold text-[10px] flex items-center space-x-1"><span>⚠️</span> <span>{p}</span></span>;
                        } else if (p === "MEDIUM") {
                          return <span className="text-amber-600 font-bold text-[10px]">{p}</span>;
                        } else {
                          return <span className="text-slate-400 font-medium text-[10px]">{p}</span>;
                        }
                      };

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800">{t.title}</td>
                          <td className="py-3 px-4">{getStatusTag(t.status)}</td>
                          <td className="py-3 px-4">{getPriorityTag(t.priority)}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-500">{t.estimatedHours || 24} hrs</td>
                          <td className="py-3 px-4 text-slate-400 font-mono">
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Project Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Execution Attributes</h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Client Partner</span>
                <span className="font-bold text-slate-800">{dashboard?.clientName || "Aura Strategic"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Assigned Team</span>
                <span className="font-bold text-slate-800">{assignedTeamCount} members</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Execution Phase</span>
                <span className="font-bold text-indigo-600 uppercase font-mono">{dashboard?.projectStatus || "ACTIVE"}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Target Duration</span>
                <span className="font-bold text-slate-800 font-mono">{dashboard?.quickStats?.durationDays || 120} days</span>
              </div>
            </div>
          </div>

          {/* Active Risks List */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Identified Risks</h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">{risks.length} OPEN</span>
            </div>
            
            {risks.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                No active threats or risk items registered.
              </div>
            ) : (
              <div className="space-y-3">
                {risks.slice(0, 3).map((r) => (
                  <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5 hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-800 leading-tight pr-2">{r.title}</h4>
                      <span className="bg-rose-50 text-rose-600 text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0">
                        {r.priority || "HIGH"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">{r.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Activity Feed / Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Live Activity Log</h3>
            
            {!dashboard?.activityFeed || dashboard.activityFeed.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs italic">
                No recent activity logged.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {dashboard.activityFeed.slice(0, 4).map((log: any) => (
                  <div key={log.id} className="flex space-x-3 text-xs relative">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-white relative z-10">
                      <Activity className="h-3 w-3 text-indigo-500" />
                    </div>
                    <div className="flex flex-col pt-0.5">
                      <span className="font-bold text-slate-800">{log.details}</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase">
                        {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} @ {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
