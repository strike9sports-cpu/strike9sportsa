import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate, downloadCSV } from '../utils/formatters';
import { 
  PieChart, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  CreditCard, 
  Scale, 
  CheckCircle2, 
  Filter
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    companySettings, 
    expenses, 
    revenues, 
    shareholders, 
    settlementCalc 
  } = useData();

  const sym = companySettings.currencySymbol;
  const [reportType, setReportType] = useState<'OVERVIEW' | 'REVENUE' | 'EXPENSE' | 'SHAREHOLDER'>('OVERVIEW');

  // Aggregates
  const totalRevenue = revenues.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netPosition = totalRevenue - totalExpenses;

  // Monthly breakdown
  const monthlyRevenueMap: Record<string, number> = {};
  revenues.forEach(r => {
    const m = r.revenueDate ? r.revenueDate.substring(0, 7) : '2026-09';
    monthlyRevenueMap[m] = (monthlyRevenueMap[m] || 0) + (Number(r.amount) || 0);
  });

  const monthlyExpenseMap: Record<string, number> = {};
  expenses.forEach(e => {
    const m = e.expenseDate ? e.expenseDate.substring(0, 7) : '2026-09';
    monthlyExpenseMap[m] = (monthlyExpenseMap[m] || 0) + (Number(e.amount) || 0);
  });

  // Export CSV functions
  const handleExportCSV = () => {
    if (reportType === 'REVENUE') {
      const rows: (string | number)[][] = [
        ['Date', 'Customer', 'Invoice Number', `Amount (${sym})`, 'Status', 'Method', 'Created By'],
        ...revenues.map(r => [
          r.revenueDate,
          r.customer,
          r.invoiceNumber,
          r.amount,
          r.paymentStatus,
          r.paymentMethod,
          r.createdByName || 'Staff',
        ]),
      ];
      downloadCSV(`revenue_report_${new Date().toISOString().substring(0, 10)}.csv`, rows);
    } else if (reportType === 'EXPENSE') {
      const rows: (string | number)[][] = [
        ['Date', 'Category', 'Vendor', `Amount (${sym})`, 'Paid By', 'Invoice Number', 'Method', 'Notes'],
        ...expenses.map(e => [
          e.expenseDate,
          e.categoryName,
          e.vendor,
          e.amount,
          e.paidByName,
          e.invoiceNumber,
          e.paymentMethod,
          e.notes || '',
        ]),
      ];
      downloadCSV(`expense_report_${new Date().toISOString().substring(0, 10)}.csv`, rows);
    } else {
      // Shareholder settlement & overview
      const rows: (string | number)[][] = [
        ['Metric', 'Value'],
        ['Company Name', companySettings.companyName],
        ['Report Generated', new Date().toISOString()],
        ['Total Revenue', totalRevenue],
        ['Total Expenses', totalExpenses],
        ['Net Operating Profit', netPosition],
        ['Settlement Debtor', settlementCalc.debtorName || 'None'],
        ['Settlement Creditor', settlementCalc.creditorName || 'None'],
        ['Net Settlement Amount', settlementCalc.settlementAmount],
        ['', ''],
        ['Shareholder Name', 'Equity %', 'Actual Paid', 'Fair 50% Share', 'Net Balance'],
        ...settlementCalc.shareholders.map(sh => [
          sh.name,
          `${sh.percentage}%`,
          sh.actualPaid,
          sh.fairShare,
          sh.balance,
        ]),
      ];
      downloadCSV(`financial_settlement_report_${new Date().toISOString().substring(0, 10)}.csv`, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-view" className="space-y-6">
      {/* Header and Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Financial &amp; Shareholder Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export comprehensive revenue, expense logs, and 50/50 audit summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report / PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 print:hidden overflow-x-auto">
        <button
          type="button"
          onClick={() => setReportType('OVERVIEW')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
            reportType === 'OVERVIEW'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Comprehensive Audit Overview
        </button>
        <button
          type="button"
          onClick={() => setReportType('SHAREHOLDER')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
            reportType === 'SHAREHOLDER'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          50/50 Shareholder Reconciliation Report
        </button>
        <button
          type="button"
          onClick={() => setReportType('EXPENSE')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
            reportType === 'EXPENSE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Detailed Expenses Ledger
        </button>
        <button
          type="button"
          onClick={() => setReportType('REVENUE')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
            reportType === 'REVENUE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Revenue Inflow Report
        </button>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xs space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-6 gap-4">
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {companySettings.companyName}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {companySettings.address} • {companySettings.contactInformation}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
              Executive Financial Statement
            </span>
            <div className="text-xs text-slate-500 mt-0.5">
              Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Invoiced Revenue</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalRevenue, sym)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Operating Expenses</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalExpenses, sym)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Operating Position</div>
            <div className={`text-xl font-bold mt-1 ${netPosition >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
              {formatCurrency(netPosition, sym)}
            </div>
          </div>
        </div>

        {/* Shareholder Settlement Section in Report */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Shareholder 50/50 Expense Allocation &amp; Settlement Position
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {settlementCalc.hasSettlement ? `${settlementCalc.debtorName} owes ${settlementCalc.creditorName}` : 'Evenly Settled'}
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5">Shareholder</th>
                <th className="px-4 py-2.5">Equity Share</th>
                <th className="px-4 py-2.5">Actual Expenses Paid</th>
                <th className="px-4 py-2.5">Target Fair Share</th>
                <th className="px-4 py-2.5 text-right">Net Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {settlementCalc.shareholders.map(sh => (
                <tr key={sh.userId}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{sh.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{sh.percentage}%</td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                    {formatCurrency(sh.actualPaid, sym)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                    {formatCurrency(sh.fairShare, sym)}
                  </td>
                  <td className={`px-4 py-3 font-mono font-bold text-right ${sh.balance > 0 ? 'text-emerald-600' : sh.balance < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {sh.balance > 0 ? `+${formatCurrency(sh.balance, sym)}` : formatCurrency(sh.balance, sym)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-900/50 font-bold">
                <td className="px-4 py-3 text-slate-900 dark:text-white">Total Qualifying Expenses</td>
                <td className="px-4 py-3">100%</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(settlementCalc.totalExpenses, sym)}</td>
                <td className="px-4 py-3 font-mono">{formatCurrency(settlementCalc.totalExpenses, sym)}</td>
                <td className="px-4 py-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                  Net Transfer: {formatCurrency(settlementCalc.settlementAmount, sym)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expenses List Preview if selected */}
        {(reportType === 'EXPENSE' || reportType === 'OVERVIEW') && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-700">
              Detailed Expense Items ({expenses.length} Records)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Paid By</th>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {expenses.map(e => (
                    <tr key={e.id}>
                      <td className="px-3 py-2 text-slate-500">{formatDate(e.expenseDate)}</td>
                      <td className="px-3 py-2 font-medium">{e.categoryName}</td>
                      <td className="px-3 py-2">{e.vendor}</td>
                      <td className="px-3 py-2">{e.paidByName}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{e.invoiceNumber}</td>
                      <td className="px-3 py-2 text-right font-bold font-mono">{formatCurrency(e.amount, sym)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue List Preview if selected */}
        {(reportType === 'REVENUE' || reportType === 'OVERVIEW') && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-700">
              Customer Revenue Ledger ({revenues.length} Inflows)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {revenues.map(r => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-slate-500">{formatDate(r.revenueDate)}</td>
                      <td className="px-3 py-2 font-medium">{r.customer}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{r.invoiceNumber}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-medium">
                          {r.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.paymentMethod}</td>
                      <td className="px-3 py-2 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.amount, sym)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
