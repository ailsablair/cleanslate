import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Receipt as ReceiptIcon,
  Upload,
  Trash2,
  CheckCircle2,
  Camera,
  ShieldCheck,
  Download,
  History,
  Save,
  Sparkles,
  X,
  Plus,
  FileText
} from 'lucide-react';
import { Receipt, UserProfile, MonthlyReport } from '../types';
import { CameraReceiptModal } from './CameraReceiptModal';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect, SelectOption } from './FloatingSelect';
import { FORM_65_SECTIONED_CATEGORIES } from './CategorizeView';
import { formatCurrency } from '../lib/formatters';
import { generateLITAuditPacketPDF } from '../lib/pdfAuditPacketGenerator';

interface ReceiptsViewProps {
  receipts: Receipt[];
  onAddReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  onUpdateReceipt?: (receipt: Receipt) => void;
  onDeleteReceipt: (id: string) => void;
  profile?: UserProfile;
  monthlyReports?: MonthlyReport[];
  isUploadModalOpen?: boolean;
  onCloseUploadModal?: () => void;
  onOpenUploadModal?: () => void;
}

const RECEIPT_LEGACY_CATEGORY_MAP: Record<string, string> = {
  'Expenses as a condition of employment': 'Employment Expenses',
  'Expenses as Condition of Employment': 'Employment Expenses',
  'Employment-Related Mandatory Expenses': 'Employment Expenses',
  'Spousal / Child Support': 'Child Support Payments',
  'Food & Grocery': 'Food/Grocery',
  'Housing & Utilities': 'Rent/Mortgage',
  'Dining Out / Takeout': 'Dining/Lunches/Restaurants',
  'Non-Recoverable Prescriptions': 'Prescriptions',
  'Repair, Maintenance & Gas': 'Repair/Maintenance/Gas',
  'Transportation': 'Repair/Maintenance/Gas'
};

function normalizeReceiptCategory(cat?: string): string {
  if (!cat) return '';
  return RECEIPT_LEGACY_CATEGORY_MAP[cat] || cat;
}

function deriveVendorFromTitle(rec: Receipt): string {
  if (rec.vendorName && rec.vendorName.trim()) return rec.vendorName;
  const parts = rec.title.split(' - ');
  if (parts.length > 1 && parts[0].trim()) {
    return parts[0].trim();
  }
  return rec.title || 'UNCATEGORIZED';
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts,
  onAddReceipt,
  onUpdateReceipt,
  onDeleteReceipt,
  profile,
  monthlyReports = [],
  isUploadModalOpen = false,
  onCloseUploadModal,
  onOpenUploadModal
}) => {
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    receipts[0]?.id || null
  );
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [internalUploadModalOpen, setInternalUploadModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingUpload, setIsParsingUpload] = useState(false);
  const [isExportingAudit, setIsExportingAudit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected receipt editable details form
  const [formVendor, setFormVendor] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const [showNotesHelp, setShowNotesHelp] = useState(false);

  // Manual upload modal fields
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('Medical Condition Expenses');
  const [modalAmount, setModalAmount] = useState('85.00');
  const [modalDate, setModalDate] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  );
  const [modalNotes, setModalNotes] = useState('');
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileUrl, setModalFileUrl] = useState<string | undefined>(undefined);

  const directFileInputRef = useRef<HTMLInputElement>(null);
  const prevReceiptsLengthRef = useRef(receipts.length);

  const uploadModalVisible = isUploadModalOpen || internalUploadModalOpen;

  const closeUploadModal = () => {
    setInternalUploadModalOpen(false);
    if (onCloseUploadModal) onCloseUploadModal();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto-select newest receipt when a new upload is added
  useEffect(() => {
    if (receipts.length > prevReceiptsLengthRef.current && receipts[0]) {
      setSelectedReceiptId(receipts[0].id);
    } else if (receipts.length > 0 && !receipts.some((r) => r.id === selectedReceiptId)) {
      setSelectedReceiptId(receipts[0].id);
    } else if (receipts.length === 0) {
      setSelectedReceiptId(null);
    }
    prevReceiptsLengthRef.current = receipts.length;
  }, [receipts, selectedReceiptId]);

  const selectedReceipt = useMemo(
    () => receipts.find((r) => r.id === selectedReceiptId) || receipts[0] || null,
    [receipts, selectedReceiptId]
  );

  // Populate editor fields whenever selected receipt changes
  useEffect(() => {
    if (!selectedReceipt) return;
    setFormVendor(deriveVendorFromTitle(selectedReceipt));
    setFormDate(selectedReceipt.date || '');
    setFormAmount(
      selectedReceipt.amount !== undefined && selectedReceipt.amount !== null
        ? String(selectedReceipt.amount)
        : ''
    );
    setFormCategory(normalizeReceiptCategory(selectedReceipt.category));
    setFormNotes(
      selectedReceipt.notes !== undefined
        ? selectedReceipt.notes
        : selectedReceipt.title !== deriveVendorFromTitle(selectedReceipt)
        ? selectedReceipt.title
        : ''
    );
  }, [selectedReceipt]);

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

  // Process direct file upload or drag-and-drop with AI extraction fallback
  const processUploadedFile = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const nowLabel = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long'
      }) + ' at ' + new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

      let parsedMerchant = baseName || 'Uploaded Receipt';
      let parsedCategory = '';
      let parsedAmount = 0;
      let parsedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      let parsedNotes = `Uploaded file: ${file.name}`;

      if (file.type.startsWith('image/')) {
        setIsParsingUpload(true);
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
            const data = await response.json();
            if (data.merchant) parsedMerchant = data.merchant;
            if (data.category) parsedCategory = normalizeReceiptCategory(data.category);
            if (typeof data.amount === 'number') parsedAmount = data.amount;
            if (data.date) parsedDate = data.date;
            if (data.title) parsedNotes = data.title;
          }
        } catch {
          // Graceful fallback using filename heuristics
        } finally {
          setIsParsingUpload(false);
        }
      }

      onAddReceipt({
        userId: profile?.uid || 'demo-user-chad-001',
        title: parsedMerchant,
        vendorName: parsedMerchant,
        category: parsedCategory || 'Unknown',
        amount: parsedAmount,
        date: parsedDate,
        uploadedAtLabel: nowLabel,
        notes: parsedNotes,
        fileUrl: dataUrl,
        fileName: file.name,
        reportMonth: 'September 2022'
      });

      showToast(`Uploaded "${file.name}" to your vault. Review details on the right and click Save Details.`);
    };
    reader.readAsDataURL(file);
  };

  const handleDirectFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt) return;

    const cleanVendor = formVendor.trim() || selectedReceipt.title || 'UNCATEGORIZED';
    const numericAmount = parseFloat(formAmount) || 0;
    const updated: Receipt = {
      ...selectedReceipt,
      vendorName: cleanVendor,
      title: cleanVendor,
      date: formDate.trim() || selectedReceipt.date,
      amount: numericAmount,
      category: formCategory || 'Unknown',
      notes: formNotes.trim()
    };

    if (onUpdateReceipt) {
      onUpdateReceipt(updated);
    }
    showToast(`Saved details for ${cleanVendor}!`);
  };

  const handleModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModalFileName(file.name);
      if (!modalTitle) {
        setModalTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = modalTitle.trim() || 'Expense Proof';
    const nowLabel = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long'
    }) + ' at ' + new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    onAddReceipt({
      userId: profile?.uid || 'demo-user-chad-001',
      title: vendor,
      vendorName: vendor,
      category: normalizeReceiptCategory(modalCategory) || 'Medical Condition Expenses',
      amount: parseFloat(modalAmount) || 0,
      date: modalDate.trim() || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      uploadedAtLabel: nowLabel,
      notes: modalNotes.trim(),
      fileName: modalFileName || 'Proof_Document.pdf',
      fileUrl: modalFileUrl,
      reportMonth: 'September 2022'
    });

    closeUploadModal();
    setModalTitle('');
    setModalAmount('85.00');
    setModalNotes('');
    setModalFileName('');
    setModalFileUrl(undefined);
    showToast(`Added "${vendor}" to your receipt vault.`);
  };

  const handleExportAuditPacket = () => {
    if (!profile) return;
    setIsExportingAudit(true);
    try {
      generateLITAuditPacketPDF({
        profile,
        reports: monthlyReports,
        receipts
      });
      showToast('Complete OSB Audit Packet PDF dossier downloaded!');
    } catch (err) {
      console.error('Audit export error:', err);
    } finally {
      setIsExportingAudit(false);
    }
  };

  const hasNotesValue = formNotes !== undefined && formNotes !== null && formNotes !== '';
  const isNotesFloating = isNotesFocused || hasNotesValue;

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* Hidden Direct File Input for Dropzone */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleDirectFileInputChange}
        className="hidden"
      />

      {toastMessage && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* EMPTY STATE — Matches receipts-empty-state_01116c90.png */}
      {receipts.length === 0 ? (
        <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border border-[#1a1822] shadow-[5px_6px_0px_#000000] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <ReceiptIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
                  RECEIPTS &amp; PRESCRIPTIONS
                </h2>
              </div>
              <p className="text-xs text-[#4b4856] max-w-xl leading-relaxed">
                Encrypted digital document storage linking prescriptions, childcare invoices, and court orders directly to Form 65 lines for your Licensed Insolvency Trustee.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border border-black shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 shrink-0 self-start cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 text-[#1d1a27]" />
              <span>
                <span className="font-extrabold">Take Photo</span>{' '}
                <span className="font-normal">(AI Scan)</span>
              </span>
            </button>
          </div>

          <div
            onClick={() => directFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-[#b6c0fb] rounded-2xl p-4 sm:p-5 transition cursor-pointer ${
              isDragging ? 'ring-2 ring-[#101010]' : ''
            }`}
          >
            <div className="border border-dashed border-[#242031]/55 rounded-xl py-14 sm:py-16 flex flex-col items-center justify-center gap-2.5 hover:bg-white/15 transition">
              <Upload className="w-5 h-5 text-[#1d1a27]" />
              <span className="text-xs sm:text-sm font-bold text-[#101010]">
                {isParsingUpload ? 'Parsing Receipt with AI...' : 'Upload Receipt'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* POPULATED STATE — Matches receipts-filled_b78bebe1.png & receipts_1dff74b1.png */
        <>
          {/* Top Periwinkle Upload Dropzone */}
          <div
            onClick={() => directFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`bg-[#b6c0fb] rounded-3xl p-4 border border-[#1a1822] shadow-[4px_5px_0px_#000000] transition cursor-pointer ${
              isDragging ? 'ring-2 ring-[#F9F45D]' : ''
            }`}
          >
            <div className="border border-dashed border-[#242031]/55 rounded-2xl py-8 sm:py-10 flex flex-col items-center justify-center gap-2 hover:bg-white/15 transition">
              <Upload className="w-5 h-5 text-[#1d1a27]" />
              <span className="text-xs sm:text-sm font-bold text-[#101010]">
                {isParsingUpload ? 'Analyzing Receipt with CleanSlate AI...' : 'Upload Receipt'}
              </span>
            </div>
          </div>

          {/* Main 2-Column Split: PAST UPLOADS + Receipt Preview & Editable Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: PAST UPLOADS */}
            <div className="lg:col-span-4 bg-white text-[#101010] rounded-3xl border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] overflow-hidden flex flex-col">
              <div className="px-5 pt-5 pb-3.5 flex items-center justify-between gap-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#8c93fc] shrink-0" />
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                    PAST UPLOADS
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] border border-black shadow-[2px_2px_0px_#000000] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
                  title="Take photo of receipt with AI scan"
                >
                  <Camera className="w-3 h-3" />
                  <span>AI Scan</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
                {receipts.map((rec) => {
                  const isActive = selectedReceipt?.id === rec.id;
                  const displayVendor = deriveVendorFromTitle(rec);
                  const displayCat = normalizeReceiptCategory(rec.category) || 'Unknown';
                  const uploadTimestamp = rec.uploadedAtLabel || rec.date;

                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setSelectedReceiptId(rec.id)}
                      className={`w-full text-left px-5 py-3.5 flex items-start justify-between gap-3 transition relative cursor-pointer ${
                        isActive ? 'bg-[#f7f4eb]' : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-[#4b4856] rounded-r"
                        />
                      )}
                      <div className="min-w-0 flex-1 pl-1">
                        <div className="text-xs font-extrabold uppercase tracking-wide text-[#101010] truncate">
                          {displayVendor}
                        </div>
                        <div className="text-[10px] text-[#767676] mt-0.5 tabular-nums truncate">
                          Uploaded {uploadTimestamp}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#767676] shrink-0 text-right max-w-[115px] truncate pt-0.5">
                        {displayCat}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Compact Compliance & Audit Footer */}
              <div className="px-5 py-3 bg-[#fbf9f5] border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsComplianceModalOpen(true)}
                  className="text-[#4b4856] hover:text-[#101010] font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PIPEDA Safeguards</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAuditPacket}
                  disabled={isExportingAudit}
                  className="text-[#5b56d6] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-3 h-3" />
                  <span>{isExportingAudit ? 'Exporting...' : 'Audit Packet PDF'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Receipt Document Preview + Editable Details Form */}
            {selectedReceipt && (
              <div className="lg:col-span-8 bg-white text-[#101010] rounded-3xl border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] overflow-hidden flex flex-col">
                {/* Top Preview Area */}
                <div className="bg-white px-5 sm:px-8 pt-6 pb-4 flex items-center justify-center min-h-[290px] max-h-[380px] overflow-hidden">
                  {selectedReceipt.fileUrl && selectedReceipt.fileUrl.startsWith('data:image') ? (
                    <img
                      src={selectedReceipt.fileUrl}
                      alt={selectedReceipt.title}
                      className="max-h-[340px] w-auto max-w-full object-contain border border-slate-300 shadow-xs"
                    />
                  ) : selectedReceipt.fileUrl && selectedReceipt.fileUrl.startsWith('data:application/pdf') ? (
                    <div className="w-full max-w-md border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                      <iframe
                        src={selectedReceipt.fileUrl}
                        title={selectedReceipt.title}
                        className="w-full h-[320px]"
                      />
                    </div>
                  ) : (
                    /* Crisp Authentic Paper Receipt Sheet for PDF / Text / Seeded Records */
                    <div className="w-full max-w-[340px] border border-[#2d2d2d]/45 bg-white px-6 py-6 shadow-xs font-mono text-xs text-[#101010] space-y-3">
                      <div className="text-center space-y-1">
                        <div className="w-9 h-9 rounded-full bg-[#101010] text-white flex items-center justify-center mx-auto mb-2">
                          <ReceiptIcon className="w-4 h-4" />
                        </div>
                        <div className="font-extrabold text-sm uppercase tracking-wide">
                          {formVendor || deriveVendorFromTitle(selectedReceipt)}
                        </div>
                        <div className="text-[11px] text-[#4b4856]">
                          Ref #{selectedReceipt.id.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-[#4b4856]">
                          {selectedReceipt.fileName || 'Verified_Proof_Document.pdf'}
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 text-[11px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-[#4b4856]">Date:</span>
                          <span className="font-semibold tabular-nums">
                            {formDate || selectedReceipt.date}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#4b4856]">Form 65 Line:</span>
                          <span className="font-semibold text-right truncate max-w-[180px]">
                            {formCategory || normalizeReceiptCategory(selectedReceipt.category)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#4b4856]">Filing Period:</span>
                          <span className="font-semibold">
                            {selectedReceipt.reportMonth || 'September 2022'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-3 flex items-baseline justify-between">
                        <span className="font-bold uppercase">Total Paid (CAD)</span>
                        <span className="text-sm font-extrabold tabular-nums">
                          {formatCurrency(parseFloat(formAmount) || 0)}
                        </span>
                      </div>

                      <div className="pt-1 text-[10px] text-center text-[#767676] uppercase tracking-wider">
                        AES-256 Encrypted Statutory Vault Copy
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Warm Cream Editable Form */}
                <form
                  onSubmit={handleSaveDetails}
                  className="bg-[#f7f4eb] border-t border-[#2d2d2d]/15 p-5 sm:p-6 space-y-3.5"
                >
                  <p className="text-xs font-medium text-[#101010] flex items-center gap-2">
                    {isParsingUpload && (
                      <Sparkles className="w-3.5 h-3.5 text-[#5b56d6] animate-spin shrink-0" />
                    )}
                    <span>
                      CleanSlate AI automatically pulls information from your uploaded receipt. You may need to edit some of the information below.
                    </span>
                  </p>

                  {/* 2x2 Input Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <FloatingInput
                      label="Vendor Name"
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      helpText="Merchant, pharmacy, clinic, or childcare provider printed on the receipt."
                    />

                    <FloatingInput
                      label="Date of Transaction"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      helpText="Transaction date matching your bank statement and Form 65 filing period."
                    />

                    <FloatingInput
                      type="number"
                      step="0.01"
                      prefix="$"
                      label="Transaction Amount"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      helpText="Total CAD amount paid including applicable taxes."
                    />

                    <FloatingSelect
                      label="Category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      options={categoryOptions}
                      helpText="OSB Form 65 statutory category verified by your Licensed Insolvency Trustee."
                    />
                  </div>

                  {/* Full-width Notes Textarea matching FloatingInput + ? Help Badge */}
                  <div className="relative flex items-center gap-2.5 w-full">
                    <div className="relative flex-1 min-w-0">
                      <textarea
                        rows={2}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        onFocus={() => setIsNotesFocused(true)}
                        onBlur={() => setIsNotesFocused(false)}
                        style={{
                          fontFamily: "'Google Sans Flex', sans-serif",
                          fontWeight: 300,
                          color: '#101010'
                        }}
                        className={`w-full bg-white border border-[#2d2d2d] rounded-xl text-sm font-light text-[#101010] min-h-[76px] resize-none transition-all shadow-[0_2px_0_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-[#b4b1fc] focus:border-[#2d2d2d] px-3.5 ${
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
                        title="Store details, Rx prescription notes, or trustee context"
                      >
                        ?
                      </button>
                      {showNotesHelp && (
                        <div className="absolute right-0 bottom-full mb-2 z-50 w-64 p-2.5 rounded-xl bg-[#1d1a27] text-white text-xs shadow-xl border border-white/10 animate-in fade-in leading-relaxed pointer-events-none">
                          <div className="font-semibold text-[#b6b3ff] mb-0.5">Notes</div>
                          <div className="text-[11px] text-slate-300 leading-tight">
                            Add store location, prescription reference, or compliance explanation for your trustee.
                          </div>
                          <div className="absolute right-2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1d1a27]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => onDeleteReceipt(selectedReceipt.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Receipt</span>
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border border-black shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Details</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload / Scan Modal triggered from Header "+ Upload Receipt" */}
      {uploadModalVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={closeUploadModal}
        >
          <div
            className="bg-[#fbf9f5] text-[#101010] border border-[#1a1822] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-[6px_8px_0px_#000000] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                  Upload Expense Proof or Prescription
                </h3>
                <p className="text-xs text-[#6e6b7b] mt-0.5">
                  Attach a receipt file or take a photo with CleanSlate AI extraction.
                </p>
              </div>
              <button
                type="button"
                onClick={closeUploadModal}
                className="p-2 rounded-xl hover:bg-slate-200/70 text-[#6e6b7b] hover:text-[#101010] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  closeUploadModal();
                  setIsCameraOpen(true);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-bold border border-black shadow-[2px_3px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Camera className="w-3.5 h-3.5 text-[#fbf050]" />
                <span>Take Photo (AI Scan)</span>
              </button>
              <label
                htmlFor="modal-receipt-file-input"
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#b6c0fb] hover:brightness-105 text-[#101010] text-xs font-bold border border-[#101010] shadow-[2px_3px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{modalFileName ? 'Change File' : 'Browse Image / PDF'}</span>
              </label>
              <input
                id="modal-receipt-file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={handleModalFileChange}
                className="hidden"
              />
            </div>

            {modalFileName && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">{modalFileName}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-3.5">
              <FloatingInput
                label="Vendor Name"
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FloatingInput
                  type="number"
                  step="0.01"
                  prefix="$"
                  label="Transaction Amount"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  required
                />
                <FloatingInput
                  label="Date of Transaction"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  required
                />
              </div>

              <FloatingSelect
                label="Category"
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                options={categoryOptions}
              />

              <FloatingInput
                label="Notes (Optional)"
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="px-4 py-2 rounded-xl border border-[#2d2d2d] bg-white hover:bg-slate-50 text-xs font-semibold text-[#101010] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border border-black shadow-[3px_4px_0px_#000000] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save to Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compliance & Security Safeguards Modal */}
      {isComplianceModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsComplianceModalOpen(false)}
        >
          <div
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Statutory Privacy &amp; Health Compliance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="font-bold text-white block">PIPEDA &amp; Health Information Act Compliance</span>
                <p className="text-[11px] text-slate-400">
                  Under the Personal Information Protection and Electronic Documents Act (PIPEDA) and provincial health protection legislation, medical prescriptions and clinic receipts contain sensitive protected health information (PHI). They are strictly segregated from commercial spending ledgers.
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="font-bold text-white block">Client-Side Enclave Protection</span>
                <p className="text-[11px] text-slate-400">
                  Uploaded files are sanitized to mask unnecessary medical diagnoses or Social Insurance Numbers (SIN) before transmitting to your Licensed Insolvency Trustee solely to substantiate Section 68 non-discretionary surplus deductions.
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="font-bold text-white block">Statutory BIA Section 68 Privilege</span>
                <p className="text-[11px] text-slate-400">
                  Only your designated Licensed Insolvency Trustee and the Office of the Superintendent of Bankruptcy (OSB) have regulatory clearance to inspect these documents during court audit cycles.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#b6b3ff] text-[#242031] font-bold text-xs hover:bg-white transition cursor-pointer"
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Receipt Modal */}
      <CameraReceiptModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onReceiptCaptured={(newRec) => {
          onAddReceipt({
            ...newRec,
            vendorName: newRec.title.replace(/\s+Receipt$/i, ''),
            category: normalizeReceiptCategory(newRec.category) || newRec.category,
            uploadedAtLabel:
              new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long' }) +
              ' at ' +
              new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          });
          setIsCameraOpen(false);
          showToast('AI scanned receipt saved to Past Uploads!');
        }}
      />
    </div>
  );
};
