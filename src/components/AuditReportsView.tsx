import React, { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { AuditLog } from "../modules/project-tracker/types.ts";
import { FileText, DownloadCloud, FileSpreadsheet, ShieldAlert, CheckCircle, TrendingUp, History } from "lucide-react";

interface Props {
  projectId: string;
}

export function AuditReportsView({ projectId }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab: "logs" or "executive"
  const [activeTab, setActiveTab] = useState<"logs" | "executive">("logs");

  const loadData = async () => {
    try {
      setLoading(true);
      const [lList, rData] = await Promise.all([
        api.getAuditLogs(projectId),
        api.getExecutiveReport(projectId)
      ]);
      setLogs(lList);
      setReport(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleExportCSV = async () => {
    try {
      const csvContent = await api.downloadTasksCSV(projectId);
      
      // Construct native browser file download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `tasks-project-tracker-${projectId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Failed to compile CSV file export: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-zinc-300">
      
      {/* Tab Switch Headers */}
      <div className="flex justify-between items-center bg-[#18181b] border border-zinc-800 p-4 rounded-xl shadow-lg shadow-black/10">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "logs" ? "bg-zinc-800 text-indigo-400 border border-zinc-700 font-semibold" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            System Change Audit Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("executive")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "executive" ? "bg-zinc-800 text-indigo-400 border border-zinc-700 font-semibold" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            Executive Portfolio Status Report
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/10"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export Tasks CSV</span>
        </button>
      </div>

      {/* RENDER SELECTED WINDOW */}
      {activeTab === "logs" ? (
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 shadow-lg shadow-black/10 space-y-4">
          <h3 className="font-semibold text-zinc-100 text-xs flex items-center space-x-1.5">
            <History className="h-4 w-4 text-indigo-400" />
            <span>Project Historical Change Ledger Timeline</span>
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 relative border-l border-zinc-800 pl-4 ml-2">
            {logs.map((l, idx) => (
              <div key={l.id} className="relative pb-4 last:pb-0">
                {/* Node marker point */}
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-zinc-900 ring-2 ring-zinc-800" />

                <div className="space-y-1 bg-[#09090b] border border-zinc-850 rounded-lg p-3">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500">
                    <span className="font-mono text-zinc-400">{new Date(l.createdAt).toLocaleDateString()} at {new Date(l.createdAt).toLocaleTimeString()}</span>
                    <span className="bg-zinc-800 text-indigo-400 border border-zinc-750 px-1.5 py-0.2 rounded font-mono font-bold text-[8px]">{l.action}</span>
                  </div>
                  <p className="font-semibold text-zinc-200 text-[11px] leading-snug">{l.description}</p>
                  
                  {/* Detailed state properties */}
                  {l.payload && (
                    <div className="bg-[#18181b] border border-zinc-800/60 p-2 rounded text-[9px] font-mono text-zinc-400 max-h-24 overflow-y-auto">
                      {JSON.stringify(l.payload, null, 2)}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-500 block font-mono">Actor Specialist ID: {l.performedBy}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center italic text-zinc-500">No change history tracked in execution timeline.</p>
            )}
          </div>
        </div>
      ) : (
        report && (
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 shadow-lg shadow-black/10 space-y-6 max-w-4xl mx-auto print:border-0 print:shadow-none">
            
            {/* Report Header */}
            <div className="border-b-2 border-zinc-850 pb-4 flex justify-between items-end">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block">EXECUTIVE PORTFOLIO BOARD SYSTEM</span>
                <h1 className="text-xl font-bold tracking-tight text-zinc-150 uppercase">PROJECT STATUS REPORT</h1>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">Report Compiled: {new Date(report.reportDate).toUTCString()}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-zinc-800 text-indigo-400 border border-zinc-700 font-mono font-bold text-xs rounded uppercase">
                  {report.projectCode}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono block mt-1">Project Identifier</span>
              </div>
            </div>

            {/* Project Overview summary boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-[#09090b] p-3 rounded-lg border border-zinc-850">
                <span className="text-[9px] text-zinc-500 font-mono block">STATUS FLAG</span>
                <span className="font-bold text-zinc-200 block text-xs mt-1 uppercase">{report.overallStatus}</span>
              </div>
              <div className="bg-[#09090b] p-3 rounded-lg border border-zinc-850">
                <span className="text-[9px] text-zinc-500 font-mono block">HEALTH EVALUATION</span>
                <span className="font-bold text-emerald-400 block text-xs mt-1 uppercase">{report.overallHealth}</span>
              </div>
              <div className="bg-[#09090b] p-3 rounded-lg border border-zinc-850">
                <span className="text-[9px] text-zinc-500 font-mono block">PROGRESS METRIC</span>
                <span className="font-bold text-indigo-400 block text-xs mt-1 font-mono">{report.progressPercent}%</span>
              </div>
              <div className="bg-[#09090b] p-3 rounded-lg border border-zinc-850">
                <span className="text-[9px] text-zinc-500 font-mono block">EFFORT LOGGER</span>
                <span className="font-bold text-zinc-200 block text-xs mt-1 font-mono">{report.metrics.totalHoursLogged} Hours</span>
              </div>
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Task Breakdown stats */}
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-100 border-b border-zinc-800 pb-1.5 flex items-center space-x-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span>Work Breakdown structure statistics</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-zinc-850/40 pb-1">
                    <span className="text-zinc-450">Total Work Packages (Tasks)</span>
                    <span className="font-mono font-bold text-zinc-200">{report.metrics.totalTasks}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850/40 pb-1">
                    <span className="text-zinc-450">Milestone gates defined</span>
                    <span className="font-mono font-bold text-zinc-200">{report.metrics.totalMilestones}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850/40 pb-1">
                    <span className="text-rose-400 font-medium">Critical Risk matrix indicators</span>
                    <span className="font-mono font-bold text-rose-400">{report.metrics.criticalRisksCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850/40 pb-1">
                    <span className="text-amber-400 font-medium">Unresolved defect register issues</span>
                    <span className="font-mono font-bold text-amber-400">{report.metrics.unresolvedIssuesCount}</span>
                  </div>
                </div>
              </div>

              {/* Status charts */}
              <div className="space-y-3">
                <h3 className="font-semibold text-zinc-100 border-b border-zinc-800 pb-1.5 flex items-center space-x-1.5">
                  <CheckCircle className="h-4 w-4 text-indigo-400" />
                  <span>Task Status Distribution</span>
                </h3>

                <div className="space-y-2 text-[10px]">
                  <div>
                    <div className="flex justify-between text-zinc-400 mb-0.5">
                      <span>Completed / Done</span>
                      <span className="font-mono font-bold">{report.taskStatusBreakdown.DONE}</span>
                    </div>
                    <div className="w-full bg-[#09090b] border border-zinc-800/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(report.taskStatusBreakdown.DONE / Math.max(1, report.metrics.totalTasks)) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-0.5">
                      <span>In Progress / In Review</span>
                      <span className="font-mono font-bold">{report.taskStatusBreakdown.IN_PROGRESS + report.taskStatusBreakdown.IN_REVIEW}</span>
                    </div>
                    <div className="w-full bg-[#09090b] border border-zinc-800/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${((report.taskStatusBreakdown.IN_PROGRESS + report.taskStatusBreakdown.IN_REVIEW) / Math.max(1, report.metrics.totalTasks)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Release milestones list */}
            <div className="space-y-3 pt-2 border-t border-zinc-850/60">
              <h3 className="font-semibold text-zinc-100 flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Project Core Release Milestones Tracker</span>
              </h3>

              <div className="border border-zinc-850/60 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-900/50 text-zinc-400 font-medium text-[10px] border-b border-zinc-800">
                      <th className="p-2.5">Milestone Title</th>
                      <th className="p-2.5">Target Completion Date</th>
                      <th className="p-2.5">Progress Index</th>
                      <th className="p-2.5 text-right">Status Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.milestoneTimeline.map((m: any, idx: number) => (
                      <tr key={idx} className="border-b border-zinc-850/40 last:border-0 text-[10px] hover:bg-zinc-800/10 text-zinc-300 transition-colors">
                        <td className="p-2.5 font-semibold text-zinc-200">{m.title}</td>
                        <td className="p-2.5 font-mono text-zinc-500">{m.dueDate}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-400">{m.progress}%</td>
                        <td className="p-2.5 text-right">
                          {m.isCompleted ? (
                            <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Completed</span>
                          ) : (
                            <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">In-flight</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Disclaimer */}
            <div className="text-center pt-6 border-t border-zinc-850/60 text-[10px] text-zinc-500 italic">
              * This is a dynamic, computer-compiled executive snapshot representing actual project metrics logged in the database snapshot.
            </div>
          </div>
        )
      )}
    </div>
  );
}
