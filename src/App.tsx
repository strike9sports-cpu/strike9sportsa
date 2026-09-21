import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { ExpensesView } from './components/ExpensesView';
import { RevenueView } from './components/RevenueView';
import { SettlementView } from './components/SettlementView';
import { InvoicesView } from './components/InvoicesView';
import { ReportsView } from './components/ReportsView';
import { UsersManagementView } from './components/UsersManagementView';
import { CategoriesView } from './components/CategoriesView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { AuditLogView } from './components/AuditLogView';

const TAB_TITLES: Record<string, string> = {
  dashboard: 'Executive Dashboard & Overview',
  expenses: 'Company Expense Management',
  revenue: 'Customer Revenue & Inflow',
  settlement: '50/50 Shareholder Settlement Engine',
  invoices: 'Invoice Repository & Proofs',
  reports: 'Financial Reports & Exports',
  users: 'User Management & Role Permissions',
  categories: 'Expense Category Governance',
  settings: 'Company Profile & Shareholder Equity',
  audit: 'System Audit Logs',
};

const MainAppLayout: React.FC = () => {
  const { currentUser } = useData();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If not logged in, show login page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Fallback if tab is not permitted for user role
  const isEmployee = currentUser.role === 'EMPLOYEE';
  const isShareholder = currentUser.role === 'SHAREHOLDER';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Safeguard view based on role
  let currentTab = activeTab;
  if (isEmployee) {
    // Employee only has access to Dashboard, Revenue, and Reports (or restricted views)
    if (['expenses', 'settlement', 'invoices', 'users', 'categories', 'settings', 'audit'].includes(currentTab)) {
      currentTab = 'dashboard';
    }
  } else if (isShareholder) {
    // Shareholder has access to Dashboard, Expenses, Revenue (if permitted), Settlement, Invoices, Reports
    if (['users', 'categories', 'settings', 'audit'].includes(currentTab)) {
      currentTab = 'dashboard';
    }
  }

  const currentTitle = TAB_TITLES[currentTab] || 'Company Finance';

  return (
    <div id="app-root-layout" className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans antialiased">
      {/* Sidebar for Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Topbar 
          onOpenMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
          title={currentTitle}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {currentTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
          {currentTab === 'expenses' && <ExpensesView />}
          {currentTab === 'revenue' && <RevenueView />}
          {currentTab === 'settlement' && <SettlementView />}
          {currentTab === 'invoices' && <InvoicesView />}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'users' && <UsersManagementView />}
          {currentTab === 'categories' && <CategoriesView />}
          {currentTab === 'settings' && <CompanySettingsView />}
          {currentTab === 'audit' && <AuditLogView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <MainAppLayout />
    </DataProvider>
  );
}
