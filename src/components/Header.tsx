import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Menu,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  FileUp,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickAction: (action: 'client' | 'vehicle' | 'case' | 'document') => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenQuickAction }) => {
  const { searchQuery, setSearchQuery, t, toasts, removeToast } = useApp();

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile hamburger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Government of Karnataka • Transport Dept. Partner
              </span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                RTO Paperwork & Document Management
              </h2>
            </div>
          </div>

          {/* Global search */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => onOpenQuickAction('vehicle')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tractor</span>
              </button>
              <button
                onClick={() => onOpenQuickAction('case')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>RTO Case</span>
              </button>
              <button
                onClick={() => onOpenQuickAction('document')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload Doc</span>
              </button>
            </div>

            {/* Agent profile badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">
                  Karnataka Agent
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Authorised Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-xs sm:text-sm animate-in slide-in-from-right duration-200 ${
              toast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                : toast.type === 'info'
                ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-900 text-sky-800 dark:text-sky-200'
                : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
