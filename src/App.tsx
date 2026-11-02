/**
 * Karnataka RTO Document Management System
 * Production-ready web platform for Karnataka RTO Agents
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ClientsView } from './components/ClientsView.tsx';
import { ShowroomsView } from './components/ShowroomsView.tsx';
import { VehiclesView } from './components/VehiclesView.tsx';
import { TractorsView } from './components/TractorsView.tsx';
import { ExchangeCasesView } from './components/ExchangeCasesView.tsx';
import { RTOCasesView } from './components/RTOCasesView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';
import { OCRScannerView } from './components/OCRScannerView.tsx';
import { RemindersView } from './components/RemindersView.tsx';
import { AdminAuditView } from './components/AdminAuditView.tsx';

function MainLayout() {
  const { activeTab, setActiveTab } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleQuickAction = (action: 'client' | 'vehicle' | 'case' | 'document') => {
    switch (action) {
      case 'client':
      case 'vehicle':
        setActiveTab('tractors');
        break;
      case 'case':
        setActiveTab('rtoCases');
        break;
      case 'document':
        setActiveTab('documents');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={handleQuickAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {(activeTab === 'tractors' || activeTab === 'vehicles' || activeTab === 'clients') && <TractorsView />}
          {activeTab === 'showrooms' && <ShowroomsView />}
          {activeTab === 'exchangeCases' && <ExchangeCasesView />}
          {activeTab === 'rtoCases' && <RTOCasesView />}
          {activeTab === 'documents' && <DocumentsView />}
          {activeTab === 'ocrScanner' && <OCRScannerView />}
          {activeTab === 'reminders' && <RemindersView />}
          {(activeTab === 'auditLogs' || activeTab === 'admin') && <AdminAuditView />}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Karnataka RTO Document & Paperwork Management System • Vahan Partner Agency</span>
          <span className="text-[11px] font-medium text-slate-400">
            Compliant with UIDAI Aadhaar Privacy & Transport Department Paperwork Rules
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
