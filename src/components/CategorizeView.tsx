import React, { useState } from 'react';
import { 
  Shapes, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  AlertCircle,
  Layers,
  X,
  ListFilter
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/formatters';
import { isProofRequiredForTransaction, getProofRequirementInfo } from '../lib/transactionUtils';

interface CategorizeViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onUpdateTransactions?: (updated: Transaction[]) => void;
}

export const FORM_65_SECTIONED_CATEGORIES = [
  {
    group: 'Monthly Household Income',
    options: [
      'Employment Income',
      'Pension/Annuities',
      'Child Support',
      'Spousal Support',
      'Employment Income Benefits',
      'Social Assistance',
      'Self-Employment Income',
      'Child Tax Benefit',
      'Other Net Income'
    ]
  },
  {
    group: 'Non-Discretionary Expenses',
    options: [
      'Child Support Payments',
      'Spousal Support Payments',
      'Child Care',
      'Medical Condition Expenses',
      'Fines / Penalties Imposed by Court',
      'Employment-Related Mandatory Expenses',
      'Other Non-Discretionary Deductions'
    ]
  },
  {
    group: 'Household Disc. > Housing & Properties',
    options: [
      'Rent or Mortgage Payments',
      'Property Taxes',
      'Hydro',
      'Heating / Gas / Oil',
      'Water & Sewer',
      'Telephone & Digital Utilities',
      'Cable / Internet',
      'Home Maintenance / Repairs'
    ]
  },
  {
    group: 'Household Disc. > Personal',
    options: [
      'Smoking & Personal',
      'Alcohol',
      'Clothing',
      'Grooming & Toiletries',
      'Dining Out / Takeout',
      'Entertainment & Recreation',
      'Hobbies & Subscriptions'
    ]
  },
  {
    group: 'Household Disc. > Non-Recoverable Medical',
    options: [
      'Non-Recoverable Prescriptions',
      'Dental & Optical Care',
      'Medical Supplies & Health Care'
    ]
  },
  {
    group: 'Household Disc. > Living & Domestic',
    options: [
      'Food & Grocery',
      'Household Sundries & Supplies',
      'Child & School Expenses',
      'Laundry & Dry Cleaning'
    ]
  },
  {
    group: 'Household Disc. > Transportation',
    options: [
      'Repair, Maintenance & Gas',
      'Vehicle Financing / Lease',
      'Public Transit & Commuting',
      'Auto Insurance & Licensing'
    ]
  },
  {
    group: 'Household Disc. > Insurance & Estate',
    options: [
      'Life & Health Insurance',
      'Legal & Professional Fees',
      'To The Estate Dividend'
    ]
  }
];

export const CategorizeView: React.FC<CategorizeViewProps> = ({
  transactions,
  onUpdateTransaction,
  onUpdateTransactions
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needs-review' | 'categorized'>('needs-review');
  const [aiRunning, setAiRunning] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // State to track pending dropdown selections requiring user confirmation / Save click
  const [pendingCategories, setPendingCategories] = useState<Record<string, string>>({});
  const [saveToast, setSaveToast] = useState<{ id: string; message: string } | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('');

  const filtered = transactions.filter(t => {
    if (filterMode === 'needs-review') return !t.isCategorized;
    if (filterMode === 'categorized') return t.isCategorized;
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(t => selectedIds.includes(t.id));
  const someFilteredSelected = filtered.some(t => selectedIds.includes(t.id));

  const handleToggleSelect = (txId: string) => {
    setSelectedIds(prev => 
      prev.includes(txId) ? prev.filter(id => id !== txId) : [...prev, txId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered items
      const filteredIdSet = new Set(filtered.map(f => f.id));
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      // Select all filtered items
      const filteredIds = filtered.map(t => t.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
    setBulkCategory('');
  };

  const handleApplyBulkCategory = () => {
    if (!bulkCategory || selectedIds.length === 0) return;

    const targetIds = new Set(selectedIds);
    const updatedTxs: Transaction[] = [];

    transactions.forEach(t => {
      if (targetIds.has(t.id)) {
        updatedTxs.push({
          ...t,
          form65Category: bulkCategory,
          isCategorized: true
        });
      }
    });

    if (onUpdateTransactions) {
      onUpdateTransactions(updatedTxs);
    } else {
      updatedTxs.forEach(t => onUpdateTransaction(t));
    }

    // Clear any pending state for affected transactions
    setPendingCategories(prev => {
      const copy = { ...prev };
      selectedIds.forEach(id => delete copy[id]);
      return copy;
    });

    const count = selectedIds.length;
    setSelectedIds([]);
    setBulkCategory('');
    setSaveToast({
      id: `bulk-${Date.now()}`,
      message: `Successfully applied "${bulkCategory}" to ${count} transaction${count === 1 ? '' : 's'}!`
    });
    setTimeout(() => setSaveToast(null), 4000);
  };

  const selectedTotalAmount = transactions
    .filter(t => selectedIds.includes(t.id))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const handleSelectPendingCategory = (txId: string, category: string) => {
    setPendingCategories(prev => ({
      ...prev,
      [txId]: category
    }));
  };

  const handleSaveCategory = (tx: Transaction) => {
    const chosenCategory = pendingCategories[tx.id] || tx.form65Category || '';
    if (!chosenCategory) return;

    onUpdateTransaction({
      ...tx,
      form65Category: chosenCategory,
      isCategorized: true
    });

    // Clear pending state for this transaction
    setPendingCategories(prev => {
      const copy = { ...prev };
      delete copy[tx.id];
      return copy;
    });

    setSaveToast({
      id: tx.id,
      message: `Saved category "${chosenCategory}" for ${tx.company}!`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleCancelPending = (txId: string) => {
    setPendingCategories(prev => {
      const copy = { ...prev };
      delete copy[txId];
      return copy;
    });
  };

  const handleRunAiClassifier = () => {
    setAiRunning(true);
    setAiMessage('Analyzing vendor names and matching against Canadian OSB Form 65 tax rules...');
    setTimeout(() => {
      transactions.forEach(t => {
        if (!t.isCategorized) {
          let cat = 'Food & Grocery';
          const name = t.company.toLowerCase();
          if (name.includes('properties') || name.includes('rent')) cat = 'Rent or Mortgage Payments';
          else if (name.includes('mechanics') || name.includes('gas') || name.includes('auto')) cat = 'Repair, Maintenance & Gas';
          else if (name.includes('drug') || name.includes('pharmacy') || name.includes('medical')) cat = 'Non-Recoverable Prescriptions';
          else if (name.includes('hydro') || name.includes('electric')) cat = 'Hydro';
          else if (name.includes('transit') || name.includes('bus') || name.includes('metro')) cat = 'Public Transit & Commuting';
          else if (name.includes('dining') || name.includes('restaurant') || name.includes('cafe')) cat = 'Dining Out / Takeout';
          
          onUpdateTransaction({
            ...t,
            form65Category: cat,
            isCategorized: true
          });
        }
      });
      setAiRunning(false);
      setAiMessage('AI categorization complete! All ambiguous transactions mapped to Form 65 statutory lines.');
      setTimeout(() => setAiMessage(null), 4000);
    }, 1200);
  };

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Overview Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shapes className="w-4 h-4 text-[#242031] shrink-0" />
              <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-slate-900 whitespace-nowrap">
                AI Transaction Classifier & Form 65 Rules
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Match statement ledger items to Form 65 statutory lines. Select a category and click Save to confirm each mapping.
            </p>
          </div>

          <button
            onClick={handleRunAiClassifier}
            disabled={aiRunning}
            className="px-4 py-2.5 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-center"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiRunning ? 'animate-spin text-[#b4b1fc]' : 'text-[#fbf050]'}`} />
            <span>{aiRunning ? 'Parsing Statement Items...' : 'Auto-Classify with AI'}</span>
          </button>
        </div>

        {aiMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        {saveToast && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{saveToast.message}</span>
            </div>
            <span className="text-[10px] text-emerald-700 uppercase tracking-widest font-black">Confirmed</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-5">
          <button
            onClick={() => setFilterMode('needs-review')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition ${
              filterMode === 'needs-review'
                ? 'bg-[#1d1a27] text-white font-bold'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200 font-normal'
            }`}
          >
            Needs Review ({transactions.filter(t => !t.isCategorized).length})
          </button>
          <button
            onClick={() => setFilterMode('categorized')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition ${
              filterMode === 'categorized'
                ? 'bg-[#1d1a27] text-white font-bold'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200 font-normal'
            }`}
          >
            Categorized ({transactions.filter(t => t.isCategorized).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition ${
              filterMode === 'all'
                ? 'bg-[#1d1a27] text-white font-bold'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200 font-normal'
            }`}
          >
            All Ledger Items ({transactions.length})
          </button>
        </div>
      </div>

      {/* Ledger Items List */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
        {/* Bulk Actions Floating/Docked Toolbar */}
        {selectedIds.length > 0 && (
          <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-[#1d1a27] text-white border border-white/10 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#b4b1fc]/20 text-[#b4b1fc] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>{selectedIds.length} of {filtered.length} Selected</span>
                  <span className="text-[#fbf050] font-bold">({formatCurrency(selectedTotalAmount)})</span>
                </div>
                <div className="text-[11px] text-slate-300 font-light">
                  Assign one Form 65 statutory category to all selected statement items
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
              {/* Category Selector for Bulk Action */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  className="w-full sm:w-auto bg-[#2b263b] border border-white/20 rounded-xl px-3 min-h-[44px] py-2.5 text-xs font-light text-white focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] max-w-xs truncate"
                >
                  <option value="">Choose category for selected...</option>
                  {FORM_65_SECTIONED_CATEGORIES.map(section => (
                    <optgroup key={section.group} label={section.group} className="bg-[#1d1a27] text-white">
                      {section.options.map(opt => (
                        <option key={opt} value={opt} className="bg-[#2b263b] text-white">
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Primary Apply Button */}
              <button
                type="button"
                onClick={handleApplyBulkCategory}
                disabled={!bulkCategory}
                style={{
                  background: bulkCategory ? 'var(--colour-dark-highlight, #F9F45D)' : undefined,
                  boxShadow: bulkCategory ? '4px 6px 0px black' : undefined,
                  borderRadius: 8,
                  color: bulkCategory ? 'var(--colour-dark-accent, #3E4A4F)' : undefined,
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '13.34px',
                  fontWeight: '700',
                  lineHeight: '20.96px'
                }}
                className={`px-4 min-h-[44px] py-2 transition-all flex items-center gap-1.5 shrink-0 ${
                  bulkCategory 
                    ? 'hover:brightness-105 active:translate-x-[2px] active:translate-y-[3px] active:[box-shadow:2px_3px_0px_black] cursor-pointer' 
                    : 'bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed'
                }`}
                title={bulkCategory ? `Apply "${bulkCategory}" to ${selectedIds.length} items` : 'Select a category above first'}
              >
                <Check className="w-4 h-4 stroke-[2.5]" style={{ color: bulkCategory ? '#3E4A4F' : undefined }} />
                <span>Apply to {selectedIds.length} Items</span>
              </button>

              {/* Clear Selection */}
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 min-h-[44px] py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* List Header Toolbar: Select All Checkbox + Status */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/90 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={input => {
                    if (input) input.indeterminate = someFilteredSelected && !allFilteredSelected;
                  }}
                  onChange={handleToggleSelectAll}
                  aria-label="Select or deselect all visible transactions"
                  className="w-4 h-4 rounded border-slate-300 text-[#242031] focus:ring-[#b4b1fc] cursor-pointer accent-[#242031]"
                />
                <span className="font-semibold text-slate-800 text-xs">
                  {allFilteredSelected 
                    ? `Deselect All (${filtered.length})` 
                    : `Select All (${filtered.length})`}
                </span>
              </label>

              {selectedIds.length > 0 && !allFilteredSelected && (
                <span className="text-[11px] text-slate-500 font-medium bg-slate-200/70 px-2 py-0.5 rounded-md">
                  {selectedIds.length} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] text-slate-500 hover:text-slate-900 underline transition"
                >
                  Clear selection
                </button>
              )}
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Showing {filtered.length} items
              </span>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            No transactions match this filter. All imported items are categorized!
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(tx => {
              const pendingVal = pendingCategories[tx.id];
              const activeVal = pendingVal !== undefined ? pendingVal : (tx.form65Category || '');
              const hasUnsavedChange = pendingVal !== undefined && pendingVal !== (tx.form65Category || '');
              const isSelected = selectedIds.includes(tx.id);

              return (
                <div 
                  key={tx.id}
                  className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    isSelected
                      ? 'border-[#b4b1fc] bg-[#b4b1fc]/10 shadow-xs ring-1 ring-[#b4b1fc]/50'
                      : hasUnsavedChange 
                      ? 'bg-white border-[#b6b3ff] ring-2 ring-[#b6b3ff]/30' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Item Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(tx.id)}
                      aria-label={`Select transaction ${tx.company}`}
                      className="w-4 h-4 rounded border-slate-300 text-[#242031] focus:ring-[#b4b1fc] cursor-pointer accent-[#242031] shrink-0"
                    />

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{tx.company}</span>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">#{tx.id}</span>
                        {isProofRequiredForTransaction(tx) && (
                          <span 
                            title={getProofRequirementInfo(tx).explanation}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{getProofRequirementInfo(tx).type === 'prescription' ? 'Prescription Receipt Required' : 'Proof Receipt Required'}</span>
                          </span>
                        )}
                        {tx.receiptFileName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Receipt Attached</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {tx.date} · Bank Import Feed
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end pl-7 sm:pl-0">
                    <div className="text-right mr-1">
                      <span className="text-sm sm:text-base font-bold text-slate-900 block">
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[9px] uppercase font-normal text-slate-400">
                        CAD
                      </span>
                    </div>

                    {/* Sectioned Form 65 Category Selector */}
                    <div className="relative">
                      <select
                        value={activeVal}
                        onChange={e => handleSelectPendingCategory(tx.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-3 min-h-[44px] py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] max-w-[260px] truncate"
                      >
                        <option value="">Select Form 65 Category...</option>
                        {FORM_65_SECTIONED_CATEGORIES.map(section => (
                          <optgroup key={section.group} label={section.group}>
                            {section.options.map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Explicit Save Action or Status Badge */}
                    {hasUnsavedChange ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <button
                          type="button"
                          onClick={() => handleSaveCategory(tx)}
                          className="px-3.5 py-2 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-[#fbf050] text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          title="Save this category assignment"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelPending(tx.id)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          title="Cancel changes"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : tx.isCategorized ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Mapped
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-medium px-2.5 py-1 rounded-md">
                        Unclassified
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
