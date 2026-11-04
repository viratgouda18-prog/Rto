import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ShieldCheck,
  History,
  Download,
  Users,
  Store,
  RefreshCw,
  Database,
  Lock,
  FileText,
  Search,
  LogIn,
  Upload,
  ArrowRightLeft,
  Trash2,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle,
  UserCheck,
  Key,
  Calendar,
} from 'lucide-react';
import { RTO_SERVICES } from '../utils/checklists.ts';
import { fetchJson } from '../utils/apiClient.ts';
import { exportAuditLogsAsCsv } from '../utils/zipDownloader.ts';

interface StaffPersona {
  name: string;
  role: string;
  id: string;
}

const STAFF_PROFILES: StaffPersona[] = [
  { name: 'Ramesh Gowda', role: 'Senior RTO Officer', id: 'AGENT-KA-01' },
  { name: 'Priya Sharma', role: 'Document Verification Specialist', id: 'AGENT-KA-02' },
  { name: 'Kavitha M.', role: 'Showroom & Exchange Desk Coordinator', id: 'AGENT-KA-03' },
  { name: 'Suresh Patil', role: 'Tractor & Agricultural Paperwork Officer', id: 'AGENT-KA-04' },
];

export const AdminAuditView: React.FC = () => {
  const { t, showToast } = useApp();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'audit' | 'backup' | 'services' | 'security'>('audit');

  // Active Session State
  const [currentStaff, setCurrentStaff] = useState<StaffPersona>(STAFF_PROFILES[0]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('RTO Agent');
  const [loggingIn, setLoggingIn] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsData = await fetchJson<any[]>('/api/audit-logs?limit=250', { fallback: [] });
      setLogs(logsData || []);
    } catch (err: any) {
      console.warn('fetchLogs error:', err);
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSimulateLogin = async (staff: StaffPersona) => {
    setLoggingIn(true);
    try {
      await fetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: staff.name,
          role: staff.role,
          username: staff.id,
        }),
      });

      setCurrentStaff(staff);
      setShowLoginModal(false);
      showToast(`Logged in as ${staff.name} (${staff.role}). Audit log recorded!`, 'success');
      fetchLogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to process login', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      showToast('Please enter agent name', 'error');
      return;
    }
    const customStaff: StaffPersona = {
      name: customName.trim(),
      role: customRole.trim(),
      id: `AGENT-${Math.floor(100 + Math.random() * 900)}`,
    };
    handleSimulateLogin(customStaff);
  };

  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const data = await fetchJson<any>('/api/backup');

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Karnataka_RTO_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showToast('Database backup successfully generated and downloaded', 'success');
      fetchLogs();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setExportingBackup(false);
    }
  };

  const handleExportCsv = () => {
    try {
      exportAuditLogsAsCsv(filteredLogs, 'Karnataka_RTO_Audit_Trail');
      showToast(`Exported ${filteredLogs.length} audit records to CSV`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Karnataka_RTO_Audit_Trail_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${filteredLogs.length} audit records to JSON`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Counts by action category
  const counts = {
    all: logs.length,
    login: logs.filter((l) => l.action === 'login').length,
    upload: logs.filter((l) => l.action === 'upload').length,
    status_change: logs.filter((l) => l.action === 'status_change').length,
    download: logs.filter((l) => l.action === 'download').length,
    create: logs.filter((l) => l.action === 'create').length,
    delete: logs.filter((l) => l.action === 'delete').length,
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch =
      !logSearch ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.entityId.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.entityType.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.userId && log.userId.toLowerCase().includes(logSearch.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return {
          icon: <Key className="w-3.5 h-3.5" />,
          label: 'User Login',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'upload':
        return {
          icon: <Upload className="w-3.5 h-3.5" />,
          label: 'Doc Upload',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'status_change':
        return {
          icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
          label: 'Status Change',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'download':
        return {
          icon: <Download className="w-3.5 h-3.5" />,
          label: 'ZIP Download',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        };
      case 'create':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5" />,
          label: 'Record Create',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
      case 'delete':
        return {
          icon: <Trash2 className="w-3.5 h-3.5" />,
          label: 'Doc Delete',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5" />,
          label: action,
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            {t.nav.admin} & System Integrity
          </h2>
          <p className="text-xs text-slate-500">
            Immutable audit trail for user logins, document uploads, case status modifications, and regulatory compliance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLoginModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Simulate Login / Switch User
          </button>
          <button
            onClick={handleExportBackup}
            disabled={exportingBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            {exportingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {t.common.exportBackup}
          </button>
        </div>
      </div>

      {/* Active Session Card */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Active Session: {currentStaff.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                {currentStaff.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Staff ID: <span className="font-mono font-semibold">{currentStaff.id}</span> • Station: Karnataka RTO Portal • IP: 127.0.0.1
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Audit Stream Active
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'audit'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'backup'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          Database Backup & Recovery
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'services'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Configured RTO Services ({RTO_SERVICES.length})
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Privacy Compliance
        </button>
      </div>

      {/* Tab: Audit Trail Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              All Actions ({counts.all})
            </button>
            <button
              onClick={() => setActionFilter('login')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
              }`}
            >
              <Key className="w-3 h-3" />
              Logins ({counts.login})
            </button>
            <button
              onClick={() => setActionFilter('upload')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'upload'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Upload className="w-3 h-3" />
              Uploads ({counts.upload})
            </button>
            <button
              onClick={() => setActionFilter('status_change')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'status_change'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              Status Changes ({counts.status_change})
            </button>
            <button
              onClick={() => setActionFilter('download')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'download'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Download className="w-3 h-3" />
              Downloads ({counts.download})
            </button>
            <button
              onClick={() => setActionFilter('create')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'create'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              <PlusCircle className="w-3 h-3" />
              Created ({counts.create})
            </button>
            <button
              onClick={() => setActionFilter('delete')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                actionFilter === 'delete'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              Deletions ({counts.delete})
            </button>
          </div>

          {/* Search & Export Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by action, actor, entity ID, or details..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100"
                title="Export as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV
              </button>

              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                title="Export as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>

              <button
                onClick={fetchLogs}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                title="Refresh audit stream"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audit Logs List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-12 flex justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border shrink-0 ${badge.color}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>

                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                              {log.entityType}:{log.entityId}
                            </span>
                            <span>•</span>
                            <span>
                              Actor: <strong className="text-slate-700 dark:text-slate-300">{log.userId || 'system'}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-400">IP: {log.ipAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] font-mono text-slate-400 block">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'medium',
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Log ID #{log.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No audit log entries match the selected filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Backup & Recovery */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Full Database JSON Snapshot
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generates an authorized encrypted snapshot of all tables (Clients, Showrooms, Vehicles,
              Exchange Cases, RTO Cases, Checklists, Reminders, and Audit Logs) stored in PostgreSQL.
            </p>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  Ready for Production Backup
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Downloads full structured data archive for off-site backup or migration.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                disabled={exportingBackup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs shrink-0"
              >
                {exportingBackup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Configured Services */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RTO_SERVICES.map((s) => (
              <div
                key={s.type}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {s.label}
                  </h4>
                  <span className="text-[11px] font-kannada font-bold text-amber-600 dark:text-amber-400">
                    {s.labelKn}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{s.description}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Auto-generated Checklists ({s.checklist.length} items):
                  </p>
                  <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                    {s.checklist.slice(0, 4).map((item) => (
                      <li key={item.key}>{item.label}</li>
                    ))}
                    {s.checklist.length > 4 && (
                      <li className="text-slate-400">+ {s.checklist.length - 4} more documents</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Security & Compliance */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            Karnataka Transport Department Data Protection & UIDAI Privacy Measures
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white">
                UIDAI Aadhaar Masking Compliance
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Full 12-digit Aadhaar numbers are never stored in raw text. The application enforces
                standard masking (XXXX-XXXX-1234) before writing to PostgreSQL, satisfying Indian
                privacy regulations.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Zero Public URLs for Sensitive Paperwork
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Registration certificates, insurance contracts, and invoices are served strictly
                through authenticated server-side streams with session validation. No unauthenticated
                public bucket URLs are ever exposed.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Tamper-Resistant QR Code Tokens
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Vehicle and exchange QR codes embed opaque reference IDs. Scanning opens the
                application only for authorized agents and RTO staff, avoiding public leakage of
                driver identities.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Continuous Immutable Audit Trail
              </h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Every login, document upload, status mutation, download, and deletion records an
                immutable log with timestamp and IP address to guarantee regulatory accountability.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulate Login / Switch User Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                Staff Authentication & Audit Login
              </h3>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Select an authorized Karnataka RTO staff profile or enter credentials to record a real login audit log entry:
            </p>

            <div className="space-y-2 mb-4">
              {STAFF_PROFILES.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleSimulateLogin(staff)}
                  disabled={loggingIn}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-left text-xs transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{staff.name}</p>
                    <p className="text-[11px] text-slate-500">{staff.role}</p>
                  </div>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    {staff.id}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                Or Custom Staff Login:
              </p>
              <form onSubmit={handleCustomLogin} className="space-y-3">
                <input
                  type="text"
                  placeholder="Staff Full Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Designation / Role"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loggingIn ? 'Authenticating...' : 'Sign In & Record Audit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
