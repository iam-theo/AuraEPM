import React, { useState, useEffect } from "react";
import { Users, UserPlus, Search, Shield, Building, Filter, X, Check, Save, Briefcase, ListTodo, User, ExternalLink, AlertTriangle, Activity, Lock, MessageSquare, FileText, History } from "lucide-react";
import { api } from "../lib/api.ts";
import { motion, AnimatePresence } from "motion/react";

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "projects" | "tasks" | "risks" | "activity" | "security" | "resources" | "milestones">("profile");
  const [userDetails, setUserDetails] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [userRisks, setUserRisks] = useState<any[]>([]);
  const [userAuditLogs, setUserAuditLogs] = useState<any[]>([]);
  const [userChatMessages, setUserChatMessages] = useState<any[]>([]);
  const [userChangeRequests, setUserChangeRequests] = useState<any[]>([]);
  const [userSecurityLogs, setUserSecurityLogs] = useState<any[]>([]);
  const [userLoginHistory, setUserLoginHistory] = useState<any[]>([]);
  const [userResources, setUserResources] = useState<any[]>([]);
  const [userMilestones, setUserMilestones] = useState<any[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    roleCode: "",
    password: "",
    selectedPermissions: [] as string[]
  });
  
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetails(selectedUserId);
    } else {
      setUserDetails(null);
      setUserProjects([]);
      setUserTasks([]);
    }
  }, [selectedUserId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get("/v1/auth/users"),
        api.get("/v1/auth/roles"),
        api.get("/v1/auth/departments"),
        api.get("/v1/auth/permissions")
      ]);

      const [usersRes, rolesRes, deptsRes, permsRes] = results;

      if (usersRes.status === "fulfilled") setUsers(usersRes.value || []);
      else console.error("Failed to fetch users:", usersRes.reason);

      if (rolesRes.status === "fulfilled") setRoles(rolesRes.value || []);
      else console.error("Failed to fetch roles:", rolesRes.reason);

      if (deptsRes.status === "fulfilled") setDepartments(deptsRes.value || []);
      else console.error("Failed to fetch depts:", deptsRes.reason);

      if (permsRes.status === "fulfilled") {
        const permsData = permsRes.value || [];
        // Flatten grouped permissions if they come in Category -> Group -> Permissions format
        const flatPerms = Array.isArray(permsData) && permsData.length > 0 && permsData[0].groups
          ? permsData.flatMap((cat: any) => 
              cat.groups.flatMap((group: any) => group.permissions)
            )
          : permsData;
        setPermissions(flatPerms);
      } else {
        console.error("Failed to fetch perms:", permsRes.reason);
      }

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchUserDetails = async (id: string) => {
    setIsFetchingDetails(true);
    try {
      const [
        details, projects, tasks, risks, auditLogs, 
        chats, changes, security, logins, resourcesData, milestonesData
      ] = await Promise.all([
        api.get(`/v1/users/${id}`),
        api.getUserProjects(id),
        api.getUserTasks(id),
        api.getUserRisksIssues(id),
        api.getUserAuditLogs(id),
        api.getUserChatMessages(id),
        api.getUserChangeRequests(id),
        api.getUserSecurityLogs(id),
        api.getUserLoginHistory(id),
        api.getUserResources(id),
        api.getUserMilestones(id)
      ]);
      setUserDetails(details);
      setUserProjects(projects || []);
      setUserTasks(tasks || []);
      setUserRisks(risks || []);
      setUserAuditLogs(auditLogs || []);
      setUserChatMessages(chats || []);
      setUserChangeRequests(changes || []);
      setUserSecurityLogs(security || []);
      setUserLoginHistory(logins || []);
      setUserResources(resourcesData || []);
      setUserMilestones(milestonesData || []);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    }
    setIsFetchingDetails(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/v1/auth/users", {
        ...formData,
        permissions: formData.selectedPermissions
      });
      setIsCreating(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        roleCode: "",
        password: "",
        selectedPermissions: []
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (code: string) => {
    setFormData(prev => {
      const perms = prev.selectedPermissions.includes(code)
        ? prev.selectedPermissions.filter(p => p !== code)
        : [...prev.selectedPermissions, code];
      return { ...prev, selectedPermissions: perms };
    });
  };

  const filteredUsers = users.filter(u => {
    const searchString = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase();
    const matchSearch = searchString.includes(search.toLowerCase());
    const matchDept = deptFilter === "ALL" || u.department === deptFilter;
    return matchSearch && matchDept;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INACTIVE': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'DRAFT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PLANNING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ON_TRACK': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'AT_RISK': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'DONE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'TODO': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (isCreating) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <UserPlus className="h-7 w-7 text-indigo-600" />
              Create New User
            </h1>
            <p className="text-sm text-slate-500 mt-1">Provision a new account with specific roles and direct permissions.</p>
          </div>
          <button 
            onClick={() => setIsCreating(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input 
                  required 
                  type="text"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input 
                  required 
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  required 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Password</label>
                <input 
                  required 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Password123!"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select 
                  required
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="New">Add New (Type in below)</option>
                </select>
                {formData.department === "New" && (
                   <input 
                    type="text"
                    placeholder="Enter new department"
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" /> Role & Permissions
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Role</label>
              <select 
                value={formData.roleCode}
                onChange={e => setFormData({...formData, roleCode: e.target.value})}
                className="w-full md:w-1/2 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">No Role (Permissions only)</option>
                {roles.map(r => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Direct Permissions (Optional overrides)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50">
                {permissions.map(p => {
                  const isSelected = formData.selectedPermissions.includes(p.name);
                  return (
                    <div 
                      key={p.name}
                      onClick={() => togglePermission(p.name)}
                      className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800 leading-none">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Create User
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            Users Management
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage enterprise access, roles, and security profiles.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-slate-400" />
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full md:w-64 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No users found</h3>
              <p className="text-slate-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr 
                    key={u.id} 
                    onClick={() => setSelectedUserId(u.id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{u.firstName} {u.lastName}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building className="h-4 w-4 text-slate-400" />
                        {u.department || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
                    {userDetails?.firstName?.[0] || users.find(u => u.id === selectedUserId)?.firstName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {userDetails 
                        ? `${userDetails.firstName} ${userDetails.lastName}` 
                        : (() => {
                            const u = users.find(u => u.id === selectedUserId);
                            return u ? `${u.firstName} ${u.lastName}` : "User Details";
                          })()
                      }
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                      {userDetails?.email || users.find(u => u.id === selectedUserId)?.email}
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      {userDetails?.department || users.find(u => u.id === selectedUserId)?.department || "Unassigned"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs Nav */}
                <div className="flex border-b border-slate-200 bg-slate-50/30 px-6 overflow-x-auto no-scrollbar">
                {[
                  { id: "profile", label: "Profile", icon: User },
                  { id: "projects", label: "Projects", icon: Briefcase },
                  { id: "tasks", label: "Tasks", icon: ListTodo },
                  { id: "resources", label: "Resources", icon: Building },
                  { id: "milestones", label: "Milestones", icon: Check },
                  { id: "risks", label: "Risks & Issues", icon: AlertTriangle },
                  { id: "activity", label: "Activity Logs", icon: Activity },
                  { id: "security", label: "Security", icon: Lock }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-4 text-sm font-medium transition-all relative shrink-0 ${
                      activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                {isFetchingDetails ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                    <div className="h-8 w-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm font-medium">Fetching associated records...</p>
                  </div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "profile" && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contact Information</h3>
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Full Name</label>
                                <p className="text-slate-900 font-medium mt-0.5">{userDetails?.firstName} {userDetails?.lastName}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Email Address</label>
                                <p className="text-slate-900 font-medium mt-0.5">{userDetails?.email}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Username</label>
                                <p className="text-slate-900 font-medium mt-0.5">@{userDetails?.username || 'user'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Employment Details</h3>
                            <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Department</label>
                                <p className="text-slate-900 font-medium mt-0.5">{userDetails?.department || "Unassigned"}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Job Title</label>
                                <p className="text-slate-900 font-medium mt-0.5">{userDetails?.jobTitle || "Software Engineer"}</p>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 font-medium uppercase tracking-tighter">Employee ID</label>
                                <p className="text-slate-900 font-medium mt-0.5">{userDetails?.employeeId || "EMP-001"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "projects" && (
                      <div className="space-y-4">
                        {userProjects.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No projects currently managed by this user.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userProjects.map(project => (
                              <div key={project.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{project.description || "No description provided."}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Building className="h-3 w-3" />
                                    {project.clientName || "Enterprise"}
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "tasks" && (
                      <div className="space-y-4">
                        {userTasks.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <ListTodo className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No tasks currently assigned to this user.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userTasks.map(task => (
                              <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                                    task.priority === 'URGENT' ? 'bg-rose-500' : 
                                    task.priority === 'HIGH' ? 'bg-amber-500' : 'bg-slate-300'
                                  }`} />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 truncate">{task.title}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                                      {task.priority} Priority
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all cursor-pointer">
                                    <ExternalLink className="h-4 w-4" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "resources" && (
                      <div className="space-y-4">
                        {userResources.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No resources linked to this user profile.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userResources.map(res => (
                              <div key={res.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-slate-900">{res.name}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(res.status)}`}>
                                    {res.status}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Building className="h-3 w-3" />
                                    {res.department || "Corporate"}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    Type: {res.type}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "milestones" && (
                      <div className="space-y-4">
                        {userMilestones.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <Check className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No direct milestones associated with this user.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userMilestones.map((m, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">{m.name || m.title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">Project: {m.projectName}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "risks" && (
                      <div className="space-y-4">
                        {userRisks.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No risks or issues owned by this user.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userRisks.map(risk => (
                              <div key={risk.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${risk.type === 'RISK' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                                    <AlertTriangle className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">{risk.title}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">{risk.type} • Priority: {risk.priority}</div>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(risk.status)}`}>
                                  {risk.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "activity" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Recent Audit Logs
                          </h4>
                          {userAuditLogs.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No activity logs found.</p>
                          ) : (
                            <div className="space-y-2">
                              {userAuditLogs.map(log => (
                                <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-100 text-sm flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <History className="h-4 w-4 text-slate-300" />
                                    <div>
                                      <span className="font-semibold text-indigo-600">{log.action}</span>
                                      <span className="text-slate-500 mx-2">on</span>
                                      <span className="text-slate-900">{log.entityType}</span>
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {new Date(log.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" /> Recent Chat Messages
                          </h4>
                          {userChatMessages.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No recent messages.</p>
                          ) : (
                            <div className="space-y-2">
                              {userChatMessages.map(msg => (
                                <div key={msg.id} className="bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-900">Project Context</span>
                                    <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="text-slate-600 italic">"{msg.content}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-3 w-3" /> Change Requests
                          </h4>
                          {userChangeRequests.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No change requests initiated.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {userChangeRequests.map(cr => (
                                <div key={cr.id} className="bg-white p-3 rounded-xl border border-slate-100 text-sm flex justify-between items-center">
                                  <div className="font-medium text-slate-900">{cr.title}</div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(cr.status)}`}>
                                    {cr.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "security" && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Lock className="h-3 w-3" /> Security Events
                          </h4>
                          {userSecurityLogs.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No security events recorded.</p>
                          ) : (
                            <div className="space-y-2">
                              {userSecurityLogs.map(log => (
                                <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-100 text-sm flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-rose-500" />
                                    <span className="font-medium text-slate-900">{log.action}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {new Date(log.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History className="h-3 w-3" /> Login History
                          </h4>
                          {userLoginHistory.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No login records.</p>
                          ) : (
                            <div className="space-y-2">
                              {userLoginHistory.map(login => (
                                <div key={login.id} className="bg-white p-3 rounded-xl border border-slate-100 text-sm flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${login.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-slate-600">{login.ipAddress || 'Unknown IP'}</span>
                                    {!login.success && <span className="text-rose-500 text-xs font-bold">(Failed)</span>}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {new Date(login.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
