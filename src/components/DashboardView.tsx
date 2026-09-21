import React from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatters';
import { 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  Scale, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
}

const CATEGORY_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f97316', // orange
  '#64748b', // slate
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { 
    currentUser, 
    companySettings, 
    expenses, 
    revenues, 
    settlementCalc,
    settlements,
    shareholders,
    recordSettlementPayment
  } = useData();

  const sym = companySettings.currencySymbol;

  // Total calculations
  const totalRevenue = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const outstandingSettlement = settlementCalc.hasSettlement ? settlementCalc.settlementAmount : 0;

  // Monthly Chart Data (combine months)
  const monthMap: Record<string, { month: string; revenue: number; expenses: number }> = {};

  revenues.forEach(r => {
    const m = r.revenueDate ? r.revenueDate.substring(0, 7) : '2026-09';
    if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, expenses: 0 };
    monthMap[m].revenue += Number(r.amount) || 0;
  });

  expenses.forEach(e => {
    const m = e.expenseDate ? e.expenseDate.substring(0, 7) : '2026-09';
    if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, expenses: 0 };
    monthMap[m].expenses += Number(e.amount) || 0;
  });

  const chartData = Object.keys(monthMap)
    .sort()
    .map(key => ({
      name: key,
      Revenue: monthMap[key].revenue,
      Expenses: monthMap[key].expenses,
    }));

  // Ensure at least current month is shown if empty
  if (chartData.length === 0) {
    chartData.push({ name: '2026-09', Revenue: 0, Expenses: 0 });
  }

  // Category Breakdown Data
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    const cat = e.categoryName || 'Miscellaneous';
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(e.amount) || 0);
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Quick Action for Marking Current Settlement as Paid
  const handleQuickMarkSettlement = () => {
    if (!settlementCalc.hasSettlement || !settlementCalc.debtorId || !settlementCalc.creditorId) return;

    recordSettlementPayment({
      fromUserId: settlementCalc.debtorId,
      fromUserName: settlementCalc.debtorName || 'Debtor',
      toUserId: settlementCalc.creditorId,
      toUserName: settlementCalc.creditorName || 'Creditor',
      amount: settlementCalc.settlementAmount,
      settlementDate: new Date().toISOString().substring(0, 10),
      status: 'Paid',
      notes: `Reconciled from dashboard on ${new Date().toLocaleDateString()}`,
      paidAt: new Date().toISOString(),
    });
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Question UX Banner: "How much have we spent, how much revenue have we received, and who currently owes whom?" */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Executive Financial Overview &amp; 50/50 Position
            </div>
            <div className="text-xs text-slate-400">
              Corporate Ledger • Current FY 2026
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            Company Financial Health &amp; Shareholder Balance
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Instant answer to our company bottom-line: Total revenue received is{' '}
            <span className="font-bold text-emerald-400">{formatCurrency(totalRevenue, sym)}</span>,
            total qualifying company expenses paid is{' '}
            <span className="font-bold text-amber-400">{formatCurrency(totalExpenses, sym)}</span>,
            leaving a net profit of{' '}
            <span className="font-bold text-emerald-300">{formatCurrency(netProfit, sym)}</span>.
          </p>

          {/* Prominent Quick Settlement Statement */}
          <div className="mt-5 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${settlementCalc.hasSettlement ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'}`}>
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Current Shareholder 50/50 Settlement Status
                </div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {settlementCalc.hasSettlement ? (
                    <span className="text-amber-300">
                      {settlementCalc.debtorName} owes {settlementCalc.creditorName}{' '}
                      <span className="text-white bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-400/40">
                        {formatCurrency(settlementCalc.settlementAmount, sym)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      Shareholders are 100% Balanced (Equal 50/50 Contribution)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('settlement')}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 shrink-0"
            >
              <span>View Full Reconciliation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Level Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalRevenue, sym)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Customer invoices received</span>
            <button
              type="button"
              onClick={() => onNavigateTab('revenue')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalExpenses, sym)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{expenses.length} qualifying entries</span>
            <button
              type="button"
              onClick={() => onNavigateTab('expenses')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Operating Profit</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(netProfit, sym)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Revenue minus Expenses</span>
            <span className={`font-semibold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalRevenue > 0 ? `${Math.round((netProfit / totalRevenue) * 100)}% Margin` : '0% Margin'}
            </span>
          </div>
        </div>

        {/* Outstanding Settlement */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Settlement</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(outstandingSettlement, sym)}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {settlementCalc.hasSettlement ? 'Pending transfer' : 'All Settled'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('settlement')}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Settlement Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Shareholder Settlement Card (Section 14 Specification) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                SHAREHOLDER SETTLEMENT RECONCILIATION
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Equal 50% / 50% Equity
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Calculated exclusively on qualifying company expenses paid personally by shareholders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
              settlementCalc.hasSettlement
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
            }`}>
              {settlementCalc.hasSettlement ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Paid / Reconciled</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Shareholder Breakdown Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {settlementCalc.shareholders.map((sh, idx) => (
            <div
              key={sh.userId}
              className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Shareholder {idx + 1}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {sh.percentage}% Equity
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {sh.name}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Actual Expenses Paid:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sh.actualPaid, sym)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Fair 50% Share:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(sh.fairShare, sym)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Net Difference:</span>
                    <span className={`font-bold ${
                      sh.balance > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : sh.balance < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                    }`}>
                      {sh.balance > 0 ? `+${formatCurrency(sh.balance, sym)}` : formatCurrency(sh.balance, sym)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                {sh.balance > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Paid {formatCurrency(sh.balance, sym)} MORE than fair share
                  </span>
                ) : sh.balance < 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Paid {formatCurrency(Math.abs(sh.balance), sym)} LESS than fair share
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">Contributed exactly fair share</span>
                )}
              </div>
            </div>
          ))}

          {/* Result Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-indigo-950/40 border-2 border-indigo-500/30 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">
                Settlement Direction
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Expenses Paid:</div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(totalExpenses, sym)}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800/50">
                {settlementCalc.hasSettlement ? (
                  <>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reconciliation Result:</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                        {settlementCalc.debtorName}
                      </span>{' '}
                      owes{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {settlementCalc.creditorName}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {formatCurrency(settlementCalc.settlementAmount, sym)}
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 py-2">
                    ✓ Both shareholders have contributed equally. Zero outstanding settlement.
                  </div>
                )}
              </div>
            </div>

            {settlementCalc.hasSettlement && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SHAREHOLDER') && (
              <div className="mt-4 pt-3">
                <button
                  type="button"
                  id="dashboard-mark-paid-btn"
                  onClick={handleQuickMarkSettlement}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Paid &amp; Record Settlement</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Monthly Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue vs. Expenses</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly cash inflow vs company outflow</p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">
              Monthly
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={val => `${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0, sym)]}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category (Donut Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expenses by Category</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across qualifying business accounts</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('expenses')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All Expenses
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-56 w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value) || 0, sym)]}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-2">
              {categoryChartData.map((item, idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                const pct = totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white shrink-0 ml-2">
                      {formatCurrency(item.value, sym)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
