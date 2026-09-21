import React from 'react';
import { useData } from '../context/DataContext';
import { Menu, Shield, User, Building2, Bell, CheckCircle2, Database } from 'lucide-react';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, title }) => {
  const { currentUser, companySettings, isFirestoreConnected } = useData();

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {companySettings.companyName} • Financial Control & Settlement
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Database status pill */}
        <div className="hidden lg:flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-medium">
          <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Firestore: {isFirestoreConnected ? 'Connected' : 'Connecting...'}</span>
        </div>

        {/* Settlement indicator badge */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Real-time 50/50 Settlement Active</span>
        </div>

        {/* Current user badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
