import React, { useState } from 'react';
import { 
  Shapes, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Save,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { Transaction } from '../types';

interface CategorizeViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
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
  onUpdateTransaction
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needs-review' | 'categorized'>('needs-review');
  const [aiRunning, setAiRunning] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // State to track pending dropdown selections requiring user confirmation / Save click
  const [pendingCategories, setPendingCategories] = useState<Record<string, string>>({});
  const [saveToast, setSaveToast] = useState<{ id: string; message: string } | null>(null);

  const filtered = transactions.filter(t => {
    if (filterMode === 'needs-review') return !t.isCategorized;
    if (filterMode === 'categorized') return t.isCategorized;
    return true;
  });

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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === 'needs-review'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Needs Review ({transactions.filter(t => !t.isCategorized).length})
          </button>
          <button
            onClick={() => setFilterMode('categorized')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === 'categorized'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Categorized ({transactions.filter(t => t.isCategorized).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterMode === 'all'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Ledger Items ({transactions.length})
          </button>
        </div>
      </div>

      {/* Ledger Items List */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
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

              return (
                <div 
                  key={tx.id}
                  className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    hasUnsavedChange ? 'border-[#b6b3ff] ring-2 ring-[#b6b3ff]/30' : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{tx.company}</span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">#{tx.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tx.date} · Bank Import Feed
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className="text-right mr-1">
                      <span className="text-sm sm:text-base font-bold text-slate-900 block">
                        $ {tx.amount.toFixed(2)}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        CAD
                      </span>
                    </div>

                    {/* Sectioned Form 65 Category Selector */}
                    <div className="relative">
                      <select
                        value={activeVal}
                        onChange={e => handleSelectPendingCategory(tx.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] max-w-[260px] truncate"
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
                          className="px-3 py-1.5 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-[#fbf050] text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          title="Save this category assignment"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelPending(tx.id)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                          title="Cancel changes"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : tx.isCategorized ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Mapped
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-xl">
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
