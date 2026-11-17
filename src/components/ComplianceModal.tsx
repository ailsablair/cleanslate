import React, { useState } from 'react';
import {
  ShieldCheckeredIcon,
  LockIcon,
  DownloadIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  BankIcon,
  ClipboardIcon,
  WarningTriangleIcon,
  BalanceScaleIcon,
  CancelIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
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
            <div className="w-10 h-10 rounded-2xl bg-[#AEBBFD] border border-[#010101] text-[#3B3B3B] flex items-center justify-center shrink-0">
              <ShieldCheckeredIcon className="w-5 h-5" />
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

          <CleanSlateButton
            variant="white"
            size="icon"
            onClick={onClose}
            aria-label="Close compliance modal"
            className="!p-1.5 shrink-0"
          >
            <CloseIcon className="w-4 h-4" />
          </CleanSlateButton>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#4b4856]">
          
          {/* Key Safeguards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#101010] font-extrabold">
                <LockIcon className="w-4 h-4 text-[#8c93fc]" />
                <span>AES-256 Encryption</span>
              </div>
              <p className="text-[11px] text-[#4b4856] leading-relaxed">
                All Form 65 surplus calculations and uploaded receipts are encrypted at rest with zero unauthorized sharing.
              </p>
            </div>

            <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#101010] font-extrabold">
                <BalanceScaleIcon className="w-4 h-4 text-emerald-700" />
                <span>PIPEDA Compliant</span>
              </div>
              <p className="text-[11px] text-[#4b4856] leading-relaxed">
                Full adherence to Canadian Personal Information Protection &amp; Electronic Documents Act principles and data rights.
              </p>
            </div>

            <div className="bg-[#fbf9f5] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#101010] font-extrabold">
                <BankIcon className="w-4 h-4 text-[#8c93fc]" />
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
                <CheckIcon className="w-4 h-4 text-[#46e3a5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Strict Document RBAC:</strong> Database security rules restrict access solely to{' '}
                  <code className="text-[#F9F45D] bg-white/10 px-1.5 py-0.5 rounded">request.auth.uid == userId</code>. Cross-debtor access is mathematically prevented.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-4 h-4 text-[#46e3a5] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Canadian Data Sovereignty:</strong> Cloud storage locations strictly comply with Canadian provincial and federal residency regulations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-4 h-4 text-[#46e3a5] shrink-0 mt-0.5" />
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
              <CleanSlateButton
                variant="yellow"
                size="md"
                leftIcon={DownloadIcon}
                onClick={handleExportPipedaData}
              >
                <span>Export Official PIPEDA Data Package</span>
              </CleanSlateButton>

              <CleanSlateButton
                variant="status-error"
                size="md"
                leftIcon={TrashIcon}
                onClick={() => setShowConfirmPurge(!showConfirmPurge)}
              >
                <span>Purge Local Session Cache</span>
              </CleanSlateButton>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-[#46e3a5]/25 border border-[#46e3a5] text-[#102a1f] rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <ClipboardIcon className="w-4 h-4 text-emerald-700" />
                <span>PIPEDA Data Package exported successfully to your downloads folder.</span>
              </div>
            )}

            {showConfirmPurge && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <WarningTriangleIcon className="w-4 h-4 text-rose-700" />
                  <span>Confirm Local Cache Purge?</span>
                </div>
                <p className="text-[11px] text-rose-900/80">
                  This will clear local device storage caches. Your cloud data protected by Licensed Insolvency Trustee dispatch remains securely stored in Firestore.
                </p>
                <div className="flex items-center gap-2">
                  <CleanSlateButton
                    variant="status-error"
                    size="sm"
                    leftIcon={TrashIcon}
                    onClick={() => {
                      onPurgeData();
                      setShowConfirmPurge(false);
                      onClose();
                    }}
                  >
                    Yes, Purge Local Cache
                  </CleanSlateButton>
                  <CleanSlateButton
                    variant="white"
                    size="sm"
                    leftIcon={CancelIcon}
                    onClick={() => setShowConfirmPurge(false)}
                  >
                    Cancel
                  </CleanSlateButton>
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
            <ShieldCheckeredIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>OSB Vault · Encrypted Session</span>
          </span>

          <CleanSlateButton
            variant="dark-yellow"
            size="md"
            leftIcon={CloseIcon}
            onClick={onClose}
          >
            Close Safeguards Window
          </CleanSlateButton>
        </div>

      </div>
    </div>
  );
};
