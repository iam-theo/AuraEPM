import React, { useState, useEffect } from "react";
import { 
  Shield, Layout, Settings, Users, Key, Box, ChevronRight, ChevronDown,
  Plus, Save, Trash2, Search, Filter, CheckCircle2, AlertCircle,
  ToggleLeft, ToggleRight, Eye, Edit, X, Lock, Unlock, Clock,
  Activity, Grid, Circle, Layers, Settings2, Copy, RefreshCw,
  HelpCircle, AlertTriangle, Play, HelpCircle as Help, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../lib/api";

type AdminTab = "IAM" | "DASHBOARDS" | "POLICIES" | "MODULES";

export const AdminConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("IAM");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "IAM") {
        const [rolesData, permsData, matrixData, usersData, logsData] = await Promise.all([
          api.getRoles(),
          api.getPermissions(),
          api.getPermissionMatrix(),
          api.get("/v1/auth/users"),
          api.getSecurityLogs()
        ]);
        setRoles(rolesData || []);
        setPermissions(permsData || []);
        setPermissionMatrix(matrixData || null);
        setUsersList(usersData || []);
        setLogs(logsData || []);
        
        if (rolesData && rolesData.length > 0 && !selectedRole) {
          setSelectedRole(rolesData[0]);
        }
        if (usersData && usersData.length > 0 && !selectedUser) {
          setSelectedUser(usersData[0]);
          fetchUserProfile(usersData[0].id);
        }
      } else if (activeTab === "DASHBOARDS") {
        const [widgetsData, templatesData] = await Promise.all([
          api.getWidgets(),
          api.get("/v1/dashboards/templates")
        ]);
        setWidgets(widgetsData || []);
        setTemplates(templatesData || []);
      } else if (activeTab === "POLICIES") {
        const policiesData = await api.get("/v1/auth/policies");
        setPolicies(policiesData || []);
      } else if (activeTab === "MODULES") {
        const modulesData = await api.get("/v1/auth/modules");
        setModulesList(modulesData || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await api.get(`/v1/auth/users/${userId}/profile`);
      setUserProfile(profile || null);
    } catch (err) {
      console.error("Failed to fetch user security profile", err);
    }
  };

  const handleCreateRole = async (newRoleData: any) => {
    try {
      await api.createRole(newRoleData);
      await fetchData();
      alert("Role created successfully");
    } catch (err: any) {
      alert("Failed to create role: " + err.message);
    }
  };

  const handleUpdateRole = async (updatedRole: any) => {
    try {
      await api.updateRole(updatedRole.code, updatedRole);
      await fetchData();
      alert("Role updated successfully");
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  const handleDeleteRole = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete the role '${code}'?`)) return;
    try {
      await api.deleteRole(code);
      setSelectedRole(null);
      await fetchData();
      alert("Role deleted successfully");
    } catch (err: any) {
      alert("Failed to delete role: " + err.message);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm font-mono animate-pulse">Syncing Enterprise Records...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "IAM":
        return (
          <IAMManagement 
            roles={roles} 
            permissions={permissions}
            permissionMatrix={permissionMatrix}
            selectedRole={selectedRole} 
            setSelectedRole={setSelectedRole} 
            onUpdateRole={handleUpdateRole}
            onCreateRole={handleCreateRole}
            onDeleteRole={handleDeleteRole}
            usersList={usersList}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            userProfile={userProfile}
            fetchUserProfile={fetchUserProfile}
            logs={logs}
            fetchData={fetchData}
          />
        );
      case "DASHBOARDS":
        return (
          <DashboardManagement 
            widgets={widgets} 
            templates={templates} 
            roles={roles}
            refresh={fetchData} 
          />
        );
      case "POLICIES":
        return (
          <PolicyManagement 
            policies={policies} 
            refresh={fetchData} 
          />
        );
      case "MODULES":
        return (
          <ModuleManagement 
            modulesList={modulesList} 
            refresh={fetchData} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between">
        <div className="flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Aura Admin
            </h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold font-mono">IAM & Orgs Control</p>
          </div>

          <nav className="p-4 space-y-2">
            <NavButton 
              active={activeTab === "IAM"} 
              onClick={() => setActiveTab("IAM")}
              icon={<Shield className="w-4 h-4" />}
              label="Identity & Access"
            />
            <NavButton 
              active={activeTab === "DASHBOARDS"} 
              onClick={() => setActiveTab("DASHBOARDS")}
              icon={<Layout className="w-4 h-4" />}
              label="Dashboard Engine"
            />
            <NavButton 
              active={activeTab === "POLICIES"} 
              onClick={() => setActiveTab("POLICIES")}
              icon={<Key className="w-4 h-4" />}
              label="Policy Engine"
            />
            <NavButton 
              active={activeTab === "MODULES"} 
              onClick={() => setActiveTab("MODULES")}
              icon={<Box className="w-4 h-4" />}
              label="Module Control"
            />
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-1.5 bg-slate-950/40">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>PLATFORM:</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>ENGINE_VER:</span>
            <span>v5.2.0-STABLE</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Console</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-100 font-semibold uppercase tracking-wider text-xs font-mono">{activeTab}</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1 text-xs font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-xs font-mono text-slate-400">Auth Context: Super Admin</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-950/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full p-8"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
      active 
        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-600/35 shadow-sm" 
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
    }`}
  >
    {icon}
    {label}
  </button>
);

/* ==========================================
   IAM MANAGEMENT PANEL
   ========================================== */
const IAMManagement = ({ 
  roles, permissions, permissionMatrix, selectedRole, setSelectedRole, onUpdateRole, onCreateRole, onDeleteRole,
  usersList, selectedUser, setSelectedUser, userProfile, fetchUserProfile, logs, fetchData 
}: any) => {
  const [activeSubTab, setActiveSubTab] = useState<"ROLES" | "USERS" | "AUDIT">("ROLES");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Form states for role creation
  const [newRole, setNewRole] = useState({
    name: "",
    code: "",
    description: "",
    color: "#6366f1",
    icon: "Shield",
    hierarchyLevel: 2,
    isSuperAdmin: false,
    isDefault: false,
    departmentScope: "",
    businessUnitScope: "",
    permissionNames: [] as string[]
  });

  const [localRoleForm, setLocalRoleForm] = useState<any>(null);

  useEffect(() => {
    if (selectedRole) {
      setLocalRoleForm({
        ...selectedRole,
        permissionNames: selectedRole.permissionNames || []
      });
    }
  }, [selectedRole]);

  // Expand categories by default
  useEffect(() => {
    if (permissions && permissions.length > 0) {
      const defaultState: Record<string, boolean> = {};
      permissions.forEach((cat: any) => {
        defaultState[cat.id] = true;
      });
      setExpandedCategories(defaultState);
    }
  }, [permissions]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, catId: !prev[catId] }));
  };

  const handleLocalPermissionToggle = (permName: string) => {
    if (!localRoleForm) return;
    const current = localRoleForm.permissionNames || [];
    const exists = current.includes(permName);
    const updated = exists 
      ? current.filter((p: string) => p !== permName)
      : [...current, permName];
    setLocalRoleForm({ ...localRoleForm, permissionNames: updated });
  };

  const handleBulkPermissionSelect = (permNames: string[], select: boolean) => {
    if (!localRoleForm) return;
    const current = localRoleForm.permissionNames || [];
    let updated;
    if (select) {
      updated = Array.from(new Set([...current, ...permNames]));
    } else {
      updated = current.filter((p: string) => !permNames.includes(p));
    }
    setLocalRoleForm({ ...localRoleForm, permissionNames: updated });
  };

  const handleAssignRoleToUser = async (roleCode: string) => {
    if (!selectedUser) return;
    try {
      await api.post(`/v1/auth/users/${selectedUser.id}/roles`, { roleCode });
      await fetchUserProfile(selectedUser.id);
      alert(`Role ${roleCode} assigned successfully`);
    } catch (err: any) {
      alert("Failed to assign role: " + err.message);
    }
  };

  const handleRemoveRoleFromUser = async (roleCode: string) => {
    if (!selectedUser) return;
    try {
      await api.delete(`/v1/auth/users/${selectedUser.id}/roles/${roleCode}`);
      await fetchUserProfile(selectedUser.id);
      alert(`Role ${roleCode} removed successfully`);
    } catch (err: any) {
      alert("Failed to remove role: " + err.message);
    }
  };

  const handleDirectOverride = async (permissionName: string, type: "ALLOW" | "DENY") => {
    if (!selectedUser) return;
    try {
      await api.post(`/v1/auth/users/${selectedUser.id}/permissions`, { permissionName, type });
      await fetchUserProfile(selectedUser.id);
      alert(`Direct override set to ${type} for ${permissionName}`);
    } catch (err: any) {
      alert("Failed to set override: " + err.message);
    }
  };

  const handleRemoveOverride = async (permissionName: string) => {
    if (!selectedUser) return;
    try {
      await api.delete(`/v1/auth/users/${selectedUser.id}/permissions/${permissionName}`);
      await fetchUserProfile(selectedUser.id);
      alert(`Direct override removed`);
    } catch (err: any) {
      alert("Failed to remove override: " + err.message);
    }
  };

  const filteredRoles = roles.filter((r: any) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <SubTabButton active={activeSubTab === "ROLES"} onClick={() => setActiveSubTab("ROLES")} label="Enterprise Roles Builder" />
          <SubTabButton active={activeSubTab === "USERS"} onClick={() => setActiveSubTab("USERS")} label="User Overrides & Assignments" />
          <SubTabButton active={activeSubTab === "AUDIT"} onClick={() => setActiveSubTab("AUDIT")} label="IAM Security Logs" />
        </div>
        {activeSubTab === "ROLES" && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            New Custom Role
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeSubTab === "ROLES" && (
          <div className="grid grid-cols-12 gap-8 h-full">
            {/* Roles List */}
            <div className="col-span-4 bg-slate-900/30 rounded-xl border border-slate-800 flex flex-col h-[74vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">Role Manifest</h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded border border-indigo-500/20">
                  {filteredRoles.length} Active
                </span>
              </div>
              <div className="p-3 border-b border-slate-800 bg-slate-950/40">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search standard/custom roles..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {filteredRoles.map((role: any) => {
                  const isSelected = selectedRole?.id === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                        isSelected 
                          ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300" 
                          : "hover:bg-slate-800/40 bg-slate-900/10 border-slate-800/60 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold border"
                          style={{ 
                            backgroundColor: `${role.color || '#6366f1'}15`, 
                            borderColor: `${role.color || '#6366f1'}40`,
                            color: role.color || '#6366f1'
                          }}
                        >
                          {role.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? "text-indigo-200" : "text-slate-300"}`}>{role.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">{role.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isSystem && (
                          <span className="text-[8px] border border-slate-700 font-mono text-slate-500 px-1 py-0.5 rounded bg-slate-850">SYSTEM</span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "translate-x-0 text-indigo-400" : "-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Role Builder Panel */}
            <div className="col-span-8 overflow-auto h-[74vh] pr-2 space-y-6">
              {localRoleForm ? (
                <>
                  {/* Header / Summary Card */}
                  <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/30 to-slate-900/10">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border"
                        style={{ 
                          backgroundColor: `${localRoleForm.color || '#6366f1'}20`, 
                          borderColor: `${localRoleForm.color || '#6366f1'}40`,
                          color: localRoleForm.color || '#6366f1'
                        }}
                      >
                        {localRoleForm.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-100">{localRoleForm.name}</h2>
                          {localRoleForm.isSystem && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">ReadOnly System</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{localRoleForm.description || "Enterprise authorization role container."}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!localRoleForm.isSystem && (
                        <button 
                          onClick={() => onDeleteRole(localRoleForm.code)}
                          className="p-2 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                          title="Delete custom role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => onUpdateRole(localRoleForm)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/15"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Profile
                      </button>
                    </div>
                  </div>

                  {/* Settings Tabs Container */}
                  <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 space-y-6">
                    <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-indigo-400" />
                      Role Settings & Metadata
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Role Name</label>
                          <input 
                            type="text" 
                            disabled={localRoleForm.isSystem}
                            value={localRoleForm.name}
                            onChange={(e) => setLocalRoleForm({ ...localRoleForm, name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                          <textarea 
                            rows={3}
                            value={localRoleForm.description || ""}
                            onChange={(e) => setLocalRoleForm({ ...localRoleForm, description: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Aura Badge Color</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={localRoleForm.color || "#6366f1"}
                                onChange={(e) => setLocalRoleForm({ ...localRoleForm, color: e.target.value })}
                                className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={localRoleForm.color || "#6366f1"}
                                onChange={(e) => setLocalRoleForm({ ...localRoleForm, color: e.target.value })}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Hierarchy Priority</label>
                            <input 
                              type="number" 
                              min="0"
                              max="10"
                              value={localRoleForm.hierarchyLevel || 0}
                              onChange={(e) => setLocalRoleForm({ ...localRoleForm, hierarchyLevel: Number(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Department Scope</label>
                            <select 
                              value={localRoleForm.departmentScope || ""}
                              onChange={(e) => setLocalRoleForm({ ...localRoleForm, departmentScope: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs"
                            >
                              <option value="">Global/Unified</option>
                              <option value="Engineering">Engineering</option>
                              <option value="Operations">Operations</option>
                              <option value="Finance">Finance</option>
                              <option value="Executive">Executive</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">Business Unit Scope</label>
                            <select 
                              value={localRoleForm.businessUnitScope || ""}
                              onChange={(e) => setLocalRoleForm({ ...localRoleForm, businessUnitScope: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs"
                            >
                              <option value="">Global/Unified</option>
                              <option value="North America">North America</option>
                              <option value="EMEA">EMEA</option>
                              <option value="APAC">APAC</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-6 pt-2">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={!!localRoleForm.isSuperAdmin}
                              onChange={(e) => setLocalRoleForm({ ...localRoleForm, isSuperAdmin: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900"
                            />
                            <span className="text-xs text-slate-300">Grant Super Admin Privileges</span>
                          </label>
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={!!localRoleForm.isDefault}
                              onChange={(e) => setLocalRoleForm({ ...localRoleForm, isDefault: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900"
                            />
                            <span className="text-xs text-slate-300">Default Onboard Role</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise Permission Tree Matrix */}
                  <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-400" />
                        Enterprise Permission Matrix
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-500/5 px-2.5 py-1 rounded border border-indigo-500/15">
                        {localRoleForm.permissionNames?.length || 0} Permissions Selected
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {permissions.map((category: any) => {
                        const catPermissions = category.groups.flatMap((g: any) => g.permissions.map((p: any) => p.name));
                        const isCatAllChecked = catPermissions.every((pName: string) => localRoleForm.permissionNames?.includes(pName));
                        const isCatSomeChecked = catPermissions.some((pName: string) => localRoleForm.permissionNames?.includes(pName)) && !isCatAllChecked;

                        return (
                          <div key={category.id} className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/20">
                            {/* Category Header */}
                            <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <button 
                                  onClick={() => toggleCategory(category.id)}
                                  className="text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategories[category.id] ? "rotate-0" : "-rotate-90"}`} />
                                </button>
                                <input 
                                  type="checkbox"
                                  ref={(el) => {
                                    if (el) el.indeterminate = isCatSomeChecked;
                                  }}
                                  checked={isCatAllChecked}
                                  onChange={(e) => handleBulkPermissionSelect(catPermissions, e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-bold text-slate-200">{category.name}</span>
                                  <span className="text-[9px] text-slate-500 font-mono ml-2 uppercase tracking-wide">/{category.code}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Module Group</span>
                            </div>

                            {/* Category Groups list */}
                            {expandedCategories[category.id] !== false && (
                              <div className="p-4 space-y-4">
                                {category.groups.map((group: any) => (
                                  <div key={group.id} className="space-y-2 pl-4 border-l border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-300">{group.name}</span>
                                      <span className="text-[9px] font-mono text-slate-500">({group.code})</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                      {group.permissions.map((perm: any) => {
                                        const isChecked = localRoleForm.permissionNames?.includes(perm.name);
                                        return (
                                          <div 
                                            key={perm.id} 
                                            onClick={() => handleLocalPermissionToggle(perm.name)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                                              isChecked 
                                                ? "bg-indigo-600/5 border-indigo-600/25 text-indigo-300" 
                                                : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400"
                                            }`}
                                          >
                                            <input 
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}} // Handled by div click
                                              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900 mt-0.5 cursor-pointer"
                                            />
                                            <div className="flex-1">
                                              <p className={`text-xs font-medium ${isChecked ? "text-indigo-200" : "text-slate-300"}`}>{perm.label}</p>
                                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">{perm.name}</p>
                                              {perm.description && <p className="text-[9.5px] text-slate-400 mt-1">{perm.description}</p>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[74vh] flex flex-col items-center justify-center text-slate-500 bg-slate-900/10 rounded-xl border border-dashed border-slate-800">
                  <Shield className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-medium text-slate-400 text-xs uppercase tracking-wider">No Role Selected</p>
                  <p className="text-slate-500 text-[11px] mt-1">Select an authorization role from the list to view and configure its system policy matrix</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "USERS" && (
          <div className="grid grid-cols-12 gap-8 h-full">
            {/* User Selection */}
            <div className="col-span-4 bg-slate-900/30 rounded-xl border border-slate-800 flex flex-col h-[74vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">Users Directory</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                  {usersList.length} Accounts
                </span>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {usersList.map((usr: any) => {
                  const isSelected = selectedUser?.id === usr.id;
                  return (
                    <button
                      key={usr.id}
                      onClick={() => {
                        setSelectedUser(usr);
                        fetchUserProfile(usr.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                        isSelected 
                          ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300" 
                          : "hover:bg-slate-800/40 bg-slate-900/10 border-slate-800/60 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs uppercase tracking-widest text-slate-400">
                          {usr.name ? usr.name.slice(0, 2) : "US"}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? "text-indigo-200" : "text-slate-300"}`}>{usr.name || usr.email}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{usr.department || "No Department"}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "translate-x-0 text-indigo-400" : "-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User overrides control panel */}
            <div className="col-span-8 overflow-auto h-[74vh] pr-2 space-y-6">
              {selectedUser && userProfile ? (
                <div className="space-y-6">
                  {/* Summary footprint */}
                  <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 bg-gradient-to-r from-slate-900/30 to-slate-900/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-base text-indigo-400 uppercase tracking-widest">
                        {selectedUser.name ? selectedUser.name.slice(0, 2) : "US"}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-100">{selectedUser.name}</h2>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{selectedUser.email} &bull; Dept: {selectedUser.department || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Roles */}
                  <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 space-y-4">
                    <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      Assigned Security Roles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.roles?.map((r: any) => (
                        <div key={r.code} className="bg-indigo-600/15 border border-indigo-600/30 text-indigo-300 text-xs px-3 py-1 rounded-full flex items-center gap-2 font-semibold">
                          <span>{r.name}</span>
                          <span className="text-[10px] text-indigo-500">({r.code})</span>
                          <button 
                            onClick={() => handleRemoveRoleFromUser(r.code)}
                            className="text-indigo-400 hover:text-indigo-200 font-bold ml-1"
                            title="Revoke role assignment"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {userProfile.roles?.length === 0 && (
                        <p className="text-slate-500 text-xs italic">No roles explicitly assigned to this account.</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/60">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Assign Additional Enterprise Role</label>
                      <div className="flex gap-2">
                        <select 
                          id="add-role-selector"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                        >
                          <option value="">-- Choose security role --</option>
                          {roles.map((r: any) => (
                            <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => {
                            const val = (document.getElementById("add-role-selector") as HTMLSelectElement)?.value;
                            if (val) handleAssignRoleToUser(val);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg text-white"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Direct Permission Overrides */}
                  <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 space-y-4">
                    <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      Direct User Level Overrides
                    </h3>

                    {userProfile.directOverrides && userProfile.directOverrides.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-auto">
                        {userProfile.directOverrides.map((override: any) => (
                          <div key={override.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40 text-xs">
                            <div>
                              <p className="font-semibold text-slate-200">{override.label || override.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{override.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                override.type === "ALLOW" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {override.type}
                              </span>
                              <button 
                                onClick={() => handleRemoveOverride(override.name)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic">No direct overrides assigned. Permissions are computed from roles and active policies.</p>
                    )}

                    <div className="pt-3 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Permission Override</label>
                        <select 
                          id="override-perm-selector"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                        >
                          <option value="">-- Choose permission --</option>
                          {permissions.flatMap((c: any) => c.groups.flatMap((g: any) => g.permissions)).map((p: any) => (
                            <option key={p.name} value={p.name}>{p.label} ({p.name})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Override Mode & Save</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const perm = (document.getElementById("override-perm-selector") as HTMLSelectElement)?.value;
                              if (perm) handleDirectOverride(perm, "ALLOW");
                            }}
                            className="flex-1 bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/25 py-2.5 text-xs font-semibold rounded-lg uppercase tracking-wider"
                          >
                            Grant Allow
                          </button>
                          <button 
                            onClick={() => {
                              const perm = (document.getElementById("override-perm-selector") as HTMLSelectElement)?.value;
                              if (perm) handleDirectOverride(perm, "DENY");
                            }}
                            className="flex-1 bg-rose-600/15 text-rose-400 border border-rose-500/20 hover:bg-rose-600/25 py-2.5 text-xs font-semibold rounded-lg uppercase tracking-wider"
                          >
                            Grant Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[74vh] flex flex-col items-center justify-center text-slate-500 bg-slate-900/10 rounded-xl border border-dashed border-slate-800">
                  <Users className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-medium text-slate-400 text-xs uppercase tracking-wider">No User Selected</p>
                  <p className="text-slate-500 text-[11px] mt-1">Select an account from the directory tree to inspect and configure user overrides</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "AUDIT" && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden h-[74vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-wider">Platform Security Audit Log</h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded border border-indigo-500/20">
                Authorized Audits
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-2 font-mono text-[11px] text-slate-300">
              {logs.map((log: any) => (
                <div key={log.id} className="p-3 bg-slate-950/50 border border-slate-900 rounded-lg flex items-start gap-4 hover:border-slate-850/60 transition-colors">
                  <span className="text-indigo-400 font-semibold uppercase tracking-wider">[{log.action}]</span>
                  <div className="flex-1">
                    <p className="text-slate-200">{log.details ? JSON.stringify(JSON.parse(log.details)) : "No details"}</p>
                    <p className="text-slate-500 text-[10px] mt-1">Actor ID: {log.actorId} &bull; Target: {log.targetType}/{log.targetId}</p>
                  </div>
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No security audits logged.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Role Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Build Custom IAM Role
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Role Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Lead Project Manager"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Role Code (Unique)</label>
                <input 
                  type="text"
                  placeholder="e.g. lead_pm"
                  value={newRole.code}
                  onChange={(e) => setNewRole({ ...newRole, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Role Description</label>
              <textarea 
                rows={3}
                placeholder="Briefly summarize permission levels for this role..."
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Badge Hex Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color"
                    value={newRole.color}
                    onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={newRole.color}
                    onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Clone permissions from existing</label>
                <select 
                  onChange={(e) => {
                    const clonedCode = e.target.value;
                    const match = roles.find((r: any) => r.code === clonedCode);
                    if (match) {
                      // Note: matrix details would need a fetch or local lookup
                      const clonedPerms = permissionMatrix?.matrix[clonedCode] || [];
                      setNewRole({ ...newRole, permissionNames: clonedPerms });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none"
                >
                  <option value="">-- Don't Clone (Start Fresh) --</option>
                  {roles.map((r: any) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 font-mono uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onCreateRole(newRole);
                  setShowCreateModal(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold"
              >
                Create Role Container
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SubTabButton = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all relative ${
      active ? "text-indigo-400 font-bold" : "text-slate-500 hover:text-slate-300"
    }`}
  >
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
    )}
  </button>
);

/* ==========================================
   DASHBOARD & WIDGET MANAGEMENT
   ========================================== */
const DashboardManagement = ({ widgets, templates, roles, refresh }: any) => {
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  
  // Custom states
  const [newTemplate, setNewTemplate] = useState({
    name: "New View Template",
    description: "Standard executive gateway analytics",
    roleId: "",
    department: "",
    businessUnit: "",
    isDefault: false,
    layout: [] as any[]
  });

  const [newWidget, setNewWidget] = useState({
    name: "",
    code: "",
    moduleId: "",
    componentType: "KPI",
    apiEndpoint: "/api/v1/metrics",
    refreshInterval: 300,
    permissionRequired: "projects.view"
  });

  const handleCreateTemplate = async () => {
    try {
      await api.createDashboardTemplate(newTemplate);
      alert("Template deployed successfully");
      setShowTemplateEditor(false);
      refresh();
    } catch (err: any) {
      alert("Failed to deploy template: " + err.message);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await api.delete(`/v1/dashboards/templates/${templateId}`);
      alert("Template deleted successfully");
      refresh();
    } catch (err: any) {
      alert("Failed to delete template: " + err.message);
    }
  };

  const handleCreateWidget = async () => {
    try {
      await api.createWidget(newWidget);
      alert("Custom Widget registered");
      setShowWidgetEditor(false);
      refresh();
    } catch (err: any) {
      alert("Failed to register widget: " + err.message);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!window.confirm("Are you sure you want to delete this widget definition?")) return;
    try {
      await api.delete(`/v1/dashboards/widgets/${widgetId}`);
      alert("Widget deleted");
      refresh();
    } catch (err: any) {
      alert("Failed to delete widget: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Layout className="text-indigo-400" />} label="Deployed Templates" value={templates?.length || 0} />
        <StatCard icon={<Box className="text-emerald-400" />} label="Registered Widgets" value={widgets?.length || 0} />
        <StatCard icon={<Users className="text-rose-400" />} label="Personalized Overrides" value="12" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Templates Panel */}
        <div className="xl:col-span-8 bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">Dashboard Templates Store</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Role based default views launched at login</p>
            </div>
            {!showTemplateEditor && (
              <button 
                onClick={() => setShowTemplateEditor(true)}
                className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase font-mono tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                Build Template
              </button>
            )}
          </div>

          <div className="p-6">
            {showTemplateEditor ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Template Name</label>
                      <input 
                        type="text" 
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="e.g. Executive Summary"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Role Container</label>
                      <select 
                        value={newTemplate.roleId}
                        onChange={(e) => setNewTemplate({ ...newTemplate, roleId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
                      >
                        <option value="">All Roles (Global Default)</option>
                        {roles.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Department</label>
                      <input 
                        type="text" 
                        value={newTemplate.department}
                        onChange={(e) => setNewTemplate({ ...newTemplate, department: e.target.value })}
                        placeholder="e.g. Operations"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Description Summary</label>
                      <input 
                        type="text" 
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid layouts configuration */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-mono text-slate-500 uppercase">Map grid layouts</label>
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Select widgets to add</p>
                      <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                        {widgets.map((w: any) => {
                          const isAdded = newTemplate.layout.some(l => l.widgetId === w.id);
                          return (
                            <div key={w.id} className="flex items-center justify-between p-2 rounded bg-slate-900 text-xs border border-slate-800">
                              <div>
                                <p className="font-semibold text-slate-300">{w.name}</p>
                                <p className="text-[9px] text-slate-500 font-mono">{w.code}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  if (isAdded) {
                                    setNewTemplate({ ...newTemplate, layout: newTemplate.layout.filter(l => l.widgetId !== w.id) });
                                  } else {
                                    setNewTemplate({ 
                                      ...newTemplate, 
                                      layout: [...newTemplate.layout, { widgetId: w.id, gridPosX: 0, gridPosY: 0, gridWidth: 6, gridHeight: 4, isPinned: false, isCollapsed: false }] 
                                    });
                                  }
                                }}
                                className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded font-bold ${
                                  isAdded ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-850 text-slate-300 border border-slate-750"
                                }`}
                              >
                                {isAdded ? "Added" : "Add"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Position & dimensions builder</p>
                      <div className="space-y-2 max-h-40 overflow-auto pr-1">
                        {newTemplate.layout.map((item: any, idx: number) => {
                          const wDetail = widgets.find(w => w.id === item.widgetId);
                          return (
                            <div key={item.widgetId} className="p-2.5 bg-slate-900 rounded border border-indigo-500/10 text-[10px] space-y-2">
                              <p className="font-semibold text-slate-200">{wDetail?.name || "Widget"}</p>
                              <div className="grid grid-cols-4 gap-1.5 font-mono">
                                <div>
                                  <span className="text-slate-500 block">X pos</span>
                                  <input 
                                    type="number" 
                                    value={item.gridPosX}
                                    onChange={(e) => {
                                      const updated = [...newTemplate.layout];
                                      updated[idx].gridPosX = Number(e.target.value);
                                      setNewTemplate({ ...newTemplate, layout: updated });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center"
                                  />
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Y pos</span>
                                  <input 
                                    type="number" 
                                    value={item.gridPosY}
                                    onChange={(e) => {
                                      const updated = [...newTemplate.layout];
                                      updated[idx].gridPosY = Number(e.target.value);
                                      setNewTemplate({ ...newTemplate, layout: updated });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center"
                                  />
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Width</span>
                                  <input 
                                    type="number" 
                                    value={item.gridWidth}
                                    onChange={(e) => {
                                      const updated = [...newTemplate.layout];
                                      updated[idx].gridWidth = Number(e.target.value);
                                      setNewTemplate({ ...newTemplate, layout: updated });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center"
                                  />
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Height</span>
                                  <input 
                                    type="number" 
                                    value={item.gridHeight}
                                    onChange={(e) => {
                                      const updated = [...newTemplate.layout];
                                      updated[idx].gridHeight = Number(e.target.value);
                                      setNewTemplate({ ...newTemplate, layout: updated });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {newTemplate.layout.length === 0 && (
                          <p className="text-slate-500 italic text-[11px] text-center pt-6">Select widgets from the left column to construct layout grid mapping</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <button 
                    onClick={() => setShowTemplateEditor(false)}
                    className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateTemplate}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold shadow-lg shadow-indigo-600/10"
                  >
                    Deploy Layout Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl: any) => (
                  <div key={tpl.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl relative group hover:border-slate-800 transition-all">
                    <button 
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="absolute top-3 right-3 p-1.5 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                      <Layout className="w-4 h-4 text-indigo-400" />
                      <h4 className="font-bold text-slate-200 text-xs">{tpl.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">{tpl.description || "Default layout template container."}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-900">
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">
                        Role Code: {tpl.roleId ? roles.find((r: any) => r.id === tpl.roleId)?.code || tpl.roleId : "GLOBAL_DEFAULT"}
                      </span>
                      {tpl.department && (
                        <span className="text-[9px] bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono uppercase">
                          Dept: {tpl.department}
                        </span>
                      )}
                      <span className="text-[9px] bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                        {tpl.widgets?.length || 0} Widgets
                      </span>
                    </div>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="col-span-2 text-center p-8 text-slate-500 border border-dashed border-slate-850 rounded-xl">
                    No layout templates found in database. Click build template to start!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Widgets Panel */}
        <div className="xl:col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[65vh]">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">Widget Registry</h3>
            {!showWidgetEditor && (
              <button 
                onClick={() => setShowWidgetEditor(true)}
                className="text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-wider hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20"
              >
                New Widget
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {showWidgetEditor ? (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Widget Name</label>
                  <input 
                    type="text" 
                    value={newWidget.name}
                    onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })}
                    placeholder="e.g. Schedule Overrun Gauge"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Unique Code</label>
                    <input 
                      type="text" 
                      value={newWidget.code}
                      onChange={(e) => setNewWidget({ ...newWidget, code: e.target.value })}
                      placeholder="e.g. widget.schedule_gauge"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Component Type</label>
                    <select 
                      value={newWidget.componentType}
                      onChange={(e) => setNewWidget({ ...newWidget, componentType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="KPI">KPI Metric Badge</option>
                      <option value="LINE">Line Trend Graph</option>
                      <option value="BAR">Bar Comparison Chart</option>
                      <option value="DONUT">Pie Donut Allocation</option>
                      <option value="LOGS">Activity Records Grid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">REST API Source Endpoint</label>
                  <input 
                    type="text" 
                    value={newWidget.apiEndpoint}
                    onChange={(e) => setNewWidget({ ...newWidget, apiEndpoint: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Interval (Secs)</label>
                    <input 
                      type="number" 
                      value={newWidget.refreshInterval}
                      onChange={(e) => setNewWidget({ ...newWidget, refreshInterval: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Permission Required</label>
                    <input 
                      type="text" 
                      value={newWidget.permissionRequired}
                      onChange={(e) => setNewWidget({ ...newWidget, permissionRequired: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowWidgetEditor(false)}
                    className="flex-1 px-3 py-1.5 text-[10px] font-mono uppercase bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded text-slate-400"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateWidget}
                    className="flex-1 px-3 py-1.5 text-[10px] font-mono uppercase bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold"
                  >
                    Save Widget
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {widgets.map((w: any) => (
                  <div key={w.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl relative group">
                    <button 
                      onClick={() => handleDeleteWidget(w.id)}
                      className="absolute top-2.5 right-2.5 p-1 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded transition-all opacity-0 group-hover:opacity-100"
                      title="Deregister widget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] font-mono">
                        {w.componentType.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{w.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{w.code}</p>
                        <p className="text-[8.5px] text-indigo-400/80 font-mono mt-1">Refreshes every {w.refreshInterval}s &bull; API: {w.apiEndpoint}</p>
                      </div>
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
};

/* ==========================================
   ORGANIZATIONAL POLICY ENGINE
   ========================================== */
const PolicyManagement = ({ policies, refresh }: any) => {
  const [showEditor, setShowEditor] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    id: "",
    name: "",
    code: "",
    type: "ORGANIZATION",
    level: "ORGANIZATION",
    targetId: "",
    valueJson: "{\n  \"timeoutMinutes\": 60,\n  \"enforcedMfa\": true\n}",
    isActive: true
  });

  const handleSavePolicy = async () => {
    try {
      // Validate JSON
      try {
        JSON.parse(policyForm.valueJson);
      } catch (err) {
        alert("Invalid JSON value configured. Please check formatting.");
        return;
      }

      await api.post("/v1/auth/policies", policyForm);
      alert("Organizational Policy deployed");
      setShowEditor(false);
      refresh();
    } catch (err: any) {
      alert("Failed to save policy: " + err.message);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this organizational security policy?")) return;
    try {
      await api.delete(`/v1/auth/policies/${id}`);
      alert("Policy removed");
      refresh();
    } catch (err: any) {
      alert("Failed to delete policy: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-slate-300">Enterprise Policy Orchestrator</h3>
          <p className="text-xs text-slate-500 mt-0.5">Enforce system parameters globally, by departments, or operational levels</p>
        </div>
        {!showEditor && (
          <button 
            onClick={() => {
              setPolicyForm({ id: "", name: "", code: "", type: "ORGANIZATION", level: "ORGANIZATION", targetId: "", valueJson: "{}", isActive: true });
              setShowEditor(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            Establish Policy
          </button>
        )}
      </div>

      {showEditor ? (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 space-y-6 animate-in fade-in">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Policy Title</label>
                <input 
                  type="text" 
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  placeholder="e.g. Finance Vault High Compliance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Scope Target Level</label>
                <select 
                  value={policyForm.level}
                  onChange={(e) => setPolicyForm({ ...policyForm, level: e.target.value, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="ORGANIZATION">Organization Wide</option>
                  <option value="DEPARTMENT">Departmental Boundary</option>
                  <option value="BUSINESS_UNIT">Business Unit Boundary</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Unique Policy Code</label>
                <input 
                  type="text" 
                  value={policyForm.code}
                  placeholder="e.g. policy.finance_compliance"
                  onChange={(e) => setPolicyForm({ ...policyForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Target Boundary Value ID</label>
                <input 
                  type="text" 
                  value={policyForm.targetId}
                  onChange={(e) => setPolicyForm({ ...policyForm, targetId: e.target.value })}
                  placeholder="e.g. Operations (Leave empty for Organization level)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">Policy Parameters Config (JSON)</label>
            <textarea 
              rows={6}
              value={policyForm.valueJson}
              onChange={(e) => setPolicyForm({ ...policyForm, valueJson: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={!!policyForm.isActive}
                onChange={(e) => setPolicyForm({ ...policyForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-indigo-600"
              />
              <span className="text-xs text-slate-400 font-mono uppercase">Activate policy on deploy</span>
            </label>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-xs font-mono uppercase text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleSavePolicy}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold shadow-lg shadow-indigo-600/10"
              >
                Deploy Security Policy
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {policies.map((pol: any) => (
            <div key={pol.id} className="bg-slate-900/30 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all relative group">
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setPolicyForm({
                      id: pol.id,
                      name: pol.name,
                      code: pol.code,
                      type: pol.type,
                      level: pol.level,
                      targetId: pol.targetId || "",
                      valueJson: pol.valueJson,
                      isActive: pol.isActive
                    });
                    setShowEditor(true);
                  }}
                  className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded border border-transparent hover:border-slate-800"
                  title="Modify parameters"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDeletePolicy(pol.id)}
                  className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded border border-transparent hover:border-rose-500/20"
                  title="Abolish policy"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${pol.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}></div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{pol.level} SCOPE</span>
                </div>
                <h4 className="font-bold text-slate-200 text-xs">{pol.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">{pol.code}</p>
                {pol.targetId && (
                  <p className="text-[10px] bg-slate-950 border border-slate-900/80 text-slate-400 font-mono px-2 py-0.5 rounded mt-2 inline-block">Boundary target: {pol.targetId}</p>
                )}
                
                <div className="mt-4 p-3 bg-slate-950/80 border border-slate-900 rounded-lg">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Configuration parameters</span>
                  <pre className="text-[10px] font-mono text-indigo-300 max-h-24 overflow-auto">{JSON.stringify(JSON.parse(pol.valueJson), null, 2)}</pre>
                </div>
              </div>
            </div>
          ))}
          {policies.length === 0 && (
            <div className="col-span-3 text-center p-8 text-slate-500 border border-dashed border-slate-850 rounded-xl">
              No organizational policies deployed. Click Establish Policy to seed secure limits!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ==========================================
   ENTERPRISE MODULE CONTROL
   ========================================== */
const ModuleManagement = ({ modulesList, refresh }: any) => {

  const handleToggleModule = async (moduleId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/v1/auth/modules/${moduleId}`, { status: nextStatus });
      refresh();
    } catch (err: any) {
      alert("Failed to toggle module status: " + err.message);
    }
  };

  const handleToggleFeature = async (featureId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/v1/auth/features/${featureId}`, { status: nextStatus });
      refresh();
    } catch (err: any) {
      alert("Failed to toggle feature flag: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-slate-300">Enterprise Module Control</h3>
        <p className="text-xs text-slate-500 mt-0.5">Toggle fine-grained module access layers and features globally in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modulesList.map((m: any) => (
          <div key={m.id} className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col bg-gradient-to-b from-slate-900/30 to-slate-950/10">
            {/* Module title card */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-xs">{m.name}</h4>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-slate-500">
                    <span className="uppercase tracking-wider">VERSION: {m.version}</span>
                    <span>&bull;</span>
                    <span className="uppercase tracking-wider">SCOPED: {m.visibility}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleToggleModule(m.id, m.status)}
                className="transition-transform duration-200 hover:scale-105"
              >
                {m.status === "ACTIVE" ? (
                  <ToggleRight className="w-9 h-9 text-indigo-500 cursor-pointer" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-600 cursor-pointer" />
                )}
              </button>
            </div>

            {/* Nested fine-grained feature flags */}
            <div className="p-5 bg-slate-950/40 flex-1 space-y-3.5">
              <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 mb-1">Fine-Grained Feature Flags</span>
              {m.features && m.features.length > 0 ? (
                m.features.map((feat: any) => (
                  <div key={feat.id} className="flex items-center justify-between text-xs p-2.5 rounded bg-slate-950/50 border border-slate-900">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-300 text-xs">{feat.name}</p>
                        <span className="text-[9px] text-slate-500 font-mono">({feat.code})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{feat.description}</p>
                    </div>
                    <button 
                      onClick={() => handleToggleFeature(feat.id, feat.status)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {feat.status === "ACTIVE" ? (
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded">ENABLED</span>
                      ) : (
                        <span className="text-[9px] bg-slate-800 border border-slate-750 text-slate-500 font-mono font-bold px-2 py-0.5 rounded">DISABLED</span>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-[10px] italic">No fine-grained gateways registered in this segment.</p>
              )}
            </div>
          </div>
        ))}
        {modulesList.length === 0 && (
          <div className="col-span-2 text-center p-8 text-slate-500 border border-dashed border-slate-850 rounded-xl">
            No enterprise modules registered in context.
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
  <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-850">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">{label}</p>
      <p className="text-xl font-bold text-slate-100 mt-1 font-mono">{value}</p>
    </div>
  </div>
);
