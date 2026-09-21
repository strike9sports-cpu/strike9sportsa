import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ExpenseAttachment } from '../types';
import { formatDate } from '../utils/formatters';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Paperclip, 
  FileCheck, 
  X,
  FileSpreadsheet,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const { expenses } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreview, setActivePreview] = useState<{
    attachment: ExpenseAttachment;
    expenseVendor: string;
    expenseAmount: number;
    expenseCategory: string;
  } | null>(null);

  // Flatten all invoices attached across all expenses
  const allInvoices: {
    attachment: ExpenseAttachment;
    expenseId: string;
    vendor: string;
    invoiceNumber: string;
    amount: number;
    category: string;
    paidBy: string;
    expenseDate: string;
  }[] = [];

  expenses.forEach(exp => {
    if (exp.attachments && exp.attachments.length > 0) {
      exp.attachments.forEach(att => {
        allInvoices.push({
          attachment: att,
          expenseId: exp.id,
          vendor: exp.vendor,
          invoiceNumber: exp.invoiceNumber,
          amount: exp.amount,
          category: exp.categoryName,
          paidBy: exp.paidByName,
          expenseDate: exp.expenseDate,
        });
      });
    }
  });

  const filteredInvoices = allInvoices.filter(item => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.attachment.name.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.invoiceNumber.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div id="invoices-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Invoice Repository &amp; File Vault
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              Role Restricted
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready repository of original PDF invoices and receipt proofs attached to shareholder expenses
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Restricted to Super Admin &amp; Shareholders</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename, vendor, or invoice #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Invoices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">No invoice files found</div>
            <p className="text-xs text-slate-400 mt-1">
              When shareholders record expenses, they can attach PDF or image invoices which appear here.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv, idx) => (
            <div
              key={inv.attachment.id + '_' + idx}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {inv.invoiceNumber}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={inv.attachment.name}>
                  {inv.attachment.name}
                </h4>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Vendor: <span className="font-semibold text-slate-700 dark:text-slate-300">{inv.vendor}</span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Category:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{inv.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Paid By:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{inv.paidBy}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Date:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(inv.expenseDate)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {(inv.attachment.size / 1024).toFixed(0)} KB • {inv.attachment.type.split('/')[1]?.toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setActivePreview({
                        attachment: inv.attachment,
                        expenseVendor: inv.vendor,
                        expenseAmount: inv.amount,
                        expenseCategory: inv.category,
                      })
                    }
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    title="View Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={inv.attachment.dataUrl}
                    download={inv.attachment.name}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Preview */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activePreview.attachment.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activePreview.expenseVendor} • {activePreview.expenseCategory}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview.attachment.dataUrl}
                  download={activePreview.attachment.name}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900 min-h-[320px]">
              {activePreview.attachment.type.startsWith('image/') ? (
                <img
                  src={activePreview.attachment.dataUrl}
                  alt={activePreview.attachment.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-md">
                  <FileText className="w-14 h-14 text-rose-500 mx-auto mb-3" />
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {activePreview.attachment.name}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 mb-5">
                    Original verified invoice document preserved in database file storage.
                  </p>
                  <a
                    href={activePreview.attachment.dataUrl}
                    download={activePreview.attachment.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Invoice File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
