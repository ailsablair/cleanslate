import React, { useState } from 'react';
import { 
  Receipt as ReceiptIcon, 
  Upload, 
  Trash2, 
  Eye, 
  FileCheck, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Camera, 
  ShieldCheck, 
  Lock, 
  Info, 
  FileLock2, 
  AlertCircle 
} from 'lucide-react';
import { Receipt } from '../types';
import { CameraReceiptModal } from './CameraReceiptModal';
import { FloatingInput } from './FloatingInput';

interface ReceiptsViewProps {
  receipts: Receipt[];
  onAddReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  onDeleteReceipt: (id: string) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts,
  onAddReceipt,
  onDeleteReceipt
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'medical' | 'general'>('all');

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical Condition Expenses');
  const [privacyClassification, setPrivacyClassification] = useState<'PHI' | 'Statutory' | 'General'>('PHI');
  const [amount, setAmount] = useState<number>(85.00);
  const [linkedLineItem, setLinkedLineItem] = useState('medicalConditionExpenses');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReceipt({
      userId: 'demo-user-chad-001',
      title: title || (privacyClassification === 'PHI' ? 'Prescription Health Proof' : 'Expense Proof'),
      category,
      amount: amount || 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      fileName: fileName || (privacyClassification === 'PHI' ? 'Encrypted_Prescription.pdf' : 'Expense_Proof.pdf'),
      linkedLineItem,
      reportMonth: 'September 2022'
    });
    setIsUploadOpen(false);
    setTitle('');
    setFileName('');
  };

  const filteredReceipts = receipts.filter(r => {
    const isMedical = r.category.toLowerCase().includes('medical') || r.title.toLowerCase().includes('prescription') || r.title.toLowerCase().includes('pharmacy');
    if (activeTab === 'medical') return isMedical;
    if (activeTab === 'general') return !isMedical;
    return true;
  });

  const totalVaultAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const medicalTotal = receipts.filter(r => r.category.toLowerCase().includes('medical')).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Vault Overview Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-[#242031] shrink-0" />
              <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-slate-900 whitespace-nowrap">
                Statutory Receipt Vault
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Encrypted digital document storage linking prescriptions, childcare invoices, and court orders directly to Form 65 lines for your Licensed Insolvency Trustee.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsComplianceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs shrink-0"
              title="View Statutory and Health Privacy Safeguards"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>HIPAA & PIPEDA Safeguards</span>
            </button>

            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0"
              title="Use device camera to take photo of physical receipt with AI parsing"
            >
              <Camera className="w-3.5 h-3.5 text-[#b6b3ff]" />
              <span>Take Photo (AI Scan)</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#fbf050] hover:bg-[#eade41] text-[#1d1a27] text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Proof Receipt</span>
            </button>
          </div>
        </div>

        {/* Compliance and Security Shield Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Statutory Privacy & Health Information Protection Active
              </span>
              <p className="text-[11px] text-slate-600 leading-normal">
                Medical receipts and personal health information (PHI) are segregated and encrypted client-side. Documents are restricted exclusively to BIA Section 68 trustee surplus audit compliance.
              </p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full self-start sm:self-center">
            <CheckCircle2 className="w-3 h-3" />
            256-Bit Enclave Active
          </span>
        </div>

        {/* Vault Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Verified Deductions
            </span>
            <div className="text-xl font-bold text-slate-900">
              $ {totalVaultAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Protected Medical Documents (PHI)
            </span>
            <div className="text-xl font-bold text-emerald-800 flex items-center gap-2">
              <span>$ {medicalTotal.toFixed(2)}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Audit Readiness
            </span>
            <div className="text-xl font-bold text-emerald-700 flex items-center gap-1.5">
              <span>Trustee Compliant</span>
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Document Filtering Tabs */}
        <div className="flex items-center gap-2 pt-5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Documents ({receipts.length})
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'medical'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Medical & PHI ({receipts.filter(r => r.category.toLowerCase().includes('medical')).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'general'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            General Proof ({receipts.filter(r => !r.category.toLowerCase().includes('medical')).length})
          </button>
        </div>
      </div>

      {/* Receipts Table / List */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-3">
                <th className="pb-3 font-semibold">Document Title</th>
                <th className="pb-3 font-semibold">Statutory Category</th>
                <th className="pb-3 font-semibold">Privacy Level</th>
                <th className="pb-3 font-semibold">Report Period</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReceipts.map((rec) => {
                const isMed = rec.category.toLowerCase().includes('medical') || rec.title.toLowerCase().includes('prescription');
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{rec.title}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <FileText className="w-3 h-3" />
                        <span>{rec.fileName || 'Proof_Document.pdf'}</span>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="bg-slate-200/80 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {rec.category}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {isMed ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Protected Health (PHI)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Standard Encrypted</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-xs text-slate-500">
                      {rec.reportMonth || 'September 2022'} · {rec.date}
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      $ {rec.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(rec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="View Document Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReceipt(rec.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance & Security Safeguards Drawer / Modal */}
      {isComplianceModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsComplianceModalOpen(false)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Statutory Privacy & Health Compliance
                </h3>
              </div>
              <button onClick={() => setIsComplianceModalOpen(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1">
                <span className="font-bold text-white block">PIPEDA & Health Information Act Compliance</span>
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
                onClick={() => setIsComplianceModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#b6b3ff] text-[#242031] font-bold text-xs hover:bg-white transition"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal with Floating Input & Privacy Selection */}
      {isUploadOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsUploadOpen(false)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                Upload Expense Proof / Prescription
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FloatingInput
                label="Document Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Compliance & Privacy Classification
                </label>
                <select
                  value={privacyClassification}
                  onChange={e => setPrivacyClassification(e.target.value as any)}
                  className="w-full bg-[#1e1b29] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b4b1fc]"
                >
                  <option value="PHI">Protected Health Information (Medical / Prescriptions)</option>
                  <option value="Statutory">Non-Discretionary (Childcare / Court Order)</option>
                  <option value="General">General Discretionary Proof</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Form 65 Statutory Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#1e1b29] border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b4b1fc]"
                >
                  <option value="Medical Condition Expenses">Medical Condition Expenses (Non-Discretionary)</option>
                  <option value="Child Care">Child Care (Non-Discretionary)</option>
                  <option value="Spousal / Child Support">Court Support Payments (Non-Discretionary)</option>
                  <option value="Expenses as Condition of Employment">Mandatory Employment Expenses</option>
                  <option value="Food & Grocery">Food & Grocery (Discretionary)</option>
                  <option value="Housing & Utilities">Housing & Utilities (Discretionary)</option>
                </select>
              </div>

              <FloatingInput
                type="number"
                step="0.01"
                prefix="$"
                label="Amount (CAD)"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                required
              />

              <div className="border border-dashed border-white/20 rounded-2xl p-4 text-center hover:border-[#b4b1fc] transition bg-white/5">
                <Upload className="w-5 h-5 mx-auto text-[#b4b1fc] mb-1.5" />
                <span className="text-xs text-slate-300 block font-semibold">
                  {fileName ? fileName : 'Choose receipt image or PDF proof'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  AES-256 client encryption applied before storage
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-file-input"
                />
                <label
                  htmlFor="receipt-file-input"
                  className="mt-2.5 inline-block px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer transition"
                >
                  Browse Document
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#fbf050] hover:bg-[#eade41] text-[#1d1a27] text-xs font-black"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Receipt Detail Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                Document Inspection
              </span>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{selectedReceipt.title}</div>
              <div className="text-xl font-bold text-[#fbf050] mt-1">$ {selectedReceipt.amount.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Date</span>
                <span className="font-semibold text-white">{selectedReceipt.date}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Filing Period</span>
                <span className="font-semibold text-white">{selectedReceipt.reportMonth || 'September 2022'}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl col-span-2">
                <span className="text-slate-400 block mb-1">Statutory Form 65 Category</span>
                <span className="font-semibold text-white">{selectedReceipt.category}</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
              >
                Close Inspector
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
          onAddReceipt(newRec);
          setIsCameraOpen(false);
        }}
      />
    </div>
  );
};
