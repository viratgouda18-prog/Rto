import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Users,
  Store,
  Car,
  Tractor,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  ArrowRight,
  RefreshCw,
  FolderLock,
  ArrowLeftRight,
} from 'lucide-react';
import { getExpiryStatus } from '../utils/validators.ts';

export const DashboardView: React.FC = () => {
  const { t, setActiveTab, setSelectedEntityForView } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to load dashboard statistics');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium">{t.common.loading}</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200">
        <p className="font-semibold mb-2">Error connecting to database</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: t.tractors?.allTractors || 'Tractors & Machinery',
      value: (stats.totalTractors || stats.totalVehicles || 0),
      icon: <Tractor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40',
      tab: 'tractors',
    },
    {
      label: t.dashboard.totalShowrooms,
      value: stats.totalShowrooms,
      icon: <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40',
      tab: 'showrooms',
    },
    {
      label: t.dashboard.activeCases,
      value: stats.activeCases,
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
      tab: 'rtoCases',
    },
    {
      label: t.dashboard.pendingCases,
      value: stats.pendingCases,
      icon: <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/40',
      tab: 'rtoCases',
    },
    {
      label: t.dashboard.completedCases,
      value: stats.completedCases,
      icon: <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-900/40',
      tab: 'rtoCases',
    },
    {
      label: t.dashboard.missingDocs,
      value: stats.missingDocs,
      icon: <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40',
      tab: 'rtoCases',
    },
    {
      label: t.dashboard.upcomingExpiries,
      value: stats.upcomingExpiries,
      icon: <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-900/40',
      tab: 'reminders',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-linear-to-r from-amber-600 to-amber-700 text-white shadow-sm">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-amber-200">
            Karnataka State Transport Department Agency Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-0.5">{t.dashboard.title}</h1>
          <p className="text-xs sm:text-sm text-amber-100/90 mt-1">{t.dashboard.subtitle}</p>
        </div>
        <button
          onClick={fetchStats}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-xs font-semibold text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(card.tab as any)}
            className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] hover:shadow-md ${card.bg}`}
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs">{card.icon}</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {card.value}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mt-3 truncate">
              {card.label}
            </p>
          </button>
        ))}
      </div>

      {/* Showroom-wise Document Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {t.dashboard.showroomOverview}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('showrooms')}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 inline-flex items-center gap-1"
          >
            Manage Showrooms <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.showroomOverview && stats.showroomOverview.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.showroomOverview.map((sr: any) => (
              <div
                key={sr.id}
                onClick={() => {
                  setSelectedEntityForView({ type: 'showroom', id: sr.id });
                  setActiveTab('showrooms');
                }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {sr.name}
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {sr.showroomId}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30">
                    <p className="font-bold text-blue-700 dark:text-blue-300">{sr.newVehicles}</p>
                    <p className="text-[10px] text-slate-500">New</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30">
                    <p className="font-bold text-amber-700 dark:text-amber-300">{sr.usedVehicles}</p>
                    <p className="text-[10px] text-slate-500">Used</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30">
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">
                      {sr.exchangeCases}
                    </p>
                    <p className="text-[10px] text-slate-500">Exchange</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No showrooms registered yet. Add a showroom to organize new, used, and exchange paperwork.
          </div>
        )}
      </div>

      {/* Middle Grid: Pending Work & Upcoming Expiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Work */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              {t.dashboard.pendingWork}
            </h3>
            <button
              onClick={() => setActiveTab('rtoCases')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.pendingWork && stats.pendingWork.length > 0 ? (
            <div className="space-y-2">
              {stats.pendingWork.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => setActiveTab('rtoCases')}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {c.caseId}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                        {c.serviceType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.clientName || 'Client'} • {c.vehicleReg || 'Unregistered'} • {c.rtoOffice}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                      Due: {c.dueDate || 'ASAP'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No pending RTO cases. Click "RTO Case" to register new paperwork.
            </div>
          )}
        </div>

        {/* Expiring Documents (Insurance / TR) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {t.dashboard.expiringDocs}
            </h3>
            <button
              onClick={() => setActiveTab('reminders')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1"
            >
              All Alerts <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.expiringVehicles && stats.expiringVehicles.length > 0 ? (
            <div className="space-y-2">
              {stats.expiringVehicles.map((v: any) => {
                const insExpiry = getExpiryStatus(v.insuranceExpiryDate);
                const trExpiry = getExpiryStatus(v.tempRegExpiryDate);
                return (
                  <div
                    key={v.id}
                    onClick={() => setActiveTab('vehicles')}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {v.regNumber || v.vehicleId}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {v.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Owner: {v.ownerName}</p>
                    </div>
                    <div className="text-right">
                      {v.insuranceExpiryDate && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            insExpiry.status === 'expired'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          Insurance: {insExpiry.label}
                        </span>
                      )}
                      {v.tempRegExpiryDate && (
                        <span className="text-[10px] block text-slate-500 mt-0.5">
                          TR: {trExpiry.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              All vehicle insurances and temporary registrations are up to date!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Documents & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-emerald-600" />
              {t.dashboard.recentDocuments}
            </h3>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
            >
              Open Cabinet <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recentDocuments && stats.recentDocuments.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentDocuments.map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => setActiveTab('documents')}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
                      {d.docType}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {d.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {d.fileName} • {(d.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No documents uploaded yet. Use "Upload Doc" or AI OCR Scanner to add files.
            </div>
          )}
        </div>

        {/* Recent Activity (Audit logs) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {t.dashboard.recentActivity}
            </h3>
            <button
              onClick={() => setActiveTab('auditLogs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {stats.recentActivity.map((log: any) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 text-[10px] mr-2">
                      [{log.action}]
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {log.details}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Audit log is clean. All actions are logged automatically for compliance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
