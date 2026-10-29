import React, { useState } from 'react';
import { 
  Receipt as ReceiptIcon, 
  Upload, 
  Trash2, 
  Eye, 
  FileCheck, 
  Paperclip, 
  Plus, 
  Calendar, 
  Tag, 
  CheckCircle2,
  FileText,
  Camera
} from 'lucide-react';
import { Receipt } from '../types';
import { CameraReceiptModal } from './CameraReceiptModal';

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
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical Condition Expenses');
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
      title: title || 'Medical Prescription Proof',
      category,
      amount: amount || 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      fileName: fileName || 'Prescription_Proof.pdf',
      linkedLineItem,
      reportMonth: 'September 2022'
    });
    setIsUploadOpen(false);
    setTitle('');
    setFileName('');
  };

  const totalVaultAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Vault Overview Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptIcon className="w-5 h-5 text-[#242031]" />
              <h2 className="text-lg font-black tracking-wider uppercase text-slate-900">
                PROOF & STATUTORY RECEIPT VAULT
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Encrypted digital document storage linking uploaded prescriptions, childcare invoices, and court orders directly to Form 65 line items for Licensed Insolvency Trustee audit verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0"
              title="Use device camera to take photo of physical receipt with AI parsing"
            >
              <Camera className="w-4 h-4 text-[#b6b3ff]" />
              <span>Take Photo (AI Scan)</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#fbf050] hover:bg-[#eade41] text-[#1d1a27] text-xs font-black transition flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Proof Receipt</span>
            </button>
          </div>
        </div>

        {/* Vault Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Verified Deductions
            </span>
            <div className="text-2xl font-black text-slate-900">
              $ {totalVaultAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Documents on File
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{receipts.length} Documents</span>
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Audit Readiness
            </span>
            <div className="text-2xl font-black text-emerald-700">
              100% Trustee Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table / List */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-3">
                <th className="pb-3 font-semibold">Document Title</th>
                <th className="pb-3 font-semibold">Statutory Category</th>
                <th className="pb-3 font-semibold">Report Period</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {receipts.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition">
                  <td className="py-4">
                    <div className="font-extrabold text-slate-900">{rec.title}</div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{rec.fileName || 'Proof_Document.pdf'}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="bg-slate-200/80 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {rec.category}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-slate-500">
                    {rec.reportMonth || 'September 2022'} · {rec.date}
                  </td>
                  <td className="py-4 text-right font-black text-slate-900">
                    $ {rec.amount.toFixed(2)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedReceipt(rec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                        title="View Document Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteReceipt(rec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsUploadOpen(false)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#b6b3ff]">
                Upload Expense Proof / Prescription
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pharmacy Prescription Receipt - Chronic Care"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">Form 65 Line Item</label>
                <select
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    if (e.target.value === 'Medical Condition Expenses') setLinkedLineItem('medicalConditionExpenses');
                    else if (e.target.value === 'Child Care') setLinkedLineItem('childCare');
                    else setLinkedLineItem('expensesConditionEmployment');
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                >
                  <option value="Medical Condition Expenses" className="bg-[#2e293f]">Medical Condition Expenses (Prescriptions)</option>
                  <option value="Child Care" className="bg-[#2e293f]">Child Care / Daycare Invoice</option>
                  <option value="Expenses as a condition of employment" className="bg-[#2e293f]">Condition of Employment (Tools/Boots)</option>
                  <option value="Child Support Payments" className="bg-[#2e293f]">Child Support Payments Proof</option>
                  <option value="Spousal Support Payments" className="bg-[#2e293f]">Spousal Support Payments Proof</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">Amount ($ CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">Attach File</label>
                <label 
                  htmlFor="file-upload-input"
                  className="w-full border-2 border-dashed border-white/20 hover:border-[#b6b3ff] rounded-2xl p-4 text-center cursor-pointer transition block"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {fileName || 'Click to select PDF or image receipt'}
                  </span>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#fbf050] text-[#1d1a27] font-black text-xs hover:bg-[#eade41] transition"
                >
                  Save & Link to Statutory Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#b6b3ff]">
                Document Audit Record
              </h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Title</span>
                <span className="text-sm font-black text-white">{selectedReceipt.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Amount</span>
                  <span className="text-base font-black text-[#fbf050]">${selectedReceipt.amount.toFixed(2)}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Date Uploaded</span>
                  <span className="font-semibold text-white">{selectedReceipt.date}</span>
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Linked Statutory Category</span>
                <span className="font-semibold text-white">{selectedReceipt.category}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-slate-400 block mb-0.5">File Asset</span>
                <span className="font-mono text-slate-300">{selectedReceipt.fileName || 'Prescription.pdf'}</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Camera AI Receipt Modal */}
      <CameraReceiptModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onReceiptCaptured={onAddReceipt}
      />
    </div>
  );
};
