import React, { createContext, useContext, useState, useEffect } from 'react';
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
        selectedEntityForView,
        setSelectedEntityForView,
      }}
    >
      {children}
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
