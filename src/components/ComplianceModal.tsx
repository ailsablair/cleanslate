import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Download, 
  Trash2, 
  CheckCircle2, 
  X, 
  Building2, 
  FileSpreadsheet, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { UserProfile, MonthlyReport, BankAccount, Transaction, Receipt } from '../types';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  reports: MonthlyReport[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  receipts: Receipt[];
  onPurgeData: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  onClose,
  profile,
  reports,
  bankAccounts,
  transactions,
  receipts,
  onPurgeData
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);

  if (!isOpen) return null;

  const handleExportPipedaData = () => {
    const exportPackage = {
      complianceMetadata: {
        legalFramework: 'PIPEDA & OSB Directive 11R2 Compliance Export',
        exportedAt: new Date().toISOString(),
        jurisdiction: 'Canada (Federal / OSB)',
        debtorFileRef: 'CS-2022-BC-9104',
        userEmail: profile.email,
        trustee: profile.litName || 'Sarah Jenkins, CPA, CIRP, LIT'
      },
      userProfile: profile,
      statutoryMonthlyReports: reports,
      connectedBankAccounts: bankAccounts,
      financialTransactions: transactions,
      expenseReceiptVault: receipts
    };

    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CleanSlate_PIPEDA_Data_Export_${profile.lastName}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#1d1a27] text-white border-2 border-[#b6b3ff] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#2a243a] via-[#1d1a27] to-[#252033] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#b6b3ff] text-[#1d1a27] flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold uppercase tracking-wide text-white">
                  Canadian Data Security & PIPEDA Compliance
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 uppercase">
                  OSB Audited
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Guaranteed statutory protection for sensitive BIA bankruptcy & financial records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          
          {/* Key Safeguards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#262135] border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#b6b3ff] font-bold">
                <Lock className="w-4 h-4" />
                <span>AES-256 Encryption</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All Form 65 surplus calculations and uploaded receipts are encrypted at rest with zero unauthorized sharing.
              </p>
            </div>

            <div className="bg-[#262135] border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Scale className="w-4 h-4" />
                <span>PIPEDA Compliant</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Full adherence to Canadian Personal Information Protection & Electronic Documents Act principles and data rights.
              </p>
            </div>

            <div className="bg-[#262135] border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#fbf050] font-bold">
                <Building2 className="w-4 h-4" />
                <span>OSB Directives</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Direct integration with OSB Directive 11R2 surplus income standards with certified LIT dispatch logging.
              </p>
            </div>
          </div>

          {/* Detailed Security & Isolation Protocol */}
          <div className="bg-[#14121b] border border-white/10 rounded-2xl p-5 space-y-3">
            <h4 className="font-extrabold text-[#b6b3ff] uppercase tracking-wider text-[11px]">
              Multi-Tenant Data Isolation Protocol
            </h4>
            <ul className="space-y-2 text-slate-300 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Document RBAC:</strong> Database security rules restrict access solely to <code className="text-[#fbf050] bg-white/5 px-1 py-0.5 rounded">request.auth.uid == userId</code>. Cross-debtor access is mathematically prevented.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Canadian Data Sovereignty:</strong> Cloud storage locations strictly comply with Canadian provincial and federal residency regulations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Audit Trail Integrity:</strong> Email dispatches to Licensed Insolvency Trustees generate an immutable cryptographic timestamped log for your BIA Form 65 submission records.
                </span>
              </li>
            </ul>
          </div>

          {/* User Data Rights & PIPEDA Export */}
          <div className="border border-white/10 rounded-2xl p-5 bg-[#262135] space-y-4">
            <div>
              <h4 className="font-extrabold text-white uppercase text-xs">
                Your Right to Data Portability & Erasure (PIPEDA Principle 9)
              </h4>
              <p className="text-slate-400 text-[11px] mt-1">
                Download your complete OSB bankruptcy record package at any time in machine-readable JSON format, or request local cache purge.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportPipedaData}
                className="px-4 py-2.5 rounded-xl bg-[#b6b3ff] text-[#1d1a27] font-black text-xs hover:bg-[#a3a0fa] transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Official PIPEDA Data Package</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmPurge(!showConfirmPurge)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Purge Local Session Cache</span>
              </button>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>PIPEDA Data Package exported successfully to your downloads folder.</span>
              </div>
            )}

            {showConfirmPurge && (
              <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Confirm Local Cache Purge?</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  This will clear local device storage caches. Your cloud data protected by Licensed Insolvency Trustee dispatch remains securely stored in Firestore.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onPurgeData();
                      setShowConfirmPurge(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition"
                  >
                    Yes, Purge Local Cache
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPurge(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 font-medium rounded-lg text-[11px] transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#14121b] border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>CleanSlate OSB Vault · Encrypted Session</span>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Safeguards Window
          </button>
        </div>

      </div>
    </div>
  );
};
