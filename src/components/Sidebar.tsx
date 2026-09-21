import React from 'react';
import { useData } from '../context/DataContext';
import { 
  Building2, 
  TrendingUp, 
  CreditCard, 
  FileSpreadsheet, 
  Scale, 
  PieChart, 
  Users, 
  Tags, 
  Sliders, 
  ScrollText, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  Shield,
  Briefcase,
  User
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { currentUser, logout, companySettings } = useData();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Filter navigation items by role
  // SUPER_ADMIN: everything
  // SHAREHOLDER: Dashboard, Expenses, Invoices, Settlement, Reports, (Revenue if permitted)
  // EMPLOYEE: strictly Revenue only + simple overview
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
      allowed: role === 'SUPER_ADMIN' || role === 'SHAREHOLDER',
    },
    {
      id: 'revenue',
      label: 'Revenue Management',
      icon: TrendingUp,
      allowed: role === 'SUPER_ADMIN' || role === 'EMPLOYEE' || (role === 'SHAREHOLDER' && companySettings.shareholdersCanManageRevenue),
    },
    {
      id: 'expenses',
      label: 'Expense Records',
      icon: CreditCard,
      allowed: role === 'SUPER_ADMIN' || role === 'SHAREHOLDER',
    },
    {
      id: 'invoices',
      label: 'Invoices & Attachments',
      icon: FileSpreadsheet,
      allowed: role === 'SUPER_ADMIN' || role === 'SHAREHOLDER',
    },
    {
      id: 'settlement',
      label: 'Shareholder Settlement',
      icon: Scale,
      allowed: role === 'SUPER_ADMIN' || role === 'SHAREHOLDER',
      highlight: true,
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: PieChart,
      allowed: role === 'SUPER_ADMIN' || role === 'SHAREHOLDER',
    },
  ];

  const adminItems = [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      allowed: role === 'SUPER_ADMIN',
    },
    {
      id: 'categories',
      label: 'Expense Categories',
      icon: Tags,
      allowed: role === 'SUPER_ADMIN',
    },
    {
      id: 'settings',
      label: 'Company Settings',
      icon: Sliders,
      allowed: role === 'SUPER_ADMIN',
    },
    {
      id: 'audit',
      label: 'Audit Trail Logs',
      icon: ScrollText,
      allowed: role === 'SUPER_ADMIN',
    },
  ];

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 overflow-hidden border border-indigo-400/20">
              {companySettings.logoUrl ? (
                <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                {companySettings.companyName}
              </h2>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <span>{companySettings.currency} ({companySettings.currencySymbol})</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">50/50 Equity</span>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-inner">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Core Financials
            </div>
            <nav className="space-y-1">
              {navItems
                .filter(item => item.allowed)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.highlight && !isActive && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          50/50
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Admin section */}
          {role === 'SUPER_ADMIN' && (
            <div>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-purple-400/80 flex items-center justify-between">
                <span>Super Admin Controls</span>
                <Shield className="w-3 h-3 text-purple-400" />
              </div>
              <nav className="space-y-1">
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-400/80'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            id="logout-button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 hover:border-red-500/20 border border-slate-700/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
