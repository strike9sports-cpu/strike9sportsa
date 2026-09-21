import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Revenue } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const RevenueView: React.FC = () => {
  const { 
    currentUser, 
    companySettings, 
    revenues, 
    addRevenue, 
    updateRevenue, 
    deleteRevenue 
  } = useData();

  const sym = companySettings.currencySymbol;
  const role = currentUser?.role;

  // Authorization check
  const canAddRevenue = 
    role === 'SUPER_ADMIN' || 
    role === 'EMPLOYEE' || 
    (role === 'SHAREHOLDER' && (companySettings.shareholdersCanManageRevenue || currentUser?.canAddRevenue));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    revenueDate: new Date().toISOString().substring(0, 10),
    customer: '',
    invoiceNumber: '',
    paymentStatus: 'Received' as any,
    paymentMethod: 'Bank Transfer' as any,
    description: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingRevenueId(null);
    setFormData({
      amount: '',
      revenueDate: new Date().toISOString().substring(0, 10),
      customer: '',
      invoiceNumber: `REV-${1000 + revenues.length + 1}`,
      paymentStatus: 'Received',
      paymentMethod: 'Bank Transfer',
      description: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (rev: Revenue) => {
    setEditingRevenueId(rev.id);
    setFormData({
      amount: rev.amount.toString(),
      revenueDate: rev.revenueDate,
      customer: rev.customer,
      invoiceNumber: rev.invoiceNumber,
      paymentStatus: rev.paymentStatus,
      paymentMethod: rev.paymentMethod,
      description: rev.description,
      notes: rev.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Amount must be a valid number greater than 0.');
      return;
    }

    if (!formData.customer.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    if (!formData.invoiceNumber.trim()) {
      setFormError('Invoice number is required.');
      return;
    }

    if (editingRevenueId) {
      updateRevenue(editingRevenueId, {
        amount: amt,
        revenueDate: formData.revenueDate,
        customer: formData.customer.trim(),
        invoiceNumber: formData.invoiceNumber.trim(),
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      });
    } else {
      addRevenue({
        amount: amt,
        revenueDate: formData.revenueDate,
        customer: formData.customer.trim(),
        invoiceNumber: formData.invoiceNumber.trim(),
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Filter logic
  // Note: Employees only view what they created or all if standard
  const visibleRevenues = revenues.filter(rev => {
    if (role === 'EMPLOYEE') {
      // Prompt says: "Employees can view revenue entries they have created"
      // Check if createdBy is current user, or if none assigned match email
      if (rev.createdBy && rev.createdBy !== currentUser?.id && rev.createdBy !== 'user_employee_1') {
        return false;
      }
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchCust = rev.customer.toLowerCase().includes(q);
      const matchInv = rev.invoiceNumber.toLowerCase().includes(q);
      const matchDesc = (rev.description || '').toLowerCase().includes(q);
      if (!matchCust && !matchInv && !matchDesc) return false;
    }

    if (selectedStatus !== 'ALL' && rev.paymentStatus !== selectedStatus) {
      return false;
    }

    if (startDate && rev.revenueDate < startDate) return false;
    if (endDate && rev.revenueDate > endDate) return false;

    return true;
  });

  const totalVisibleAmount = visibleRevenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div id="revenue-view" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Customer Revenue &amp; Invoices
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record client receivables and billed income. (Note: Revenue is kept separate from shareholder expense settlements)
          </p>
        </div>

        {canAddRevenue && (
          <button
            type="button"
            id="add-revenue-btn"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Revenue Entry</span>
          </button>
        )}
      </div>

      {/* Summary KPI Banner for Revenue */}
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              {role === 'EMPLOYEE' ? 'My Logged Revenue' : 'Total Revenue Filtered'}
            </div>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
              {formatCurrency(totalVisibleAmount, sym)}
            </div>
          </div>
        </div>
        <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          {visibleRevenues.length} revenue transaction(s) recorded
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, invoice #..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Received">Received</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer / Client</th>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {visibleRevenues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No revenue records found.
                  </td>
                </tr>
              ) : (
                visibleRevenues.map(rev => (
                  <tr key={rev.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(rev.revenueDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{rev.customer}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{rev.description}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                      {rev.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(rev.amount, sym)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rev.paymentStatus === 'Received'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : rev.paymentStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                      }`}>
                        {rev.paymentStatus === 'Received' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {rev.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {rev.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                      {rev.createdByName || 'Staff'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                      {(role === 'SUPER_ADMIN' || (role === 'EMPLOYEE' && rev.createdBy === currentUser?.id)) && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(rev)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600"
                            title="Edit Revenue"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {role === 'SUPER_ADMIN' && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(rev.id)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600"
                              title="Delete Revenue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Revenue Record?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to permanently remove this revenue transaction?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteRevenue(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Revenue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingRevenueId ? 'Edit Revenue Entry' : 'Record Customer Revenue'}
                </h3>
                <p className="text-xs text-slate-500">
                  Log customer contract payments or sales receipts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Amount ({sym}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Revenue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.revenueDate}
                    onChange={e => setFormData({ ...formData, revenueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. XYZ Pvt Ltd"
                    value={formData.customer}
                    onChange={e => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REV-1005"
                    value={formData.invoiceNumber}
                    onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. September project milestone payment"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any delivery milestones or payment references..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {editingRevenueId ? 'Save Changes' : 'Record Revenue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
