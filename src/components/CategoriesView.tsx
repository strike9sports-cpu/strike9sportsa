import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ExpenseCategory } from '../types';
import { 
  Tags, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ShieldAlert
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { 
    currentUser, 
    categories, 
    expenses, 
    createCategory, 
    updateCategory, 
    deactivateCategory 
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
        <div className="font-bold">Access Restricted</div>
        <p className="text-xs mt-1">Only Super Admin can configure expense categories.</p>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingCatId(null);
    setCatNameInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ExpenseCategory) => {
    setEditingCatId(cat.id);
    setCatNameInput(cat.name);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    if (editingCatId) {
      updateCategory(editingCatId, catNameInput.trim());
    } else {
      createCategory(catNameInput.trim());
    }

    setIsModalOpen(false);
  };

  return (
    <div id="categories-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Expense Categories Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              Admin Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Categories are preserved historically for audit integrity; deactivating hides them from future entries without corrupting past records.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const usedCount = expenses.filter(e => e.categoryId === cat.id).length;
          return (
            <div
              key={cat.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                cat.status === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    cat.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {cat.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {usedCount} linked expense{usedCount === 1 ? '' : 's'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h4>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {cat.status === 'ACTIVE' ? 'Available in expense forms' : 'Hidden from new expense dropdown'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                    title="Rename Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {cat.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setDeactivateConfirmId(cat.id)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600"
                      title="Deactivate Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deactivate confirmation */}
      {deactivateConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Deactivate Category?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to deactivate this category? Inactive categories won't appear when adding new expenses, but existing expense records will continue to preserve their historical category.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateConfirmId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deactivateCategory(deactivateConfirmId);
                  setDeactivateConfirmId(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCatId ? 'Edit Category Name' : 'Create Expense Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Rent, Cloud Subscriptions"
                  value={catNameInput}
                  onChange={e => setCatNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  {editingCatId ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
