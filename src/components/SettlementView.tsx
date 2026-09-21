import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { 
  Scale, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  HelpCircle, 
  History, 
  Plus, 
  X,
  Sparkles,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettlementView: React.FC = () => {
  const { 
    currentUser, 
    companySettings, 
    expenses, 
    shareholders, 
    settlementCalc, 
    settlements, 
    recordSettlementPayment, 
    markSettlementAsPaid 
  } = useData();

  const sym = companySettings.currencySymbol;
  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SHAREHOLDER';

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    fromUserId: settlementCalc.debtorId || (shareholders[1]?.userId || ''),
    toUserId: settlementCalc.creditorId || (shareholders[0]?.userId || ''),
    amount: settlementCalc.settlementAmount ? settlementCalc.settlementAmount.toString() : '',
    settlementDate: new Date().toISOString().substring(0, 10),
    status: 'Paid' as any,
    notes: 'Direct 50/50 reconciliation bank transfer',
  });

  const handleMarkCurrentSettled = () => {
    if (!settlementCalc.hasSettlement || !settlementCalc.debtorId || !settlementCalc.creditorId) return;

    recordSettlementPayment({
      fromUserId: settlementCalc.debtorId,
      fromUserName: settlementCalc.debtorName || 'Debtor',
      toUserId: settlementCalc.creditorId,
      toUserName: settlementCalc.creditorName || 'Creditor',
      amount: settlementCalc.settlementAmount,
      settlementDate: new Date().toISOString().substring(0, 10),
      status: 'Paid',
      notes: `Reconciliation settled via Bank Transfer on ${new Date().toLocaleDateString()}`,
      paidAt: new Date().toISOString(),
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid settlement amount greater than 0.');
      return;
    }
    if (manualForm.fromUserId === manualForm.toUserId) {
      alert('Paid by and Paid to shareholders must be distinct.');
      return;
    }

    const fromSh = shareholders.find(s => s.userId === manualForm.fromUserId);
    const toSh = shareholders.find(s => s.userId === manualForm.toUserId);

    recordSettlementPayment({
      fromUserId: manualForm.fromUserId,
      fromUserName: fromSh?.name || 'Shareholder',
      toUserId: manualForm.toUserId,
      toUserName: toSh?.name || 'Shareholder',
      amount: amt,
      settlementDate: manualForm.settlementDate,
      status: manualForm.status,
      notes: manualForm.notes,
      paidAt: manualForm.status === 'Paid' ? new Date().toISOString() : undefined,
    });

    setIsManualModalOpen(false);
  };

  return (
    <div id="settlement-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              50/50 Shareholder Settlement Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              Auto-Reconciliation
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time equity balancing calculated exclusively from actual personal company expenses
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setManualForm({
                fromUserId: settlementCalc.debtorId || (shareholders[1]?.userId || ''),
                toUserId: settlementCalc.creditorId || (shareholders[0]?.userId || ''),
                amount: settlementCalc.settlementAmount ? settlementCalc.settlementAmount.toString() : '',
                settlementDate: new Date().toISOString().substring(0, 10),
                status: 'Paid',
                notes: 'Custom equity reimbursement',
              });
              setIsManualModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Record Manual Settlement Entry</span>
          </button>
        )}
      </div>

      {/* Main Settlement Highlight Hero Box */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Current Equity Reconciled Balance
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Total Qualifying Expenses: <strong className="text-white font-mono">{formatCurrency(settlementCalc.totalExpenses, sym)}</strong>
            </div>
          </div>

          {/* Central Who Owes Whom Banner */}
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-1">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                Reconciliation Directive
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                {settlementCalc.hasSettlement ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-rose-300 underline decoration-rose-500/50 underline-offset-4">
                      {settlementCalc.debtorName}
                    </span>
                    <span className="text-slate-400 font-normal text-base sm:text-xl">owes</span>
                    <span className="text-emerald-300 underline decoration-emerald-500/50 underline-offset-4">
                      {settlementCalc.creditorName}
                    </span>
                  </div>
                ) : (
                  <div className="text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    <span>Equal 50/50 Balance — No Settlement Owed</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                {settlementCalc.hasSettlement
                  ? `To restore perfect 50% ownership balance across ₹${settlementCalc.totalExpenses.toLocaleString()} of company costs, this single transfer of ${formatCurrency(settlementCalc.settlementAmount, sym)} is required.`
                  : 'Both 50% shareholders have paid an identical amount towards company expenditures.'}
              </p>
            </div>

            <div className="text-center md:text-right shrink-0 bg-white/10 px-6 py-4 rounded-xl border border-white/10 min-w-[200px]">
              <div className="text-xs font-medium text-slate-300">Net Settlement Due</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono mt-0.5">
                {formatCurrency(settlementCalc.settlementAmount, sym)}
              </div>
              <div className="mt-2 flex items-center justify-center md:justify-end gap-1.5 text-[11px] font-bold text-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>{settlementCalc.hasSettlement ? 'Pending Transfer' : 'Settled'}</span>
              </div>
            </div>
          </div>

          {/* Quick Mark-as-Paid Button */}
          {settlementCalc.hasSettlement && canManage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Marking as paid records a formal settlement transaction without modifying historical expenses.</span>
              </div>
              <button
                type="button"
                id="settlement-mark-paid-main-btn"
                onClick={handleMarkCurrentSettled}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Settlement as Paid ({formatCurrency(settlementCalc.settlementAmount, sym)})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mathematical Proof & Formula Breakdown (Specification Section 10 & 11) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mathematical Settlement Audit &amp; Shareholder Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Verified against Section 11 Settlement Formula: Actual Paid minus Fair Share (Total × 50%)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            50% / 50% Statutory Logic
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settlementCalc.shareholders.map((sh, idx) => (
            <div
              key={sh.userId}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Shareholder {idx + 1}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{sh.name}</h4>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {sh.percentage}% Ownership
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
                  <span>Actual Company Expenses Paid:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(sh.actualPaid, sym)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
                  <span>Target 50% Fair Share ({formatCurrency(settlementCalc.totalExpenses, sym)} × 50%):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {formatCurrency(sh.fairShare, sym)}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">Net Equity Balance:</span>
                  <span className={`font-mono font-bold ${
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

              <div className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                sh.balance > 0
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                  : sh.balance < 0
                  ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {sh.balance > 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Paid <strong>{formatCurrency(sh.balance, sym)}</strong> in excess of fair 50% share. This amount is legally due back to {sh.name}.
                    </span>
                  </>
                ) : sh.balance < 0 ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Underpaid fair 50% share by <strong>{formatCurrency(Math.abs(sh.balance), sym)}</strong>. This amount must be reimbursed to the co-shareholder.
                    </span>
                  </>
                ) : (
                  <span>Contributed precisely 50% of qualifying expenditures.</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Settlement Payment Ledger (Section 13 Specification) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Settlement Payment History &amp; Reconciled Transfers
            </h3>
          </div>
          <span className="text-xs text-slate-500">{settlements.length} settlement transaction(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Settlement Date</th>
                <th className="px-4 py-3">Paid By (Debtor)</th>
                <th className="px-4 py-3">Paid To (Creditor)</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes / Purpose</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No historical settlements logged yet.
                  </td>
                </tr>
              ) : (
                settlements.map(set => (
                  <tr key={set.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(set.settlementDate)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {set.fromUserName}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {set.toUserName}
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                      {formatCurrency(set.amount, sym)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        set.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                      }`}>
                        {set.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {set.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 truncate max-w-xs">
                      {set.notes || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {set.status === 'Pending' && canManage && (
                        <button
                          type="button"
                          onClick={() => markSettlementAsPaid(set.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Settlement Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Settlement Transfer
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Amount ({sym}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={manualForm.amount}
                  onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Paid By (Debtor) *
                </label>
                <select
                  value={manualForm.fromUserId}
                  onChange={e => setManualForm({ ...manualForm, fromUserId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  {shareholders.map(s => (
                    <option key={s.userId} value={s.userId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Paid To (Creditor) *
                </label>
                <select
                  value={manualForm.toUserId}
                  onChange={e => setManualForm({ ...manualForm, toUserId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  {shareholders.map(s => (
                    <option key={s.userId} value={s.userId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Settlement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.settlementDate}
                    onChange={e => setManualForm({ ...manualForm, settlementDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={e => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Settlement Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
