import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Building2, 
  Upload, 
  Sliders, 
  Save, 
  Percent, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';

export const CompanySettingsView: React.FC = () => {
  const { 
    currentUser, 
    companySettings, 
    updateCompanySettings, 
    shareholders, 
    updateShareholderPercentages 
  } = useData();

  const [form, setForm] = useState({
    companyName: companySettings.companyName,
    logoUrl: companySettings.logoUrl,
    currency: companySettings.currency,
    currencySymbol: companySettings.currencySymbol,
    contactInformation: companySettings.contactInformation,
    address: companySettings.address,
    shareholdersCanManageRevenue: companySettings.shareholdersCanManageRevenue,
  });

  const [shareholderPercentages, setShareholderPercentages] = useState<{ id: string; name: string; percentage: number }[]>(
    shareholders.map(s => ({ id: s.id, name: s.name, percentage: s.ownershipPercentage }))
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [equityError, setEquityError] = useState('');

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-xl border border-rose-200">
        <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
        <div className="font-bold">Access Restricted</div>
        <p className="text-xs mt-1">Company settings and equity distribution are reserved exclusively for the Super Admin.</p>
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = uploadEvent => {
      const dataUrl = uploadEvent.target?.result as string;
      setForm(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handlePercentageChange = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setShareholderPercentages(prev =>
      prev.map(sh => (sh.id === id ? { ...sh, percentage: num } : sh))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEquityError('');
    setSaveSuccess(false);

    // Validate equity sums to 100%
    const totalEquity = shareholderPercentages.reduce((sum, s) => sum + s.percentage, 0);
    if (Math.abs(totalEquity - 100) > 0.01) {
      setEquityError(`Total shareholder ownership percentage must equal exactly 100%. Currently: ${totalEquity}%`);
      return;
    }

    // Save company profile
    await updateCompanySettings(form);

    // Save shareholder percentages in database
    const equityRes = await updateShareholderPercentages(
      shareholderPercentages.map(s => ({ id: s.id, ownershipPercentage: s.percentage }))
    );

    if (!equityRes.success) {
      setEquityError(equityRes.message || 'Error updating shareholder percentages.');
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="company-settings-view" className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Company Profile &amp; Governance Settings
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
            Super Admin Access Only
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure corporate legal identity, logo branding, default currency, and shareholder equity percentages
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding & Logo Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-200 dark:border-slate-700">
            Corporate Identity &amp; Logo Branding
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Upload New Logo (PNG, JPG, SVG)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))}
                  className="block text-xs text-rose-500 hover:underline mx-auto sm:mx-0"
                >
                  Remove current logo
                </button>
              )}
              <p className="text-[11px] text-slate-400">
                Logo dynamically renders on Login, Sidebar, Dashboard, and Exported Reports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="INR, USD, EUR..."
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  required
                  placeholder="₹, $, €..."
                  value={form.currencySymbol}
                  onChange={e => setForm({ ...form, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={form.contactInformation}
                onChange={e => setForm({ ...form, contactInformation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Official Registered Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shareholdersCanManageRevenueCheck"
                checked={form.shareholdersCanManageRevenue}
                onChange={e => setForm({ ...form, shareholdersCanManageRevenue: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="shareholdersCanManageRevenueCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Allow all Shareholders to view and log customer revenue by default
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Shareholder Equity Distribution (Section 24 Specification) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Shareholder Ownership Equity Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Business Rule #24: Percentages are stored dynamically in database and feed directly into settlement math.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs font-bold">
              Total: {shareholderPercentages.reduce((s, p) => s + p.percentage, 0)}%
            </span>
          </div>

          {equityError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
              {equityError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shareholderPercentages.map(sh => (
              <div
                key={sh.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-2"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {sh.name}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={sh.percentage}
                    onChange={e => handlePercentageChange(sh.id, e.target.value)}
                    className="w-24 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono"
                  />
                  <span className="text-xs font-bold text-slate-500">% Equity</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Settings &amp; Equity configurations saved successfully.
            </span>
          ) : (
            <span className="text-xs text-slate-400">All changes instantly update ledger &amp; settlement math</span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings &amp; Equity</span>
          </button>
        </div>
      </form>
    </div>
  );
};
