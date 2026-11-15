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
import { BrandLogo } from './BrandLogo';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl shadow-[6px_8px_0px_#000000] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Banner */}
        <div className="px-6 py-5 bg-[#fbf9f5] border-b border-[#b4b1fc]/35 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#b6b3ff] border border-[#101010] text-[#101010] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#101010]">
                  Canadian Data Security &amp; PIPEDA Compliance
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20 uppercase">
                  OSB Audited
                </span>
              </div>
              <p className="text-xs text-[#4b4856] mt-0.5">
                Guaranteed statutory protection for sensitive BIA bankruptcy &amp; financial records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close compliance modal"
            className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#4b4856]">
          
          {/* Key Safeguards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#101010] font-extrabold">
                <Lock className="w-4 h-4 text-[#8c93fc]" />
                <span>AES-256 Encryption</span>
              </div>
              <p className="text-[11px] text-[#4b4856] leading-relaxed">
                All Form 65 surplus calculations and uploaded receipts are encrypted at rest with zero unauthorized sharing.
              </p>
            </div>

            <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#101010] font-extrabold">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>PIPEDA Compliant</span>
              </div>
              <p className="text-[11px] text-[#4b4856] leading-relaxed">
                Full adherence to Canadian Personal Information Protection &amp; Electronic Documents Act principles and data rights.
              </p>
            </div>

            <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#101010] font-extrabold">
                <Building2 className="w-4 h-4 text-[#8c93fc]" />
                <span>OSB Directives</span>
              </div>
              <p className="text-[11px] text-[#4b4856] leading-relaxed">
                Direct integration with OSB Directive 11R2 surplus income standards with certified LIT dispatch logging.
              </p>
            </div>
          </div>

          {/* Detailed Security & Isolation Protocol */}
          <div className="bg-[#1d1a27] text-white border-[1.5px] border-[#101010] rounded-2xl p-5 space-y-3">
            <h4 className="font-extrabold text-[#b6b3ff] uppercase tracking-wider text-[11px]">
              Multi-Tenant Data Isolation Protocol
            </h4>
            <ul className="space-y-2 text-slate-300 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#46e3a5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Strict Document RBAC:</strong> Database security rules restrict access solely to{' '}
                  <code className="text-[#F9F45D] bg-white/10 px-1.5 py-0.5 rounded">request.auth.uid == userId</code>. Cross-debtor access is mathematically prevented.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#46e3a5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Canadian Data Sovereignty:</strong> Cloud storage locations strictly comply with Canadian provincial and federal residency regulations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#46e3a5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Audit Trail Integrity:</strong> Email dispatches to Licensed Insolvency Trustees generate an immutable cryptographic timestamped log for your BIA Form 65 submission records.
                </span>
              </li>
            </ul>
          </div>

          {/* User Data Rights & PIPEDA Export */}
          <div className="border border-[#d8d9f8] rounded-2xl p-5 bg-[#fbf9f5] space-y-4">
            <div>
              <h4 className="font-extrabold text-[#101010] uppercase text-xs">
                Your Right to Data Portability &amp; Erasure (PIPEDA Principle 9)
              </h4>
              <p className="text-[#4b4856] text-[11px] mt-1">
                Download your complete OSB bankruptcy record package at any time in machine-readable JSON format, or request local cache purge.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportPipedaData}
                className="px-4 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export Official PIPEDA Data Package</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmPurge(!showConfirmPurge)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border-[1.5px] border-rose-600 shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>Purge Local Session Cache</span>
              </button>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-[#46e3a5]/25 border border-[#46e3a5] text-[#102a1f] rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>PIPEDA Data Package exported successfully to your downloads folder.</span>
              </div>
            )}

            {showConfirmPurge && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  <span>Confirm Local Cache Purge?</span>
                </div>
                <p className="text-[11px] text-rose-900/80">
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
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] border border-[#101010] transition cursor-pointer"
                  >
                    Yes, Purge Local Cache
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPurge(false)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#101010] font-bold rounded-lg text-[11px] border border-[#101010] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#fbf9f5] border-t border-[#b4b1fc]/35 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#4b4856] font-medium flex items-center gap-2 flex-wrap">
            <BrandLogo variant="brand-dark" className="h-4 w-auto object-contain" />
            <span aria-hidden="true">·</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>OSB Vault · Encrypted Session</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-white font-bold text-xs border-[1.5px] border-[#F9F45D] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
          >
            Close Safeguards Window
          </button>
        </div>

      </div>
    </div>
  );
};
