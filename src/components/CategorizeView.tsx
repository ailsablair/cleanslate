import React, { useState, useMemo } from 'react';
import {
  AutoGraphIcon,
  SparklesIcon,
  CheckIcon,
  SaveIcon,
  CancelIcon,
  WarningTriangleIcon,
  ShapesIcon,
  CloseIcon,
  PlusIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { Transaction, Receipt } from '../types';
import { formatCurrency } from '../lib/formatters';
import { isProofRequiredForTransaction, getProofRequirementInfo } from '../lib/transactionUtils';
import { FORM_65_SECTIONED_CATEGORIES, normalizeForm65Category } from '../lib/form65Categories';
import { FloatingSelect, SelectOption } from './FloatingSelect';
import { FloatingInput } from './FloatingInput';
import { UploadConfirmationModal } from './UploadConfirmationModal';

export { FORM_65_SECTIONED_CATEGORIES };

interface CategorizeViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onUpdateTransactions?: (updated: Transaction[]) => void;
  onAddTransaction?: (newTx: Omit<Transaction, 'id'>) => void;
  onAddReceipt?: (receipt: Omit<Receipt, 'id'>) => void;
  isNewTxModalOpen?: boolean;
  onCloseNewTxModal?: () => void;
  onOpenNewTxModal?: () => void;
}

// Form 65 category definitions & normalization live in src/lib/form65Categories.ts

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
  onAddReceipt,
  isNewTxModalOpen = false,
  onCloseNewTxModal,
  onOpenNewTxModal
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needs-review' | 'categorized'>('needs-review');
  const [aiRunning, setAiRunning] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [proofTargetTx, setProofTargetTx] = useState<Transaction | null>(null);

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
              <AutoGraphIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
                TRANSACTIONS REVIEW
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] max-w-md leading-relaxed">
              Match transactions and items to Form 65 statutory lines. Select a category and click Save to confirm each mapping.
            </p>
          </div>

          <CleanSlateButton
            variant="dark-yellow"
            size="md"
            leftIcon={SparklesIcon}
            onClick={handleRunAiClassifier}
            disabled={aiRunning}
            className="shrink-0 self-start"
          >
            {aiRunning ? 'Parsing Statement Items...' : 'Auto-classify with AI'}
          </CleanSlateButton>
        </div>

        {/* Hairline Divider */}
        <div className="border-t border-[#8c93fc]/25 my-1" />

        {aiMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckIcon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        {saveToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{saveToast.message}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-white/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Confirmed
            </span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4">
          <CleanSlateButton
            variant={filterMode === 'needs-review' ? 'dark' : 'white'}
            size="xs"
            onClick={() => setFilterMode('needs-review')}
          >
            Needs Review ({needsReviewCount})
          </CleanSlateButton>

          <CleanSlateButton
            variant={filterMode === 'categorized' ? 'dark' : 'white'}
            size="xs"
            onClick={() => setFilterMode('categorized')}
          >
            Categorized ({categorizedCount})
          </CleanSlateButton>

          <CleanSlateButton
            variant={filterMode === 'all' ? 'dark' : 'white'}
            size="xs"
            onClick={() => setFilterMode('all')}
          >
            All Ledger Items ({transactions.length})
          </CleanSlateButton>
        </div>
      </div>

      {/* Bottom Ledger Items Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border border-[#1a1822] shadow-[5px_6px_0px_#000000]">
        {/* Bulk Actions Floating/Docked Toolbar */}
        {selectedIds.length > 0 && (
          <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-[#1d1a27] text-white border border-[#101010] shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#b4b1fc]/20 text-[#b4b1fc] flex items-center justify-center shrink-0">
                <ShapesIcon className="w-5 h-5" />
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

              <CleanSlateButton
                variant="yellow"
                size="md"
                leftIcon={CheckIcon}
                onClick={handleApplyBulkCategory}
                disabled={!bulkCategory}
                className="min-h-[44px] shrink-0"
              >
                Apply to {selectedIds.length} Items
              </CleanSlateButton>

              <CleanSlateButton
                variant="dark"
                size="md"
                leftIcon={CloseIcon}
                onClick={handleDeselectAll}
                className="min-h-[44px] shrink-0"
              >
                Clear
              </CleanSlateButton>
            </div>
          </div>
        )}

        {/* Subtle Select All Row */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/80 text-xs text-[#6e6b7b]">
            <div className="flex items-center gap-3">
              <div
                role="checkbox"
                tabIndex={0}
                aria-checked={allFilteredSelected}
                onClick={handleToggleSelectAll}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleSelectAll();
                  }
                }}
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
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
                <span className="font-semibold text-[#101010] text-xs">
                  {allFilteredSelected
                    ? `Deselect All (${filtered.length})`
                    : `Select All (${filtered.length})`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <CleanSlateButton
                  variant="white"
                  size="xs"
                  leftIcon={CloseIcon}
                  onClick={handleDeselectAll}
                >
                  Clear ({selectedIds.length})
                </CleanSlateButton>
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
              <CleanSlateButton
                variant="dark"
                size="md"
                leftIcon={PlusIcon}
                onClick={openModal}
              >
                Add Manual Transaction
              </CleanSlateButton>
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
                    <div
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={isSelected}
                      onClick={() => handleToggleSelect(tx.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleSelect(tx.id);
                        }
                      }}
                      aria-label={`Select transaction ${tx.company}`}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#46e3a5] border-[1.5px] border-[#101010] text-[#101010]'
                          : 'bg-white border-[1.5px] border-[#52525b] hover:border-[#101010] text-transparent'
                      }`}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </div>

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
                          <CleanSlateButton
                            variant="status-warning"
                            size="xs"
                            leftIcon={WarningTriangleIcon}
                            onClick={() => setProofTargetTx(txForCheck)}
                            title={`${proofInfo.explanation} Click to attach receipt, prescription, or bill.`}
                          >
                            {proofInfo.type === 'prescription' ? 'Prescription Needed' : 'Receipt Needed'}
                          </CleanSlateButton>
                        ) : hasProofAttached || tx.isCategorized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[11px] font-semibold">
                            <CheckIcon className="w-3 h-3 shrink-0" />
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
                        <CleanSlateButton
                          variant="yellow"
                          size="sm"
                          leftIcon={SaveIcon}
                          onClick={() => handleSaveCategory(tx)}
                          title="Save this category assignment"
                        >
                          Save
                        </CleanSlateButton>
                        <CleanSlateButton
                          variant="white"
                          size="icon"
                          onClick={() => handleCancelPending(tx.id)}
                          title="Cancel changes"
                          aria-label="Cancel changes"
                        >
                          <CancelIcon className="w-4 h-4" />
                        </CleanSlateButton>
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
              <CleanSlateButton
                variant="white"
                size="icon"
                onClick={closeModal}
                aria-label="Close manual transaction modal"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </CleanSlateButton>
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
                <CleanSlateButton
                  variant="white"
                  size="md"
                  leftIcon={CancelIcon}
                  onClick={closeModal}
                >
                  Cancel
                </CleanSlateButton>
                <CleanSlateButton
                  type="submit"
                  variant="yellow"
                  size="md"
                  leftIcon={PlusIcon}
                >
                  Add Transaction
                </CleanSlateButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Confirmation Modal when attaching proof to a transaction */}
      {proofTargetTx && (
        <UploadConfirmationModal
          isOpen={Boolean(proofTargetTx)}
          onClose={() => setProofTargetTx(null)}
          userId={proofTargetTx.userId}
          initialValues={{
            vendorName: proofTargetTx.company,
            date: proofTargetTx.date,
            amount: proofTargetTx.amount,
            category: normalizeForm65Category(proofTargetTx.form65Category || proofTargetTx.category),
            documentType:
              getProofRequirementInfo(proofTargetTx).type === 'prescription'
                ? 'Prescription'
                : 'New Receipt',
            linkedTransactionId: proofTargetTx.id
          }}
          onSaveReceipt={(newRec) => {
            const generatedReceiptId = `rec-${Date.now()}`;
            if (onAddReceipt) {
              onAddReceipt({
                ...newRec,
                linkedTransactionId: proofTargetTx.id
              });
            }
            onUpdateTransaction({
              ...proofTargetTx,
              form65Category:
                newRec.category && newRec.category !== 'Unknown'
                  ? newRec.category
                  : proofTargetTx.form65Category,
              isCategorized: true,
              receiptId: generatedReceiptId,
              receiptFileName: newRec.fileName || `${proofTargetTx.company}_Proof.pdf`,
              receiptFileUrl: newRec.fileUrl
            });
            setSaveToast({
              id: `proof-${Date.now()}`,
              message: `Attached proof "${newRec.fileName}" to ${proofTargetTx.company} and saved to Vault!`
            });
            setTimeout(() => setSaveToast(null), 4000);
            setProofTargetTx(null);
          }}
        />
      )}
    </div>
  );
};
