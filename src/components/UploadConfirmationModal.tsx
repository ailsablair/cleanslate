import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadIcon,
  CameraIcon,
  SaveIcon,
  CloseIcon,
  ClipboardIcon,
  SparklesIcon,
  HelpCircleIcon,
  CancelIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { Receipt } from '../types';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect, SelectOption } from './FloatingSelect';
import { CameraReceiptModal } from './CameraReceiptModal';
import { FORM_65_SECTIONED_CATEGORIES, normalizeForm65Category } from '../lib/form65Categories';

export type DocumentUploadType =
  | 'New Receipt'
  | 'Prescription'
  | 'Invoice, Bill, or Purchase Order';

export interface UploadConfirmationInitialValues {
  vendorName?: string;
  date?: string;
  amount?: number | string;
  category?: string;
  notes?: string;
  documentType?: DocumentUploadType;
  linkedTransactionId?: string;
  fileName?: string;
  fileUrl?: string;
}

interface UploadConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  userId?: string;
  initialValues?: UploadConfirmationInitialValues;
}

const DOC_TYPE_OPTIONS: DocumentUploadType[] = [
  'New Receipt',
  'Prescription',
  'Invoice, Bill, or Purchase Order'
];

export const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
  isOpen,
  onClose,
  onSaveReceipt,
  userId = 'demo-user-chad-001',
  initialValues
}) => {
  const [documentType, setDocumentType] = useState<DocumentUploadType>('New Receipt');
  const [vendorName, setVendorName] = useState('');
  const [dateOfTx, setDateOfTx] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const [showNotesHelp, setShowNotesHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Reset / seed form whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDocumentType(initialValues?.documentType || 'New Receipt');
    setVendorName(initialValues?.vendorName || '');
    setDateOfTx(initialValues?.date || '');
    setAmount(
      initialValues?.amount !== undefined && initialValues?.amount !== null && initialValues?.amount !== ''
        ? String(initialValues.amount)
        : ''
    );
    setCategory(normalizeForm65Category(initialValues?.category) || '');
    setNotes(initialValues?.notes || '');
    setFileName(initialValues?.fileName || '');
    setFileUrl(initialValues?.fileUrl);
    setIsParsingFile(false);
  }, [isOpen, initialValues]);

  const handleDocumentTypeSelect = (type: DocumentUploadType) => {
    setDocumentType(type);
    if (type === 'Prescription' && !category) {
      setCategory('Prescriptions');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    if (!vendorName && baseName) {
      setVendorName(baseName);
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setFileUrl(dataUrl);

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
            if (parsed.merchant && !initialValues?.vendorName) setVendorName(parsed.merchant);
            if (parsed.date && !dateOfTx) setDateOfTx(parsed.date);
            if (typeof parsed.amount === 'number' && !amount) setAmount(String(parsed.amount));
            if (parsed.category && !category) {
              setCategory(normalizeForm65Category(parsed.category));
            }
            if (parsed.title && !notes) setNotes(parsed.title);
          }
        } catch {
          // Graceful fallback without disrupting form editing
        } finally {
          setIsParsingFile(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVendor = vendorName.trim() || `${documentType} Document`;
    const numericAmount = parseFloat(amount) || 0;
    const nowLabel =
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long' }) +
      ' at ' +
      new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const notePrefix =
      documentType !== 'New Receipt' && !notes.toLowerCase().includes(documentType.toLowerCase())
        ? `[${documentType}] `
        : '';

    onSaveReceipt({
      userId,
      title: cleanVendor,
      vendorName: cleanVendor,
      category: category || (documentType === 'Prescription' ? 'Prescriptions' : 'Unknown'),
      amount: numericAmount,
      date:
        dateOfTx.trim() ||
        new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
      uploadedAtLabel: nowLabel,
      notes: `${notePrefix}${notes.trim()}`.trim(),
      fileName: fileName || `${cleanVendor.replace(/\s+/g, '_')}_${documentType.replace(/[^a-zA-Z]/g, '')}.pdf`,
      fileUrl,
      linkedTransactionId: initialValues?.linkedTransactionId,
      linkedLineItem: category || undefined,
      reportMonth: 'September 2022'
    });

    onClose();
  };

  if (!isOpen) return null;

  const hasNotesValue = notes !== undefined && notes !== null && notes !== '';
  const isNotesFloating = isNotesFocused || hasNotesValue;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-[6px_8px_0px_#000000] my-auto relative"
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

          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#b4b1fc]/35">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#101010]">
                UPLOAD CONFIRMATION
              </h3>
              <p className="text-xs text-[#6e6b7b] leading-relaxed max-w-lg">
                Attach a receipt, prescription, or purchase order to ensure all necessary information is uploaded ready for the Licensed Insolvency Trustee (LIT).
              </p>
            </div>
            <CleanSlateButton
              variant="white"
              size="icon"
              onClick={onClose}
              aria-label="Close upload confirmation modal"
              className="!p-1.5 shrink-0"
            >
              <CloseIcon className="w-4 h-4" />
            </CleanSlateButton>
          </div>

          {/* Primary Upload / Camera Buttons */}
          <div className="mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <CleanSlateButton
                variant="yellow"
                size="md"
                fullWidth
                leftIcon={UploadIcon}
                onClick={() => fileInputRef.current?.click()}
              >
                <span>Upload Photo or Document</span>
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

            {/* Attached File / AI Parse Status Strip */}
            {(fileName || isParsingFile) && (
              <div className="mt-3.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {isParsingFile ? (
                    <SparklesIcon className="w-4 h-4 text-[#5b56d6] animate-spin shrink-0" />
                  ) : (
                    <ClipboardIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                  )}
                  <span className="font-semibold truncate">
                    {isParsingFile ? `Scanning "${fileName}" with CleanSlate AI...` : fileName}
                  </span>
                </div>
                {!isParsingFile && (
                  <CleanSlateButton
                    variant="white"
                    size="xs"
                    onClick={() => {
                      setFileName('');
                      setFileUrl(undefined);
                    }}
                    className="!p-1 shrink-0"
                    title="Remove attached file"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </CleanSlateButton>
                )}
              </div>
            )}
          </div>

          {/* Document Details & Classification Section (>= 48px below upload button UI) */}
          <div className="mt-7 pt-7 border-t border-[#b4b1fc]/45">
            <div className="space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#6e6b7b]">
                Document Type
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {DOC_TYPE_OPTIONS.map((typeOption) => {
                  const isActive = documentType === typeOption;
                  return (
                    <CleanSlateButton
                      key={typeOption}
                      variant={isActive ? 'dark' : 'white'}
                      size="xs"
                      onClick={() => handleDocumentTypeSelect(typeOption)}
                    >
                      {typeOption}
                    </CleanSlateButton>
                  );
                })}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FloatingInput
                label="Vendor Name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                helpText="Merchant, pharmacy, clinic, utility, or vendor name on the document."
              />

              <FloatingInput
                label="Date of Transaction"
                value={dateOfTx}
                onChange={(e) => setDateOfTx(e.target.value)}
                helpText="Date shown on the receipt, prescription, or invoice."
              />

              <FloatingInput
                type="number"
                step="0.01"
                prefix="$"
                label="Transaction Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                helpText="Total CAD amount paid or billed."
              />

              <FloatingSelect
                label="Category"
                value={category}
                clearable
                clearAriaLabel="Clear selected category"
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
                helpText="OSB Form 65 statutory category for Licensed Insolvency Trustee approval."
              />
            </div>

            {/* Notes Textarea with Floating Label + ? Badge */}
            <div className="relative flex items-center gap-2.5 w-full">
              <div className="relative flex-1 min-w-0">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onFocus={() => setIsNotesFocused(true)}
                  onBlur={() => setIsNotesFocused(false)}
                  style={{
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontWeight: 300,
                    color: '#101010'
                  }}
                  className={`w-full bg-white border border-[#2d2d2d] rounded-xl text-sm font-light text-[#101010] min-h-[96px] resize-none transition-all shadow-[0_2px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] focus:border-[#2d2d2d] px-3.5 ${
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
                  Notes
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
                  title="Add Rx numbers, store details, or trustee explanation"
                >
                  <HelpCircleIcon className="w-4 h-4" />
                </CleanSlateButton>
                {showNotesHelp && (
                  <div className="absolute right-0 bottom-full mb-2 z-50 w-64 p-2.5 rounded-xl bg-[#1d1a27] text-white text-xs shadow-xl border border-white/10 animate-in fade-in leading-relaxed pointer-events-none">
                    <div className="font-semibold text-[#b6b3ff] mb-0.5">Notes</div>
                    <div className="text-[11px] text-slate-300 leading-tight">
                      Include store location, prescription Rx number, or trustee approval context.
                    </div>
                    <div className="absolute right-2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1d1a27]" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
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
                leftIcon={SaveIcon}
              >
                Save to Vault
              </CleanSlateButton>
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
          setVendorName(captured.title.replace(/\s+Receipt$/i, '') || vendorName);
          if (captured.date) setDateOfTx(captured.date);
          if (captured.amount !== undefined) setAmount(String(captured.amount));
          if (captured.category) setCategory(normalizeForm65Category(captured.category));
          if (captured.fileName) setFileName(captured.fileName);
          if (captured.fileUrl) setFileUrl(captured.fileUrl);
          setIsCameraOpen(false);
        }}
      />
    </>
  );
};
