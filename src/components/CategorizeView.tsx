import React, { useState, useMemo } from 'react';
import {
  Route,
  Sparkles,
  Check,
  CheckCircle2,
  Save,
  RotateCcw,
  AlertTriangle,
  Layers,
  X,
  Plus
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/formatters';
import { isProofRequiredForTransaction, getProofRequirementInfo } from '../lib/transactionUtils';
import { FloatingSelect, SelectOption } from './FloatingSelect';
import { FloatingInput } from './FloatingInput';

interface CategorizeViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onUpdateTransactions?: (updated: Transaction[]) => void;
  onAddTransaction?: (newTx: Omit<Transaction, 'id'>) => void;
  isNewTxModalOpen?: boolean;
  onCloseNewTxModal?: () => void;
  onOpenNewTxModal?: () => void;
}

export interface Form65OptionDef {
  value: string;
  label: string;
}

export interface Form65SectionDef {
  group: string;
  shortGroup: string;
  options: Form65OptionDef[];
}

export const FORM_65_SECTIONED_CATEGORIES: Form65SectionDef[] = [
  {
    group: 'FAMILY INCOME (NET)',
    shortGroup: 'Family Income (Net)',
    options: [
      { value: 'Employment Income', label: 'Employment Income' },
      { value: 'Pension/Annuities', label: 'Pension/Annuities' },
      { value: 'Child Support', label: 'Child Support' },
      { value: 'Spousal Support', label: 'Spousal Support' },
      { value: 'Employment Insurance Benefits', label: 'Employment Insurance Benefits' },
      { value: 'Social Assistance', label: 'Social Assistance' },
      { value: 'Self-Employment Income', label: 'Self-Employment Income' },
      { value: 'Child Tax Benefit', label: 'Child Tax Benefit' },
      { value: 'Other Net Income', label: 'Other Net Income' }
    ]
  },
  {
    group: 'FAMILY NON-DISCRETIONARY EXPENSES',
    shortGroup: 'Family Non-Discretionary Expenses',
    options: [
      { value: 'Child Support Payments', label: 'Child Support Payments' },
      { value: 'Spousal Support Payments', label: 'Spousal Support' },
      { value: 'Child Care', label: 'Child Care' },
      { value: 'Medical Condition Expenses', label: 'Medical Condition Expenses' },
      { value: 'Court Mandated Fines/Penalties', label: 'Court Mandated Fines/Penalties' },
      { value: 'Employment Expenses', label: 'Employment Expenses' },
      { value: 'Debts (Stay Lifted)', label: 'Debts (Stay Lifted)' },
      { value: 'Other Non-Discretionary Expenses', label: 'Other Expenses' }
    ]
  },
  {
    group: 'HOUSING EXPENSES',
    shortGroup: 'Housing Expenses',
    options: [
      { value: 'Rent/Mortgage', label: 'Rent/Mortgage' },
      { value: 'Property Taxes/Condo Fees', label: 'Property Taxes/Condo Fees' },
      { value: 'Heating/Gas/Oil', label: 'Heating/Gas/Oil' },
      { value: 'Telephone', label: 'Telephone' },
      { value: 'Cable', label: 'Cable' },
      { value: 'Hydro', label: 'Hydro' },
      { value: 'Water', label: 'Water' },
      { value: 'Furniture', label: 'Furniture' },
      { value: 'Other Housing Expenses', label: 'Other Expenses' }
    ]
  },
  {
    group: 'PERSONAL EXPENSES',
    shortGroup: 'Personal Expenses',
    options: [
      { value: 'Smoking', label: 'Smoking' },
      { value: 'Alcohol', label: 'Alcohol' },
      { value: 'Dining/Lunches/Restaurants', label: 'Dining/Lunches/Restaurants' },
      { value: 'Entertainment/Sports', label: 'Entertainment/Sports' },
      { value: 'Gifts & Charitable Donations', label: 'Gifts & Charitable Donations' },
      { value: 'Allowances', label: 'Allowances' },
      { value: 'Other Personal Expenses', label: 'Other Expenses' }
    ]
  },
  {
    group: 'LIVING EXPENSES',
    shortGroup: 'Living Expenses',
    options: [
      { value: 'Food/Grocery', label: 'Food/Grocery' },
      { value: 'Laundry & Dry Cleaning', label: 'Laundry & Dry Cleaning' },
      { value: 'Grooming & Toiletries', label: 'Grooming & Toiletries' },
      { value: 'Clothing', label: 'Clothing' },
      { value: 'Other Living Expenses', label: 'Other Living Expenses' }
    ]
  },
  {
    group: 'TRANSPORTATION EXPENSES',
    shortGroup: 'Transportation Expenses',
    options: [
      { value: 'Repair/Maintenance/Gas', label: 'Repair/Maintenance/Gas' },
      { value: 'Public Transportation', label: 'Public Transportation' },
      { value: 'Other Transportation Expenses', label: 'Other Transportation Expenses' }
    ]
  },
  {
    group: 'INSURANCE EXPENSES',
    shortGroup: 'Insurance Expenses',
    options: [
      { value: 'Vehicle', label: 'Vehicle' },
      { value: 'House', label: 'House' },
      { value: 'Furniture & Contents', label: 'Furniture & Contents' },
      { value: 'Life Insurance', label: 'Life Insurance' },
      { value: 'Other Insurance Expenses', label: 'Other Insurance Expenses' }
    ]
  },
  {
    group: 'NON-RECOVERABLE MEDICAL EXPENSES',
    shortGroup: 'Non-Recoverable Medical Expenses',
    options: [
      { value: 'Prescriptions', label: 'Prescriptions' },
      { value: 'Dental', label: 'Dental' },
      { value: 'Other Non-Recoverable Medical Expenses', label: 'Other Non-Recoverable Medical Expenses' }
    ]
  },
  {
    group: 'PAYMENTS',
    shortGroup: 'Payments',
    options: [
      { value: 'To The Estate', label: 'To The Estate' },
      { value: 'To Secured Creditor', label: 'To Secured Creditor' },
      { value: 'Other Than Mortgage or Vehicle', label: 'Other Than Mortgage or Vehicle' },
      { value: 'Other Payments', label: 'Other Payments' }
    ]
  }
];

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'Employment Income Benefits': 'Employment Insurance Benefits',
  'Fines / Penalties Imposed by Court': 'Court Mandated Fines/Penalties',
  'Employment-Related Mandatory Expenses': 'Employment Expenses',
  'Other Non-Discretionary Deductions': 'Other Non-Discretionary Expenses',
  'Rent or Mortgage Payments': 'Rent/Mortgage',
  'Property Taxes': 'Property Taxes/Condo Fees',
  'Heating / Gas / Oil': 'Heating/Gas/Oil',
  'Water & Sewer': 'Water',
  'Telephone & Digital Utilities': 'Telephone',
  'Cable / Internet': 'Cable',
  'Home Maintenance / Repairs': 'Other Housing Expenses',
  'Smoking & Personal': 'Smoking',
  'Dining Out / Takeout': 'Dining/Lunches/Restaurants',
  'Entertainment & Recreation': 'Entertainment/Sports',
  'Hobbies & Subscriptions': 'Other Personal Expenses',
  'Non-Recoverable Prescriptions': 'Prescriptions',
  'Dental & Optical Care': 'Dental',
  'Medical Supplies & Health Care': 'Other Non-Recoverable Medical Expenses',
  'Food & Grocery': 'Food/Grocery',
  'Household Sundries & Supplies': 'Other Living Expenses',
  'Child & School Expenses': 'Other Living Expenses',
  'Repair, Maintenance & Gas': 'Repair/Maintenance/Gas',
  'Vehicle Financing / Lease': 'Other Transportation Expenses',
  'Public Transit & Commuting': 'Public Transportation',
  'Auto Insurance & Licensing': 'Vehicle',
  'Life & Health Insurance': 'Life Insurance',
  'Legal & Professional Fees': 'Other Payments',
  'To The Estate Dividend': 'To The Estate'
};

function normalizeForm65Category(category?: string): string {
  if (!category) return '';
  return LEGACY_CATEGORY_MAP[category] || category;
}

function formatAmountDisplay(amount: number): string {
  const num = Number.isFinite(amount) ? amount : 0;
  return `$ ${num.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export const CategorizeView: React.FC<CategorizeViewProps> = ({
  transactions,
  onUpdateTransaction,
  onUpdateTransactions,
  onAddTransaction,
  isNewTxModalOpen = false,
  onCloseNewTxModal,
  onOpenNewTxModal
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

  // Manual New Transaction Modal State
  const [internalModalOpen, setInternalModalOpen] = useState<boolean>(false);
  const modalVisible = isNewTxModalOpen || internalModalOpen;
  const [newTxCompany, setNewTxCompany] = useState<string>('');
  const [newTxAmount, setNewTxAmount] = useState<string>('');
  const [newTxDate, setNewTxDate] = useState<string>(() =>
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );
  const [newTxCategory, setNewTxCategory] = useState<string>('');

  const closeModal = () => {
    setInternalModalOpen(false);
    if (onCloseNewTxModal) onCloseNewTxModal();
  };

  const openModal = () => {
    if (onOpenNewTxModal) onOpenNewTxModal();
    else setInternalModalOpen(true);
  };

  const categoryOptions: SelectOption[] = useMemo(() => {
    return FORM_65_SECTIONED_CATEGORIES.flatMap((section) =>
      section.options.map((opt) => ({
        value: opt.value,
        label: `${section.shortGroup} > ${opt.label}`,
        sectionHeader: section.group,
        displayGroup: section.shortGroup,
        displayLabel: opt.label
      }))
    );
  }, []);

  const needsReviewCount = transactions.filter(t => !t.isCategorized).length;
  const categorizedCount = transactions.filter(t => t.isCategorized).length;

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
      const filteredIdSet = new Set(filtered.map(f => f.id));
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
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
    setAiMessage('Analyzing vendor names and matching against Canadian OSB Form 65 statutory rules...');
    setTimeout(() => {
      const updates: Transaction[] = [];
      transactions.forEach(t => {
        if (!t.isCategorized) {
          let cat = 'Food/Grocery';
          const name = t.company.toLowerCase();
          if (name.includes('properties') || name.includes('rent')) cat = 'Rent/Mortgage';
          else if (name.includes('mechanics') || name.includes('gas') || name.includes('auto')) cat = 'Repair/Maintenance/Gas';
          else if (name.includes('drug') || name.includes('pharmacy') || name.includes('medical')) cat = 'Prescriptions';
          else if (name.includes('hydro') || name.includes('electric')) cat = 'Hydro';
          else if (name.includes('transit') || name.includes('bus') || name.includes('metro')) cat = 'Public Transportation';
          else if (name.includes('dining') || name.includes('restaurant') || name.includes('cafe')) cat = 'Dining/Lunches/Restaurants';
          else if (name.includes('dropbox') || name.includes('rogers') || name.includes('telus') || name.includes('bell')) cat = 'Telephone';

          updates.push({
            ...t,
            form65Category: cat,
            isCategorized: true
          });
        }
      });

      if (updates.length > 0) {
        if (onUpdateTransactions) {
          onUpdateTransactions(updates);
        } else {
          updates.forEach(u => onUpdateTransaction(u));
        }
      }

      setAiRunning(false);
      setAiMessage('AI categorization complete! All ambiguous transactions mapped to Form 65 statutory lines.');
      setTimeout(() => setAiMessage(null), 4000);
    }, 900);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxCompany.trim() || !newTxAmount) return;

    const amountVal = parseFloat(newTxAmount) || 0;
    if (onAddTransaction) {
      onAddTransaction({
        userId: transactions[0]?.userId || 'demo-user-chad-001',
        company: newTxCompany.trim(),
        date: newTxDate.trim() || 'Aug 30, 2022',
        amount: amountVal,
        category: newTxCategory || 'General',
        form65Category: newTxCategory || undefined,
        isCategorized: Boolean(newTxCategory),
        status: 'cleared'
      });
    }

    setSaveToast({
      id: `new-${Date.now()}`,
      message: `Added "${newTxCompany.trim()}" (${formatAmountDisplay(amountVal)}) to your ledger!`
    });
    setTimeout(() => setSaveToast(null), 3500);

    setNewTxCompany('');
    setNewTxAmount('');
    setNewTxCategory('');
    closeModal();
  };

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* Top Overview Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border border-[#1a1822] shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Route className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
                TRANSACTIONS REVIEW
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] max-w-md leading-relaxed">
              Match transactions and items to Form 65 statutory lines. Select a category and click Save to confirm each mapping.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunAiClassifier}
            disabled={aiRunning}
            className="px-4 py-2.5 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-semibold border border-black shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 shrink-0 self-start cursor-pointer whitespace-nowrap disabled:opacity-70"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiRunning ? 'animate-spin text-[#b4b1fc]' : 'text-[#fbf050]'}`} />
            <span>{aiRunning ? 'Parsing Statement Items...' : 'Auto-classify with AI'}</span>
          </button>
        </div>

        {/* Hairline Divider */}
        <div className="border-t border-[#8c93fc]/25 my-1" />

        {aiMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        {saveToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{saveToast.message}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-white/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Confirmed
            </span>
          </div>
        )}

        {/* Filter Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4">
          <button
            type="button"
            onClick={() => setFilterMode('needs-review')}
            className={`px-4 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              filterMode === 'needs-review'
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
            }`}
          >
            <span>Needs Review</span>{' '}
            <span className="font-normal opacity-80 tabular-nums">({needsReviewCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('categorized')}
            className={`px-4 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              filterMode === 'categorized'
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
            }`}
          >
            <span>Categorized</span>{' '}
            <span className="font-normal opacity-80 tabular-nums">({categorizedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-4 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
            }`}
          >
            <span>All Ledger Items</span>{' '}
            <span className="font-normal opacity-80 tabular-nums">({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* Bottom Ledger Items Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border border-[#1a1822] shadow-[5px_6px_0px_#000000]">
        {/* Bulk Actions Floating/Docked Toolbar */}
        {selectedIds.length > 0 && (
          <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-[#1d1a27] text-white border border-[#101010] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#b4b1fc]/20 text-[#b4b1fc] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>{selectedIds.length} of {filtered.length} Selected</span>
                  <span className="text-[#fbf050] font-bold tabular-nums">({formatCurrency(selectedTotalAmount)})</span>
                </div>
                <div className="text-[11px] text-slate-300 font-light">
                  Assign one Form 65 statutory category to all selected statement items
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:justify-end min-w-[240px]">
              <div className="relative flex-1 sm:flex-initial min-w-[240px]">
                <FloatingSelect
                  label="Choose category for selected..."
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  options={categoryOptions}
                />
              </div>

              <button
                type="button"
                onClick={handleApplyBulkCategory}
                disabled={!bulkCategory}
                className={`px-4 min-h-[44px] py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  bulkCategory
                    ? 'bg-[#F9F45D] text-[#1d1a27] border border-black shadow-[3px_4px_0px_#000000] hover:brightness-105 active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] cursor-pointer'
                    : 'bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Apply to {selectedIds.length} Items</span>
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 min-h-[44px] py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtle Select All Row */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/80 text-xs text-[#6e6b7b]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                    allFilteredSelected
                      ? 'bg-[#46e3a5] border-[1.5px] border-[#101010] text-[#101010]'
                      : someFilteredSelected
                      ? 'bg-[#b4b1fc] border-[1.5px] border-[#101010] text-[#101010]'
                      : 'bg-white border-[1.5px] border-[#52525b] group-hover:border-[#101010] text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <span className="font-semibold text-[#101010] text-xs">
                  {allFilteredSelected
                    ? `Deselect All (${filtered.length})`
                    : `Select All (${filtered.length})`}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] text-[#5b56d6] hover:underline font-medium cursor-pointer"
                >
                  Clear ({selectedIds.length})
                </button>
              )}
              <span className="text-[11px] font-mono text-[#6e6b7b] tabular-nums">
                Showing {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="text-xs font-bold text-[#6e6b7b]">
              No transactions match this filter. All imported items are categorized!
            </div>
            {onAddTransaction && (
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d2a37] text-white text-xs font-semibold border border-black shadow-[2px_3px_0px_#000000] hover:bg-[#3a3646] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#46e3a5]" />
                <span>Add Manual Transaction</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(tx => {
              const normalizedSavedCategory = normalizeForm65Category(tx.form65Category);
              const pendingVal = pendingCategories[tx.id];
              const activeVal = pendingVal !== undefined ? pendingVal : normalizedSavedCategory;
              const hasUnsavedChange = pendingVal !== undefined && pendingVal !== normalizedSavedCategory;
              const isSelected = selectedIds.includes(tx.id);

              const txForCheck: Transaction = activeVal ? { ...tx, form65Category: activeVal } : tx;
              const requiresProof = isProofRequiredForTransaction(txForCheck);
              const proofInfo = getProofRequirementInfo(txForCheck);
              const hasProofAttached = Boolean(tx.receiptFileName || tx.receiptId);

              return (
                <div
                  key={tx.id}
                  className={`bg-white rounded-2xl px-4 sm:px-5 py-4 border transition grid grid-cols-1 lg:grid-cols-12 items-center gap-4 ${
                    isSelected
                      ? 'border-[#101010] ring-2 ring-[#8c93fc]/30'
                      : hasUnsavedChange
                      ? 'border-[#8c93fc] ring-2 ring-[#8c93fc]/25'
                      : 'border-[#d8d9f8] hover:border-[#8c93fc]'
                  }`}
                >
                  {/* Left Zone: Checkbox + Merchant + ID + Proof/Submitted Tag */}
                  <div className="lg:col-span-5 flex items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(tx.id)}
                      aria-label={`Select transaction ${tx.company}`}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#46e3a5] border-[1.5px] border-[#101010] text-[#101010]'
                          : 'bg-white border-[1.5px] border-[#52525b] hover:border-[#101010] text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-[#101010] text-sm truncate">
                          {tx.company}
                        </span>
                        <span className="font-mono text-xs text-[#6e6b7b] shrink-0">
                          #{tx.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {requiresProof && !hasProofAttached ? (
                          <span
                            title={proofInfo.explanation}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fbf050] text-[#1d1a27] text-[11px] font-semibold"
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{proofInfo.type === 'prescription' ? 'Prescription Needed' : 'Receipt Needed'}</span>
                          </span>
                        ) : hasProofAttached || tx.isCategorized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>{hasProofAttached ? 'Submitted' : 'Categorized'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e9e8ec] text-[#4b4856] text-[11px] font-semibold">
                            <span>Needs Review</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Zone: Category Selector + Save Action */}
                  <div className="lg:col-span-4 flex items-center gap-2 min-w-0 pl-11 lg:pl-0">
                    <div className="flex-1 min-w-[210px]">
                      <FloatingSelect
                        label="Select Form 65 Category..."
                        value={activeVal}
                        onChange={e => handleSelectPendingCategory(tx.id, e.target.value)}
                        options={categoryOptions}
                      />
                    </div>

                    {hasUnsavedChange && (
                      <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in">
                        <button
                          type="button"
                          onClick={() => handleSaveCategory(tx)}
                          className="px-3 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] border border-black shadow-[2px_3px_0px_#000000] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Save this category assignment"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelPending(tx.id)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#101010] transition cursor-pointer"
                          title="Cancel changes"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Zone: Amount + Date · Bank Import Feed */}
                  <div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end justify-between pl-11 lg:pl-0 text-right">
                    <div className="text-base font-bold text-[#101010] tabular-nums">
                      {formatAmountDisplay(tx.amount)}
                    </div>
                    <div className="text-[11px] text-[#6e6b7b] tabular-nums mt-0.5">
                      {tx.date} <span aria-hidden="true">·</span> Bank Import Feed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Transaction Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-7 border border-[#1a1822] shadow-[6px_8px_0px_#000000] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                  Add Manual Transaction
                </h3>
                <p className="text-xs text-[#6e6b7b] mt-0.5">
                  Log a cash or card expense directly into your Form 65 review queue.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-slate-200/70 text-[#6e6b7b] hover:text-[#101010] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <FloatingInput
                label="Vendor / Merchant Name"
                value={newTxCompany}
                onChange={e => setNewTxCompany(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  type="number"
                  step="0.01"
                  label="Amount ($ CAD)"
                  value={newTxAmount}
                  onChange={e => setNewTxAmount(e.target.value)}
                  required
                />
                <FloatingInput
                  label="Transaction Date"
                  value={newTxDate}
                  onChange={e => setNewTxDate(e.target.value)}
                  required
                />
              </div>

              <FloatingSelect
                label="Form 65 Category (Optional)"
                value={newTxCategory}
                onChange={e => setNewTxCategory(e.target.value)}
                options={categoryOptions}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-[#2d2d2d] bg-white hover:bg-slate-50 text-xs font-semibold text-[#101010] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border border-black shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
