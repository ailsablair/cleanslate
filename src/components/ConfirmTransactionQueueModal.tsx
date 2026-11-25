import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadIcon,
  CameraIcon,
  CheckIcon,
  CloseIcon,
  CancelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  SparklesIcon,
  HelpCircleIcon,
  InfoCircleIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { Transaction, Receipt } from '../types';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect, SelectOption } from './FloatingSelect';
import { CameraReceiptModal } from './CameraReceiptModal';
import { DocumentUploadType } from './UploadConfirmationModal';
import { FORM_65_SECTIONED_CATEGORIES, normalizeForm65Category } from '../lib/form65Categories';
import { formatCurrency } from '../lib/formatters';
import { isProofRequiredForTransaction, getProofRequirementInfo } from '../lib/transactionUtils';

interface DraftTxState {
  vendorName: string;
  date: string;
  amount: string;
  category: string;
  notes: string;
  documentType: DocumentUploadType;
  selectedExistingReceiptId: string;
  fileName: string;
  fileUrl?: string;
}

interface ConfirmTransactionQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  receipts: Receipt[];
  initialTransactionId?: string | null;
  onConfirmTransaction: (
    updatedTx: Transaction,
    newReceipt?: Omit<Receipt, 'id'>
  ) => void;
  onQueueComplete?: (confirmedCount: number) => void;
}

const DOC_TYPE_OPTIONS: DocumentUploadType[] = [
  'New Receipt',
  'Prescription',
  'Invoice, Bill, or Purchase Order'
];

function inferDefaultDocType(tx: Transaction): DocumentUploadType {
  if (tx.documentType) return tx.documentType;
  const info = getProofRequirementInfo(tx);
  if (info.type === 'prescription') return 'Prescription';
  const cat = (tx.form65Category || tx.category || '').toLowerCase();
  if (cat.includes('child care') || cat.includes('employment') || cat.includes('rent') || cat.includes('hydro')) {
    return 'Invoice, Bill, or Purchase Order';
  }
  return 'New Receipt';
}

function getBroadCategoryForForm65(form65Category: string): string {
  const section = FORM_65_SECTIONED_CATEGORIES.find((s) =>
    s.options.some((o) => o.value === form65Category)
  );
  return section?.shortGroup || 'Categorized';
}

function buildInitialDraft(tx: Transaction): DraftTxState {
  const normalizedCat = normalizeForm65Category(tx.form65Category || '');
  return {
    vendorName: tx.company || '',
    date: tx.date || '',
    amount:
      tx.amount !== undefined && tx.amount !== null ? Number(tx.amount).toFixed(2) : '',
    category: normalizedCat,
    notes: tx.notes || '',
    documentType: inferDefaultDocType(tx),
    selectedExistingReceiptId: tx.receiptId || '',
    fileName: tx.receiptFileName || '',
    fileUrl: tx.receiptFileUrl
  };
}

export const ConfirmTransactionQueueModal: React.FC<ConfirmTransactionQueueModalProps> = ({
  isOpen,
  onClose,
  transactions,
  receipts,
  initialTransactionId,
  onConfirmTransaction,
  onQueueComplete
}) => {
  const [sessionQueueIds, setSessionQueueIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [draftsById, setDraftsById] = useState<Record<string, DraftTxState>>({});
  const [confirmedInSessionIds, setConfirmedInSessionIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isNotesFocused, setIsNotesFocused] = useState<boolean>(false);
  const [showNotesHelp, setShowNotesHelp] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot the confirmation queue whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    const needsReview = transactions.filter(
      (t) => !t.isCategorized || t.needsConfirmation
    );

    let ordered = needsReview;
    if (initialTransactionId) {
      const explicitTx = transactions.find((t) => t.id === initialTransactionId);
      if (explicitTx && !needsReview.some((t) => t.id === explicitTx.id)) {
        ordered = [explicitTx, ...needsReview];
      }
    }

    const ids = ordered.map((t) => t.id);
    const initialDrafts: Record<string, DraftTxState> = {};
    ordered.forEach((t) => {
      initialDrafts[t.id] = buildInitialDraft(t);
    });

    const startIdx = initialTransactionId
      ? Math.max(0, ids.indexOf(initialTransactionId))
      : 0;

    setSessionQueueIds(ids);
    setDraftsById(initialDrafts);
    setActiveIndex(startIdx);
    setConfirmedInSessionIds([]);
    setValidationError(null);
    setIsParsingFile(false);
    // Only re-initialize when modal transitions open -> closed -> open or explicit initialTransactionId changes while closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTransactionId]);

  const queueTransactions = useMemo(() => {
    const txMap = new Map(transactions.map((t) => [t.id, t]));
    return sessionQueueIds
      .map((id) => txMap.get(id))
      .filter((t): t is Transaction => Boolean(t));
  }, [sessionQueueIds, transactions]);

  const currentTx = queueTransactions[activeIndex] || null;
  const currentDraft: DraftTxState | null = currentTx
    ? draftsById[currentTx.id] || buildInitialDraft(currentTx)
    : null;

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

  const existingReceiptOptions: SelectOption[] = useMemo(() => {
    const sorted = [...receipts].sort((a, b) => {
      if (!currentDraft) return 0;
      const aMatch =
        a.category.toLowerCase().includes('medical') ||
        a.category.toLowerCase().includes('prescription') ||
        a.title.toLowerCase().includes(currentDraft.vendorName.toLowerCase().split(' ')[0] || '');
      const bMatch =
        b.category.toLowerCase().includes('medical') ||
        b.category.toLowerCase().includes('prescription') ||
        b.title.toLowerCase().includes(currentDraft.vendorName.toLowerCase().split(' ')[0] || '');
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
      return 0;
    });

    return [
      {
        value: '',
        label: 'None (attach new document or confirm without attachment)',
        displayLabel: 'None (no existing document selected)'
      },
      ...sorted.map((rec) => ({
        value: rec.id,
        label: `${rec.title} · ${formatCurrency(rec.amount)} (${rec.date})`,
        displayGroup: rec.category,
        displayLabel: `${rec.title} · ${formatCurrency(rec.amount)}`
      }))
    ];
  }, [receipts, currentDraft]);

  if (!isOpen || !currentTx || !currentDraft) return null;

  const updateCurrentDraft = (patch: Partial<DraftTxState>) => {
    setValidationError(null);
    setDraftsById((prev) => ({
      ...prev,
      [currentTx.id]: {
        ...(prev[currentTx.id] || buildInitialDraft(currentTx)),
        ...patch
      }
    }));
  };

  const updateDraftForId = (
    txId: string,
    txFallback: Transaction,
    updater: (existing: DraftTxState) => DraftTxState
  ) => {
    setValidationError(null);
    setDraftsById((prev) => {
      const existing = prev[txId] || buildInitialDraft(txFallback);
      return {
        ...prev,
        [txId]: updater(existing)
      };
    });
  };

  const handleSelectExistingReceipt = (receiptId: string) => {
    if (!receiptId) {
      updateCurrentDraft({
        selectedExistingReceiptId: '',
        fileName: '',
        fileUrl: undefined
      });
      return;
    }

    const found = receipts.find((r) => r.id === receiptId);
    if (!found) return;

    const normalizedRecCat = normalizeForm65Category(found.category);
    updateCurrentDraft({
      selectedExistingReceiptId: found.id,
      fileName: found.fileName || `${found.title}.pdf`,
      fileUrl: found.fileUrl,
      category:
        normalizedRecCat && normalizedRecCat !== 'Unknown'
          ? normalizedRecCat
          : currentDraft.category,
      notes: currentDraft.notes || found.notes || ''
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetTx = currentTx;
    const targetTxId = targetTx.id;

    updateDraftForId(targetTxId, targetTx, (existing) => ({
      ...existing,
      selectedExistingReceiptId: '',
      fileName: file.name
    }));

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      updateDraftForId(targetTxId, targetTx, (existing) => ({
        ...existing,
        selectedExistingReceiptId: '',
        fileName: file.name,
        fileUrl: dataUrl
      }));

      if (file.type.startsWith('image/')) {
        setIsParsingFile(true);
        try {
          const response = await fetch('/api/parse-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: dataUrl,
              mimeType: file.type || 'image/jpeg'
            })
          });
          if (response.ok) {
            const parsed = await response.json();
            updateDraftForId(targetTxId, targetTx, (existing) => ({
              ...existing,
              vendorName:
                !existing.vendorName && parsed.merchant
                  ? parsed.merchant
                  : existing.vendorName,
              date: !existing.date && parsed.date ? parsed.date : existing.date,
              amount:
                !existing.amount && typeof parsed.amount === 'number'
                  ? String(parsed.amount)
                  : existing.amount,
              category: parsed.category
                ? normalizeForm65Category(parsed.category)
                : existing.category,
              notes: existing.notes || parsed.title || '',
              fileUrl: dataUrl,
              fileName: file.name
            }));
          }
        } catch {
          // Graceful fallback without interrupting review
        } finally {
          setIsParsingFile(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmCurrent = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanVendor = currentDraft.vendorName.trim();
    const cleanCat = normalizeForm65Category(currentDraft.category);
    const parsedAmount = parseFloat(currentDraft.amount);

    if (!cleanVendor) {
      setValidationError('Please confirm the Vendor / Merchant name before saving.');
      return;
    }
    if (!cleanCat) {
      setValidationError('Please select a Form 65 category so this transaction is accurately reported.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Please enter a valid transaction amount greater than $0.00.');
      return;
    }

    const usingExistingReceipt = Boolean(currentDraft.selectedExistingReceiptId);
    const hasUploadedOrCapturedFile = Boolean(currentDraft.fileName && !usingExistingReceipt);

    let newReceiptPayload: Omit<Receipt, 'id'> | undefined;
    if (hasUploadedOrCapturedFile) {
      const nowLabel =
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long' }) +
        ' at ' +
        new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const notePrefix =
        currentDraft.documentType !== 'New Receipt' &&
        !currentDraft.notes.toLowerCase().includes(currentDraft.documentType.toLowerCase())
          ? `[${currentDraft.documentType}] `
          : '';

      newReceiptPayload = {
        userId: currentTx.userId,
        title: cleanVendor,
        vendorName: cleanVendor,
        category: cleanCat,
        amount: Number(parsedAmount.toFixed(2)),
        date: currentDraft.date.trim() || currentTx.date,
        uploadedAtLabel: nowLabel,
        notes: `${notePrefix}${currentDraft.notes.trim()}`.trim() || undefined,
        fileName: currentDraft.fileName,
        fileUrl: currentDraft.fileUrl,
        linkedTransactionId: currentTx.id,
        linkedLineItem: cleanCat,
        reportMonth: 'September 2022'
      };
    }

    const updatedTx: Transaction = {
      ...currentTx,
      company: cleanVendor,
      date: currentDraft.date.trim() || currentTx.date,
      amount: Number(parsedAmount.toFixed(2)),
      category: getBroadCategoryForForm65(cleanCat),
      form65Category: cleanCat,
      isCategorized: true,
      needsConfirmation: false,
      confidenceScore: 100,
      notes: currentDraft.notes.trim() || undefined,
      documentType: currentDraft.documentType,
      receiptId: currentDraft.selectedExistingReceiptId || currentTx.receiptId,
      receiptFileName: currentDraft.fileName || currentTx.receiptFileName,
      receiptFileUrl: currentDraft.fileUrl || currentTx.receiptFileUrl
    };

    onConfirmTransaction(updatedTx, newReceiptPayload);

    const updatedConfirmedSet = new Set(confirmedInSessionIds);
    updatedConfirmedSet.add(currentTx.id);
    setConfirmedInSessionIds(Array.from(updatedConfirmedSet));

    // Find next unconfirmed transaction in this session queue
    const nextUnconfirmedIdx = queueTransactions.findIndex(
      (t, idx) => idx > activeIndex && !updatedConfirmedSet.has(t.id)
    );
    const earlierUnconfirmedIdx = queueTransactions.findIndex(
      (t) => !updatedConfirmedSet.has(t.id)
    );

    if (nextUnconfirmedIdx !== -1) {
      setActiveIndex(nextUnconfirmedIdx);
    } else if (earlierUnconfirmedIdx !== -1) {
      setActiveIndex(earlierUnconfirmedIdx);
    } else {
      onQueueComplete?.(updatedConfirmedSet.size);
      onClose();
    }
  };

  const isPrescriptionContext =
    currentDraft.documentType === 'Prescription' ||
    currentDraft.category === 'Medical Condition Expenses' ||
    currentDraft.category === 'Prescriptions' ||
    getProofRequirementInfo({
      ...currentTx,
      company: currentDraft.vendorName,
      form65Category: currentDraft.category
    }).type === 'prescription';

  const existingDropdownLabel = isPrescriptionContext
    ? 'Or select an existing prescription....'
    : 'Or select an existing receipt or document....';

  const previewTxForCheck: Transaction = {
    ...currentTx,
    company: currentDraft.vendorName,
    form65Category: currentDraft.category
  };
  const proofNeeded = isProofRequiredForTransaction(previewTxForCheck);
  const isConfirmedThisSession = confirmedInSessionIds.includes(currentTx.id);
  const hasNotesValue = currentDraft.notes !== undefined && currentDraft.notes !== '';
  const isNotesFloating = isNotesFocused || hasNotesValue;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[6px_8px_0px_#000000] space-y-5 my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hidden file picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelected}
            className="hidden"
          />

          {/* Modal Header matching Mockup */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-[#101010]">
                  CONFIRM TRANSACTION
                </h3>
                <p className="text-xs text-[#6e6b7b] leading-relaxed mt-0.5">
                  It&apos;s important we get this right for your monthly reporting, and ultimately, your discharge from bankruptcy.
                </p>
              </div>
              {isConfirmedThisSession && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[11px] font-bold shrink-0 border border-[#101010]/20">
                  <CheckIcon className="w-3 h-3" />
                  Confirmed
                </span>
              )}
            </div>

            {(currentTx.confirmationReason || proofNeeded) && (
              <div className="mt-2 px-3.5 py-2 rounded-xl bg-[#fbf9f5] border border-[#b4b1fc] text-[11px] text-[#34314C] flex items-start gap-2 leading-snug">
                <InfoCircleIcon className="w-4 h-4 text-[#6366f1] shrink-0 mt-0.5" />
                <span>
                  {currentTx.confirmationReason ||
                    'Verify category and attach supporting proof so eligible non-discretionary deductions protect your monthly earnings.'}
                </span>
              </div>
            )}
          </div>

          {/* Primary Upload / Camera Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <CleanSlateButton
              variant="yellow"
              size="md"
              fullWidth
              leftIcon={UploadIcon}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo or Document
            </CleanSlateButton>

            <CleanSlateButton
              variant="dark-yellow"
              size="md"
              fullWidth
              leftIcon={CameraIcon}
              onClick={() => setIsCameraOpen(true)}
            >
              <span>
                <span className="font-bold">Take Photo</span>{' '}
                <span className="font-normal opacity-90">(AI Scan)</span>
              </span>
            </CleanSlateButton>
          </div>

          {/* Existing Receipt / Prescription Vault Selector */}
          <FloatingSelect
            label={existingDropdownLabel}
            value={currentDraft.selectedExistingReceiptId}
            clearable
            clearAriaLabel="Clear linked vault document"
            onChange={(e) => handleSelectExistingReceipt(e.target.value)}
            options={existingReceiptOptions}
            helpText="Select a prescription, receipt, or invoice already stored in your Receipts Vault to link it to this transaction."
          />

          {/* Attached File / AI Scan Strip */}
          {(currentDraft.fileName || isParsingFile) && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isParsingFile ? (
                  <SparklesIcon className="w-4 h-4 text-[#5b56d6] animate-spin shrink-0" />
                ) : (
                  <ClipboardIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
                <span className="font-semibold truncate">
                  {isParsingFile
                    ? `Scanning "${currentDraft.fileName}" with CleanSlate AI...`
                    : currentDraft.fileName}
                </span>
              </div>
              {!isParsingFile && (
                <CleanSlateButton
                  variant="white"
                  size="xs"
                  onClick={() =>
                    updateCurrentDraft({
                      selectedExistingReceiptId: '',
                      fileName: '',
                      fileUrl: undefined
                    })
                  }
                  className="!p-1 shrink-0"
                  title="Remove attached file"
                  aria-label="Remove attached file"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </CleanSlateButton>
              )}
            </div>
          )}

          {/* Document Classification & Transaction Details Section */}
          <div className="pt-5 border-t border-[#b4b1fc]/45 space-y-4">
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6e6b7b]">
                Document Type
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {DOC_TYPE_OPTIONS.map((typeOption) => {
                  const isActive = currentDraft.documentType === typeOption;
                  return (
                    <CleanSlateButton
                      key={typeOption}
                      variant={isActive ? 'dark' : 'white'}
                      size="xs"
                      onClick={() => {
                        const patch: Partial<DraftTxState> = { documentType: typeOption };
                        if (typeOption === 'Prescription' && !currentDraft.category) {
                          patch.category = 'Medical Condition Expenses';
                        }
                        updateCurrentDraft(patch);
                      }}
                    >
                      {typeOption}
                    </CleanSlateButton>
                  );
                })}
              </div>
            </div>

            {/* Transaction Confirmation Form */}
            <form onSubmit={handleConfirmCurrent} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FloatingInput
                label="Merchant / Vendor Name"
                value={currentDraft.vendorName}
                onChange={(e) => updateCurrentDraft({ vendorName: e.target.value })}
                helpText="Clean up or confirm the vendor name from your bank feed (e.g., Shopper's Drug Mart)."
              />

              <FloatingInput
                label="Transaction Date"
                value={currentDraft.date}
                onChange={(e) => updateCurrentDraft({ date: e.target.value })}
                helpText="Confirm the transaction date for accurate monthly Form 65 reporting."
              />

              <FloatingInput
                type="number"
                step="0.01"
                prefix="$"
                label="Transaction Amount"
                value={currentDraft.amount}
                onChange={(e) => updateCurrentDraft({ amount: e.target.value })}
                helpText="Exact CAD dollar amount. Non-discretionary expenses reduce surplus income obligations."
              />

              <FloatingSelect
                label="Form 65 Category"
                value={currentDraft.category}
                clearable
                clearAriaLabel="Clear Form 65 category"
                onChange={(e) => updateCurrentDraft({ category: e.target.value })}
                options={categoryOptions}
                helpText="Confirm the statutory Form 65 line. Claiming eligible Non-Discretionary Medical Condition, Child Care, or Employment Expenses helps you retain more of your earnings."
              />
            </div>

            {/* Notes Textarea with Floating Label + ? Badge */}
            <div className="relative flex items-center gap-2.5 w-full">
              <div className="relative flex-1 min-w-0">
                <textarea
                  rows={3}
                  value={currentDraft.notes}
                  onChange={(e) => updateCurrentDraft({ notes: e.target.value })}
                  onFocus={() => setIsNotesFocused(true)}
                  onBlur={() => setIsNotesFocused(false)}
                  style={{
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontWeight: 300,
                    color: '#101010'
                  }}
                  className={`w-full bg-white border border-[#2d2d2d] rounded-xl text-sm font-light text-[#101010] min-h-[92px] resize-none transition-all shadow-[0_2px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] focus:border-[#2d2d2d] px-3.5 ${
                    isNotesFloating ? 'pt-6 pb-2' : 'py-3.5'
                  }`}
                />
                <label
                  className={`absolute pointer-events-none transition-all duration-150 select-none left-3.5 ${
                    isNotesFloating
                      ? 'top-2 text-[10px] leading-tight font-semibold italic text-[#7a8288]'
                      : 'top-3.5 text-sm text-[#767676] italic font-light'
                  }`}
                  style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                >
                  {isPrescriptionContext
                    ? 'Notes (e.g. Monthly prescription details for LIT)'
                    : 'Notes (context or justification for your LIT)'}
                </label>
              </div>

              <div className="relative shrink-0">
                <CleanSlateButton
                  variant="periwinkle"
                  size="icon"
                  onMouseEnter={() => setShowNotesHelp(true)}
                  onMouseLeave={() => setShowNotesHelp(false)}
                  onFocus={() => setShowNotesHelp(true)}
                  onBlur={() => setShowNotesHelp(false)}
                  className="!p-1.5 cursor-help"
                  aria-label="Help information for Notes"
                  title="Explain why this expense is necessary or non-discretionary"
                >
                  <HelpCircleIcon className="w-4 h-4" />
                </CleanSlateButton>
                {showNotesHelp && (
                  <div className="absolute right-0 bottom-full mb-2 z-50 w-64 p-2.5 rounded-xl bg-[#1d1a27] text-white text-xs shadow-xl border border-white/10 animate-in fade-in leading-relaxed pointer-events-none">
                    <div className="font-semibold text-[#b6b3ff] mb-0.5">Transaction Notes</div>
                    <div className="text-[11px] text-slate-300 leading-tight">
                      Add short context (e.g. prescription purpose, work requirement, or split details) so your trustee approves the deduction without delay.
                    </div>
                    <div className="absolute right-2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1d1a27]" />
                  </div>
                )}
              </div>
            </div>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
                {validationError}
              </div>
            )}

            {/* Footer: Queue Stepper (< 1 of N >) on left + Cancel / Confirm Details on right */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2.5">
                <CleanSlateButton
                  variant="white"
                  size="icon"
                  onClick={() => {
                    setValidationError(null);
                    setActiveIndex((idx) => Math.max(0, idx - 1));
                  }}
                  disabled={activeIndex <= 0}
                  aria-label="Previous transaction in confirm queue"
                  title="Previous transaction"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </CleanSlateButton>

                <span className="text-xs sm:text-sm font-extrabold text-[#101010] tabular-nums px-1 whitespace-nowrap">
                  {activeIndex + 1} of {queueTransactions.length}
                </span>

                <CleanSlateButton
                  variant="white"
                  size="icon"
                  onClick={() => {
                    setValidationError(null);
                    setActiveIndex((idx) =>
                      Math.min(queueTransactions.length - 1, idx + 1)
                    );
                  }}
                  disabled={activeIndex >= queueTransactions.length - 1}
                  aria-label="Next transaction in confirm queue"
                  title="Next transaction"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </CleanSlateButton>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <CleanSlateButton
                  variant="white"
                  size="md"
                  leftIcon={CancelIcon}
                  onClick={onClose}
                >
                  Cancel
                </CleanSlateButton>
                <CleanSlateButton
                  variant="dark-yellow"
                  type="submit"
                  size="md"
                  leftIcon={CheckIcon}
                >
                  Confirm Details
                </CleanSlateButton>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>

      {/* Camera AI Scan Modal */}
      <CameraReceiptModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onReceiptCaptured={(captured) => {
          updateCurrentDraft({
            selectedExistingReceiptId: '',
            vendorName:
              captured.title.replace(/\s+Receipt$/i, '') || currentDraft.vendorName,
            date: captured.date || currentDraft.date,
            amount:
              captured.amount !== undefined
                ? String(captured.amount)
                : currentDraft.amount,
            category: captured.category
              ? normalizeForm65Category(captured.category)
              : currentDraft.category,
            fileName: captured.fileName || 'Camera_Scan_Proof.jpg',
            fileUrl: captured.fileUrl
          });
          setIsCameraOpen(false);
        }}
      />
    </>
  );
};
