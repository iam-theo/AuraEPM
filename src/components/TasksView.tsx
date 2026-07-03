import React, { useEffect, useState } from "react";
import { api } from "../lib/api.ts";
import { Task, TaskStatus, TaskPriority } from "../modules/project-tracker/types.ts";
import { List, Kanban, Plus, SlidersHorizontal, Trash2, ArrowUpRight, CheckSquare, Clock } from "lucide-react";

interface Props {
  projectId: string;
}

export function TasksView({ projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Layout Style: "list" or "kanban"
  const [layout, setLayout] = useState<"list" | "kanban">("list");

  // Filters & Sorting state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");

  // Selection states (for Bulk Operations)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPriority, setBulkPriority] = useState("");

  // Create Task Form State
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10));
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(8);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, members, mList] = await Promise.all([
        api.getTasks(projectId, {
          search,
          status: statusFilter,
          priority: priorityFilter,
          assigneeId: assigneeFilter,
          sortBy,
          sortOrder
        }),
        api.getTeam(projectId),
        api.getMilestones(projectId)
      ]);
      setTasks(tList);
      setTeam(members);
      setMilestones(mList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, search, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      await api.createTask({
        projectId,
        title,
        description,
        startDate,
        dueDate,
        priority: priority as any,
        assigneeId: assigneeId || null,
        milestoneId: milestoneId || null,
        estimatedHours
      });
      setIsAdding(false);
      setTitle("");
      setDescription("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create task");
    }
  };

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    try {
      await api.updateTask(id, { status });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePriority = async (id: string, priority: TaskPriority) => {
    try {
      await api.updateTask(id, { priority });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Bulk Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map(t => t.id));
    }
  };

  const handleApplyBulkUpdate = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      const payload: any = { taskIds: selectedTaskIds };
      if (bulkStatus) payload.status = bulkStatus;
      if (bulkPriority) payload.priority = bulkPriority;

      await api.bulkUpdateTasks(payload);
      setSelectedTaskIds([]);
      setBulkStatus("");
      setBulkPriority("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete all ${selectedTaskIds.length} selected tasks?`)) return;
    try {
      await api.bulkDeleteTasks({ taskIds: selectedTaskIds });
      setSelectedTaskIds([]);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getAssigneeName = (id: string | null) => {
    if (!id) return "Unassigned";
    const member = team.find(m => m.id === id);
    return member ? member.name : "Unassigned";
  };

  const getMilestoneTitle = (id: string | null) => {
    if (!id) return null;
    const m = milestones.find(x => x.id === id);
    return m ? m.title : null;
  };

  const columns: { label: string; key: TaskStatus }[] = [
    { label: "To Do", key: TaskStatus.TODO },
    { label: "In Progress", key: TaskStatus.IN_PROGRESS },
    { label: "In Review", key: TaskStatus.IN_REVIEW },
    { label: "Done", key: TaskStatus.DONE }
  ];

  return (
    <div className="space-y-6">
      {/* Search and Layout Filter Panel */}
      <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl shadow-lg shadow-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <input
            type="text"
            placeholder="Search active project task lists..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors"
          />
          <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Layout switches */}
          <div className="bg-[#09090b] p-1 rounded-lg flex space-x-1 border border-zinc-800">
            <button
              onClick={() => setLayout("list")}
              className={`p-1.5 rounded-md transition flex items-center space-x-1 ${
                layout === "list" ? "bg-zinc-800 text-indigo-400 border border-zinc-700 font-semibold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setLayout("kanban")}
              className={`p-1.5 rounded-md transition flex items-center space-x-1 ${
                layout === "kanban" ? "bg-zinc-800 text-indigo-400 border border-zinc-700 font-semibold" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Row */}
      <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl shadow-lg shadow-black/10 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-zinc-300">
        <div>
          <label className="block text-zinc-500 mb-1">Filter by Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-zinc-100">
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-zinc-500 mb-1">Filter by Priority</label>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-zinc-100">
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-zinc-500 mb-1">Filter by Assignee</label>
          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-zinc-100">
            <option value="">All Team Members</option>
            {team.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-zinc-500 mb-1">Sort Registry By</label>
          <div className="flex space-x-1">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 text-zinc-100">
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority Rating</option>
              <option value="estimatedHours">Estimated Effort</option>
              <option value="createdAt">Created Time</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-lg px-2"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-indigo-950/40 text-indigo-200 border border-indigo-900/40 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <span>{selectedTaskIds.length} tasks selected</span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span>Set Status:</span>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded p-1 focus:outline-none">
                <option value="">Select...</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="flex items-center space-x-1.5">
              <span>Set Priority:</span>
              <select value={bulkPriority} onChange={e => setBulkPriority(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded p-1 focus:outline-none">
                <option value="">Select...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <button onClick={handleApplyBulkUpdate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1 rounded transition shadow-sm">
              Apply Changes
            </button>
            <button onClick={handleBulkDelete} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-medium px-2.5 py-1 rounded transition flex items-center space-x-1">
              <Trash2 className="h-3 w-3" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal-form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-[#18181b] border border-zinc-800 p-6 rounded-xl space-y-4 text-xs text-zinc-300 shadow-lg shadow-black/10">
          <h3 className="text-sm font-semibold text-zinc-100">Add New Work Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 mb-1">Task Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Target Assignee Specialist</label>
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500">
                <option value="">Unassigned</option>
                {team.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-zinc-500 mb-1">Task Description / Deliverables Guidelines</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Milestone Anchor</label>
              <select value={milestoneId} onChange={e => setMilestoneId(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500">
                <option value="">No Milestone Anchor</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 mb-1">Priority Rating</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Estimated Effort (Hours)</label>
              <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(Number(e.target.value))} min={1} className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border border-zinc-700 bg-zinc-850 text-zinc-300 hover:bg-zinc-800 rounded-lg transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/10">Save Task Node</button>
          </div>
        </form>
      )}

      {/* Main Layout Rendering */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#18181b] border border-zinc-800 text-center py-12 rounded-xl text-zinc-500 italic text-xs">
          No tasks match the active selection criteria.
        </div>
      ) : layout === "list" ? (
        /* LIST REGISTRY TABLE */
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl shadow-lg shadow-black/10 overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/40 text-zinc-400 border-b border-zinc-800 font-medium">
                <th className="p-3 w-10 text-center">
                  <input type="checkbox" checked={selectedTaskIds.length === tasks.length} onChange={handleSelectAll} />
                </th>
                <th className="p-3">Task Title</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Effort</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const isSelected = selectedTaskIds.includes(t.id);
                return (
                  <tr key={t.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 text-zinc-300 transition ${isSelected ? "bg-indigo-500/5" : ""}`}>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(t.id)} />
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-semibold text-zinc-100 block">{t.title}</span>
                        {getMilestoneTitle(t.milestoneId) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 mt-1 bg-zinc-800 text-zinc-400 font-mono text-[9px] rounded border border-zinc-700">
                            Milestone: {getMilestoneTitle(t.milestoneId)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-zinc-300">{getAssigneeName(t.assigneeId)}</td>
                    <td className="p-3">
                      <select
                        value={t.priority}
                        onChange={e => handleUpdatePriority(t.id, e.target.value as any)}
                        className={`font-mono text-[10px] p-1 border rounded focus:outline-none ${
                          t.priority === "URGENT" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          t.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          t.priority === "MEDIUM" ? "bg-zinc-800 text-zinc-300 border border-zinc-700" :
                          "bg-zinc-900 text-zinc-400 border border-zinc-850"
                        }`}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={t.status}
                        onChange={e => handleUpdateStatus(t.id, e.target.value as any)}
                        className="bg-zinc-900 text-zinc-300 p-1 border border-zinc-850 rounded focus:outline-none"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </td>
                    <td className="p-3 text-zinc-500 font-mono">{t.dueDate}</td>
                    <td className="p-3 text-zinc-400 font-mono">{t.actualHours}/{t.estimatedHours}h</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDeleteTask(t.id)} className="p-1 text-zinc-500 hover:text-rose-400 rounded transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-zinc-200 text-xs">{col.label}</span>
                  <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] px-2 py-0.5 rounded-full font-mono">{colTasks.length}</span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map(t => (
                    <div key={t.id} className="bg-[#09090b] border border-zinc-800 p-3.5 rounded-lg shadow-lg shadow-black/10 space-y-3 hover:border-indigo-500/50 transition duration-200">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-zinc-100 text-xs block leading-snug">{t.title}</span>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-zinc-600 hover:text-rose-400 transition">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Info lines */}
                      <div className="text-[11px] text-zinc-400 space-y-1 bg-[#18181b] p-2 rounded border border-zinc-800/40">
                        <div className="flex justify-between">
                          <span>Owner</span>
                          <span className="font-medium text-zinc-200">{getAssigneeName(t.assigneeId)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Due</span>
                          <span className="font-mono text-zinc-400">{t.dueDate}</span>
                        </div>
                      </div>

                      {/* Quick transition triggers */}
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-800/60">
                        {/* Status Shift Buttons */}
                        <div className="flex space-x-1">
                          {col.key !== TaskStatus.TODO && (
                            <button
                              onClick={() => {
                                const prevIdx = columns.findIndex(c => c.key === col.key) - 1;
                                handleUpdateStatus(t.id, columns[prevIdx].key);
                              }}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded font-mono text-[9px] text-zinc-300 transition"
                            >
                              &larr; Back
                            </button>
                          )}
                          {col.key !== TaskStatus.DONE && (
                            <button
                              onClick={() => {
                                const nextIdx = columns.findIndex(c => c.key === col.key) + 1;
                                handleUpdateStatus(t.id, columns[nextIdx].key);
                              }}
                              className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 rounded font-mono text-[9px] text-white transition shadow-sm"
                            >
                              Next &rarr;
                            </button>
                          )}
                        </div>

                        {/* Priority Bubble */}
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded border ${
                          t.priority === "URGENT" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                          t.priority === "HIGH" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-zinc-800 border-zinc-700 text-zinc-300"
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
