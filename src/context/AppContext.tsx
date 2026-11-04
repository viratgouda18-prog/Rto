import React, { createContext, useContext, useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';
import { Language, translations } from '../utils/i18n.ts';

export type ActiveTab =
  | 'dashboard'
  | 'clients'
  | 'showrooms'
  | 'vehicles'
  | 'tractors'
  | 'exchangeCases'
  | 'rtoCases'
  | 'documents'
  | 'ocrScanner'
  | 'reminders'
  | 'auditLogs'
  | 'admin';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['en'];
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  confirm: (options: ConfirmOptions) => void;
  selectedEntityForView: { type: string; id: number | string } | null;
  setSelectedEntityForView: (entity: { type: string; id: number | string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedEntityForView, setSelectedEntityForView] = useState<{ type: string; id: number | string } | null>(null);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const confirm = (options: ConfirmOptions) => {
    setConfirmState(options);
  };

  const handleExecuteConfirm = async () => {
    if (!confirmState) return;
    setConfirmLoading(true);
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const t = translations[lang];

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        isDark,
        setIsDark,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        toasts,
        showToast,
        removeToast,
        confirm,
        selectedEntityForView,
        setSelectedEntityForView,
      }}
    >
      {children}

      {/* Sleek in-app modal for reliable delete and destructive confirmations without browser iframe blocking */}
      {confirmState && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    confirmState.variant === 'warning'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : confirmState.variant === 'info'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                  }`}
                >
                  {confirmState.variant === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Trash2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {confirmState.title || 'Confirm Deletion'}
                  </h3>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Karnataka RTO Portal
                  </span>
                </div>
              </div>
              <button
                onClick={() => !confirmLoading && setConfirmState(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled={confirmLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmState.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                disabled={confirmLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={confirmLoading}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 transition-colors shadow-xs ${
                  confirmState.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : confirmState.variant === 'info'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirmLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{confirmState.confirmText || 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
