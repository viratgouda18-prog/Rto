import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext.tsx';
import {
  LayoutDashboard,
  Users,
  Store,
  Car,
  Tractor,
  ArrowLeftRight,
  ClipboardList,
  FolderLock,
  ScanText,
  BellRing,
  History,
  ShieldCheck,
  Languages,
  Sun,
  Moon,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, t, lang, setLang, isDark, setIsDark } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tractors', label: t.nav.tractors || 'Tractor & Machinery Records', icon: <Tractor className="w-5 h-5" /> },
    { id: 'showrooms', label: t.nav.showrooms, icon: <Store className="w-5 h-5" /> },
    { id: 'exchangeCases', label: t.nav.exchangeCases, icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'rtoCases', label: t.nav.rtoCases, icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'documents', label: t.nav.documents, icon: <FolderLock className="w-5 h-5" /> },
    { id: 'ocrScanner', label: t.nav.ocrScanner, icon: <ScanText className="w-5 h-5" />, badge: 'AI' },
    { id: 'reminders', label: t.nav.reminders, icon: <BellRing className="w-5 h-5" /> },
    { id: 'auditLogs', label: t.nav.auditLogs, icon: <History className="w-5 h-5" /> },
    { id: 'admin', label: t.nav.admin, icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg shadow-xs">
              KA
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                Karnataka RTO
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Document Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Emblem & Agent Status */}
        <div className="px-4 py-2.5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between text-xs">
          <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            KA Agent Portal
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
            Karnataka
          </span>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs dark:bg-amber-500'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom controls: Language & Theme */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* Language switch */}
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <Languages className="w-4 h-4" />
              Language
            </span>
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition-all ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('kn')}
                className={`px-2 py-1 rounded-md transition-all font-kannada ${
                  lang === 'kn'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>

          {/* Theme switch */}
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Appearance
            </span>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
