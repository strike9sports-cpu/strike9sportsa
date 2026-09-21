import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Expense, ExpenseAttachment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  FileText, 
  Upload, 
  Paperclip, 
  X, 
  Eye, 
  Download,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { 
    currentUser, 
    companySettings, 
    expenses, 
    categories, 
    shareholders, 
    addExpense, 
    updateExpense, 
    deleteExpense 
  } = useData();

  const sym = companySettings.currencySymbol;
  const canModify = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SHAREHOLDER';

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPaidBy, setSelectedPaidBy] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<ExpenseAttachment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    paidByUserId: '',
    expenseDate: new Date().toISOString().substring(0, 10),
    vendor: '',
    invoiceNumber: '',
    description: '',
    paymentMethod: 'Bank Transfer' as any,
    notes: '',
  });

  const [formAttachments, setFormAttachments] = useState<ExpenseAttachment[]>([]);
  const [formError, setFormError] = useState('');

  // Only active categories for new expenses
  const activeCategories = categories.filter(c => c.status === 'ACTIVE');
  const activeShareholders = shareholders.filter(s => s.status === 'ACTIVE');

  const openAddModal = () => {
    setEditingExpenseId(null);
    setFormData({
      amount: '',
      categoryId: activeCategories[0]?.id || '',
      paidByUserId: activeShareholders[0]?.userId || currentUser?.id || '',
      expenseDate: new Date().toISOString().substring(0, 10),
      vendor: '',
      invoiceNumber: '',
      description: '',
      paymentMethod: 'Bank Transfer',
      notes: '',
    });
    setFormAttachments([]);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    // If shareholder, check if they are allowed to edit (can edit own, or admin can edit all)
    if (currentUser?.role === 'SHAREHOLDER' && exp.paidByUserId !== currentUser.id && exp.createdBy !== currentUser.id) {
      alert('You can only edit expenses that you recorded or paid for.');
      return;
    }

    setEditingExpenseId(exp.id);
    setFormData({
      amount: exp.amount.toString(),
      categoryId: exp.categoryId,
      paidByUserId: exp.paidByUserId,
      expenseDate: exp.expenseDate,
      vendor: exp.vendor,
      invoiceNumber: exp.invoiceNumber,
      description: exp.description,
      paymentMethod: exp.paymentMethod,
      notes: exp.notes || '',
    });
    setFormAttachments(exp.attachments || []);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      // Validate format
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert(`File format "${file.type}" not supported. Use PDF, JPG, JPEG, or PNG.`);
        return;
      }

      // Max 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the 10MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        const newAttachment: ExpenseAttachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: dataUrl || '',
          uploadedBy: currentUser?.id || 'user',
          uploadedAt: new Date().toISOString(),
        };
        setFormAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (attId: string) => {
    setFormAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Amount must be a valid number greater than 0.');
      return;
    }

    if (!formData.categoryId) {
      setFormError('Please select an expense category.');
      return;
    }

    if (!formData.paidByUserId) {
      setFormError('Please select which shareholder paid this expense.');
      return;
    }

    if (!formData.vendor.trim()) {
      setFormError('Vendor / Supplier name is required.');
      return;
    }

    if (!formData.expenseDate) {
      setFormError('Please provide a valid expense date.');
      return;
    }

    const catObj = categories.find(c => c.id === formData.categoryId);
    const shObj = shareholders.find(s => s.userId === formData.paidByUserId);

    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        amount: amt,
        categoryId: formData.categoryId,
        categoryName: catObj?.name || 'Miscellaneous',
        paidByUserId: formData.paidByUserId,
        paidByName: shObj?.name || 'Shareholder',
        expenseDate: formData.expenseDate,
        vendor: formData.vendor.trim(),
        invoiceNumber: formData.invoiceNumber.trim() || 'N/A',
        description: formData.description.trim(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim(),
        attachments: formAttachments,
      });
    } else {
      addExpense({
        amount: amt,
        categoryId: formData.categoryId,
        categoryName: catObj?.name || 'Miscellaneous',
        paidByUserId: formData.paidByUserId,
        paidByName: shObj?.name || 'Shareholder',
        expenseDate: formData.expenseDate,
        vendor: formData.vendor.trim(),
        invoiceNumber: formData.invoiceNumber.trim() || 'N/A',
        description: formData.description.trim(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim(),
        attachments: formAttachments,
      });
    }

    setIsModalOpen(false);
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchVendor = exp.vendor.toLowerCase().includes(q);
      const matchInv = exp.invoiceNumber.toLowerCase().includes(q);
      const matchDesc = exp.description.toLowerCase().includes(q);
      const matchNotes = (exp.notes || '').toLowerCase().includes(q);
      if (!matchVendor && !matchInv && !matchDesc && !matchNotes) return false;
    }

    // Category
    if (selectedCategory !== 'ALL' && exp.categoryId !== selectedCategory) {
      return false;
    }

    // Paid By
    if (selectedPaidBy !== 'ALL' && exp.paidByUserId !== selectedPaidBy) {
      return false;
    }

    // Min Amount
    if (minAmount && exp.amount < parseFloat(minAmount)) {
      return false;
    }

    // Max Amount
    if (maxAmount && exp.amount > parseFloat(maxAmount)) {
      return false;
    }

    // Date range
    if (startDate && exp.expenseDate < startDate) {
      return false;
    }
    if (endDate && exp.expenseDate > endDate) {
      return false;
    }

    return true;
  });

  return (
    <div id="expenses-view" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Company Expenses &amp; Invoices
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log corporate expenses paid personally by shareholders for 50/50 reconciliation
          </p>
        </div>

        {canModify && (
          <button
            type="button"
            id="add-expense-btn"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, invoice #, desc..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status === 'INACTIVE' ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Paid By Shareholder */}
          <div>
            <select
              value={selectedPaidBy}
              onChange={e => setSelectedPaidBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Paid By</option>
              {shareholders.map(s => (
                <option key={s.userId} value={s.userId}>
                  {s.name} ({s.ownershipPercentage}%)
                </option>
              ))}
            </select>
          </div>

          {/* Date range shortcut */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              placeholder="From"
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              placeholder="To"
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid By</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Invoices</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No expense records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDate(exp.expenseDate)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{exp.vendor}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{exp.description}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {formatCurrency(exp.amount, sym)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {exp.paidByName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {exp.invoiceNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {exp.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {exp.attachments && exp.attachments.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {exp.attachments.map(att => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => setViewingAttachment(att)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-[10px] font-medium"
                              title={att.name}
                            >
                              <FileCheck className="w-3 h-3 text-indigo-500" />
                              <span className="max-w-[70px] truncate">{att.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                      {canModify && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Edit Expense"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(exp.id)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Expense Record?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this expense? The 50/50 shareholder settlement will automatically re-calculate.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {viewingAttachment.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {viewingAttachment.type} • {(viewingAttachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingAttachment.dataUrl}
                  download={viewingAttachment.name}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setViewingAttachment(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900 min-h-[300px]">
              {viewingAttachment.type.startsWith('image/') ? (
                <img
                  src={viewingAttachment.dataUrl}
                  alt={viewingAttachment.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : viewingAttachment.type === 'application/pdf' ? (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-md">
                  <FileText className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {viewingAttachment.name}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Secure PDF Invoice Document attached to qualifying shareholder expense.
                  </p>
                  <a
                    href={viewingAttachment.dataUrl}
                    download={viewingAttachment.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Invoice</span>
                  </a>
                </div>
              ) : (
                <div className="text-sm text-slate-500">File preview not available. Use download button.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingExpenseId ? 'Edit Expense Record' : 'Record Company Expense'}
                </h3>
                <p className="text-xs text-slate-500">
                  Select the shareholder who personally covered this company cost
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-lg">
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
                    placeholder="e.g. 12500"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Paid By (Shareholder) *
                  </label>
                  <select
                    required
                    value={formData.paidByUserId}
                    onChange={e => setFormData({ ...formData, paidByUserId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {activeShareholders.map(sh => (
                      <option key={sh.userId} value={sh.userId}>
                        {sh.name} ({sh.ownershipPercentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expense Category *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {activeCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vendor / Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLF Properties, AWS, Google"
                    value={formData.vendor}
                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-1029"
                    value={formData.invoiceNumber}
                    onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. September office rent"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Accounting Notes / Reimbursement Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional notes about this expenditure..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Invoice Upload Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Invoice Attachments (PDF, JPG, PNG)
                  </label>
                  <span className="text-[11px] text-slate-400">Multiple files supported</span>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors cursor-pointer relative bg-slate-50/50 dark:bg-slate-900/30">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Click to browse or drag invoice files here
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Supported: PDF, JPG, JPEG, PNG (Max 10MB per file)
                  </div>
                </div>

                {/* Attached file chips */}
                {formAttachments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {formAttachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {att.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({(att.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {editingExpenseId ? 'Save Changes' : 'Save Expense & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
