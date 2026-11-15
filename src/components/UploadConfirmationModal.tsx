import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Upload, Camera, Save, X, FileText, Sparkles } from 'lucide-react';
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
          className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-[6px_8px_0px_#000000] space-y-5 my-auto relative"
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
            <button
              type="button"
              onClick={onClose}
              aria-label="Close upload confirmation modal"
              className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Primary Upload / Camera Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-4 h-4 stroke-[2.2]" />
              <span>Upload Photo or Document</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-[#46e3a5] border-[1.5px] border-[#46e3a5] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 text-xs cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4 text-[#46e3a5]" />
              <span>
                <span className="font-bold">Take Photo</span>{' '}
                <span className="font-normal opacity-90">(AI Scan)</span>
              </span>
            </button>
          </div>

          {/* Attached File / AI Parse Status Strip */}
          {(fileName || isParsingFile) && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isParsingFile ? (
                  <Sparkles className="w-4 h-4 text-[#5b56d6] animate-spin shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
                <span className="font-semibold truncate">
                  {isParsingFile ? `Scanning "${fileName}" with CleanSlate AI...` : fileName}
                </span>
              </div>
              {!isParsingFile && (
                <button
                  type="button"
                  onClick={() => {
                    setFileName('');
                    setFileUrl(undefined);
                  }}
                  className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer shrink-0"
                  title="Remove attached file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Segmented Document Type Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {DOC_TYPE_OPTIONS.map((typeOption) => {
              const isActive = documentType === typeOption;
              return (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => handleDocumentTypeSelect(typeOption)}
                  className={`px-4 py-1.5 rounded-full text-xs transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#242031] text-white font-bold border border-[#242031]'
                      : 'bg-white hover:bg-slate-50 text-[#101010] font-semibold border border-[#767676]'
                  }`}
                >
                  {typeOption}
                </button>
              );
            })}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                <button
                  type="button"
                  onMouseEnter={() => setShowNotesHelp(true)}
                  onMouseLeave={() => setShowNotesHelp(false)}
                  onFocus={() => setShowNotesHelp(true)}
                  onBlur={() => setShowNotesHelp(false)}
                  className="w-6 h-6 rounded-full bg-[#9da2ea] hover:bg-[#8b91e5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs transition active:scale-95 cursor-help select-none"
                  aria-label="Help information for Notes"
                  title="Add Rx numbers, store details, or trustee explanation"
                >
                  ?
                </button>
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
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#101010] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-white text-xs font-bold border-[1.5px] border-[#F9F45D] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#F9F45D]" />
                <span>Save to Vault</span>
              </button>
            </div>
          </form>
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
