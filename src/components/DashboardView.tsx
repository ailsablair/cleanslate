import React, { useState, useRef } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  ExternalLink,
  Upload,
  Paperclip,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { BankAccount, Transaction, MonthlyReport, UserProfile, Receipt } from '../types';
import { BudgetSummary } from './BudgetSummary';
import { FinancialInsightCard } from './FinancialInsightCard';
import { formatCurrency } from '../lib/formatters';
import { isProofRequiredForTransaction, getProofRequirementInfo } from '../lib/transactionUtils';

interface DashboardViewProps {
  profile: UserProfile;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  monthlyReports: MonthlyReport[];
  receipts?: Receipt[];
  onUpdateTransaction?: (tx: Transaction) => void;
  onAddReceipt?: (receipt: Omit<Receipt, 'id'>) => void;
  onNavigateToReports: () => void;
  onNavigateToBankAccounts: () => void;
  onNavigateToCategorize: () => void;
  onNavigateToSpendingTrends?: () => void;
  onSyncBankAccounts: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  bankAccounts,
  transactions,
  monthlyReports,
  receipts = [],
  onUpdateTransaction,
  onAddReceipt,
  onNavigateToReports,
  onNavigateToBankAccounts,
  onNavigateToCategorize,
  onNavigateToSpendingTrends,
  onSyncBankAccounts,
  isSyncing
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState<boolean>(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter overdue or draft reports
  const outstandingCount = monthlyReports.filter(r => r.status === 'Draft' || r.status === 'Overdue').length;
  const submittedCount = monthlyReports.filter(r => r.status === 'Submitted').length;
  const completionPercent = Math.round((submittedCount / (monthlyReports.length || 12)) * 100);

  // Calculate average spend from transactions
  const avgSpend = transactions.length > 0 
    ? transactions.reduce((acc, t) => acc + t.amount, 0) / (transactions.length || 1)
    : 2397.22;

  // Current surplus payment
  const currentPayment = 159;

  // Handle tight receipt upload and association with selected transaction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTx) return;

    setIsUploadingReceipt(true);
    const reader = new FileReader();

    reader.onload = () => {
      const fileDataUrl = typeof reader.result === 'string' ? reader.result : '';
      const generatedReceiptId = `rec-${Date.now()}`;

      // 1. Create linked Receipt tightly associated with this transaction ID
      if (onAddReceipt) {
        onAddReceipt({
          userId: selectedTx.userId || profile.uid,
          title: `${selectedTx.company} Receipt`,
          category: selectedTx.form65Category || selectedTx.category || 'Discretionary',
          amount: selectedTx.amount,
          date: selectedTx.date || 'Sep 01, 2022',
          fileName: file.name,
          fileUrl: fileDataUrl,
          linkedLineItem: selectedTx.form65Category,
          linkedTransactionId: selectedTx.id,
          reportMonth: 'September'
        });
      }

      // 2. Update Transaction with receipt reference
      const updatedTx: Transaction = {
        ...selectedTx,
        receiptId: generatedReceiptId,
        receiptFileName: file.name,
        receiptFileUrl: fileDataUrl
      };

      if (onUpdateTransaction) {
        onUpdateTransaction(updatedTx);
      }

      setSelectedTx(updatedTx);
      setIsUploadingReceipt(false);
      setUploadSuccessToast(`Receipt "${file.name}" linked to ${selectedTx.company} (#${selectedTx.id})`);
      setTimeout(() => setUploadSuccessToast(null), 4500);
    };

    reader.onerror = () => {
      setIsUploadingReceipt(false);
    };

    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* 1. Top Outstanding Alert Banner */}
      <div className="bg-[#fbf050] text-[#1d1a27] rounded-3xl p-6 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950">
              You have {outstandingCount} outstanding monthly reports to submit
            </h2>
            <p className="text-sm font-normal text-[#2d283c] leading-relaxed max-w-xl">
              You're on track! Reports are due on the <span className="font-semibold underline decoration-slate-900/30">15th of every month</span>. Completing them on time is important for early discharge.
            </p>
          </div>
          <button
            onClick={onNavigateToReports}
            className="shrink-0 bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs px-5 py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer active:scale-95"
          >
            <span className="font-normal">Complete</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Main Section: Metrics + Budget on Left, Helpful Hints on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7-8 cols): 3 Metric Cards + Budget Summary */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 3 Metric Cards (Lavender `#b4b1fc`) with Balanced Height and Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Monthly Reports */}
            <div 
              onClick={onNavigateToReports}
              className="bg-[#b4b1fc] hover:bg-[#bebbff] text-[#242031] rounded-2xl p-5 sm:p-6 transition cursor-pointer shadow-xs relative group min-h-[132px] flex flex-col justify-between"
            >
              <div>
                <div 
                  className="text-[10px] font-bold tracking-wider uppercase text-[#3f3b54] mb-2"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                >
                  MONTHLY REPORTS
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold tracking-tight whitespace-nowrap">
                    {completionPercent}% <span className="text-xs font-semibold opacity-75">({submittedCount}/{monthlyReports.length || 12})</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#242031]/10 flex items-center justify-center text-[#242031] group-hover:bg-[#242031]/20 transition shrink-0">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
              {/* Progress bar remains */}
              <div>
                <div className="w-full bg-[#242031]/20 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#242031] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Metric 2: Average Spend -> Navigates to Spending Trends */}
            <div 
              onClick={onNavigateToSpendingTrends || onNavigateToBankAccounts}
              className="bg-[#b4b1fc] hover:bg-[#bebbff] text-[#242031] rounded-2xl p-5 sm:p-6 transition cursor-pointer shadow-xs relative group min-h-[132px] flex flex-col justify-between"
              title="Click to view 6-month spending trends & peer benchmarks"
            >
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-[#3f3b54] mb-2">
                  AVERAGE SPEND
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold tracking-tight whitespace-nowrap">
                    {formatCurrency(avgSpend)}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#242031]/10 flex items-center justify-center text-[#242031] group-hover:bg-[#242031]/20 transition shrink-0">
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Metric 3: Current Payment */}
            <div 
              onClick={onNavigateToReports}
              className="bg-[#b4b1fc] hover:bg-[#bebbff] text-[#242031] rounded-2xl p-5 sm:p-6 transition cursor-pointer shadow-xs relative group min-h-[132px] flex flex-col justify-between"
            >
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-[#3f3b54] mb-2">
                  CURRENT PAYMENT
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold tracking-tight whitespace-nowrap">
                    {formatCurrency(currentPayment)}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#242031]/10 flex items-center justify-center text-[#242031] group-hover:bg-[#242031]/20 transition shrink-0">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Summary Component with Recharts Doughnut Chart */}
          <BudgetSummary
            currentReport={monthlyReports.find(r => r.month === 'September' && r.year === 2022) || monthlyReports[0]}
            profile={profile}
            onNavigateToReports={onNavigateToReports}
          />
        </div>

        {/* Right Column: Helpful Hints (Financial Insights Card) in Top Right of Screen */}
        <div className="lg:col-span-5 xl:col-span-4">
          <FinancialInsightCard
            monthlyReports={monthlyReports}
            profile={profile}
          />
        </div>
      </div>

      {/* 5. LATEST TRANSACTIONS Card (Item 15: Full Screen Width, Generous Padding) */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold tracking-wider uppercase text-[#242031]">
            LATEST TRANSACTIONS
          </h3>
          <button
            onClick={onNavigateToCategorize}
            style={{ color: '#FF6BBC' }}
            className="text-xs transition flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span className="font-normal underline text-right">AI Categorizer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-semibold text-slate-400 border-b border-slate-200/80 pb-3">
                <th className="pb-3 pr-4 whitespace-nowrap">
                  Transaction ID
                </th>
                <th className="pb-3 px-4">
                  Company
                </th>
                <th className="pb-3 px-4 whitespace-nowrap">
                  Date
                </th>
                <th className="pb-3 px-4 whitespace-nowrap">
                  Proof Status
                </th>
                <th className="pb-3 pl-4 text-right whitespace-nowrap">
                  Amount
                </th>
                <th className="pb-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.slice(0, 5).map((tx) => {
                const txLinkedReceipt = receipts.find(r => r.linkedTransactionId === tx.id || (tx.receiptId && r.id === tx.receiptId));
                const isAttached = Boolean(txLinkedReceipt || tx.receiptFileName || tx.receiptId);
                const txProofInfo = getProofRequirementInfo(tx);

                return (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-100/70 transition cursor-pointer group"
                  >
                    <td className="py-4 pr-4 text-[10px] font-mono text-slate-400 font-normal whitespace-nowrap">
                      #{tx.id}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 block text-sm">{tx.company}</span>
                      <span className="block text-[11px] text-slate-400 font-normal truncate max-w-[200px] sm:max-w-none">
                        {tx.form65Category || tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-normal whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {isAttached ? (
                        <span className="status-tag-compact text-emerald-800 bg-emerald-50 border border-emerald-200/90">
                          <CheckCircle2 className="w-2 h-2 text-emerald-600 shrink-0" />
                          <span>Receipt attached</span>
                        </span>
                      ) : txProofInfo.required ? (
                        <span className="status-tag-compact text-amber-900 bg-amber-50 border border-amber-300">
                          <AlertCircle className="w-2 h-2 text-amber-600 shrink-0" />
                          <span>{txProofInfo.type === 'prescription' ? 'Prescription needed' : 'Receipt needed'}</span>
                        </span>
                      ) : (
                        <span className="status-tag-compact text-slate-500 bg-slate-100 border border-slate-200/80">
                          <span>Optional</span>
                        </span>
                      )}
                    </td>
                    {/* Item 16: Currency & amount strictly on one line */}
                    <td className="py-4 pl-4 text-right font-bold text-slate-900 whitespace-nowrap text-sm sm:text-base">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 pl-2 text-right text-slate-300 group-hover:text-slate-700 transition">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Connected Bank Accounts (Item 16: Full Width, Amount strictly on one line) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CONNECTED BANK ACCOUNTS
            </span>
            {isSyncing && (
              <span className="text-[11px] font-semibold text-[#b6b3ff] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Fetching live balances...
              </span>
            )}
          </div>
          <button
            onClick={onNavigateToBankAccounts}
            style={{ color: '#FF6BBC' }}
            className="text-xs transition flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span className="font-normal underline text-right">Manage & Add Accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              onClick={onNavigateToBankAccounts}
              className="bg-[#fbf9f5] hover:bg-white text-[#242031] rounded-3xl p-6 shadow-sm transition cursor-pointer group relative"
            >
              <div className="text-[12px] font-bold uppercase tracking-wide text-slate-900 mb-1 truncate">
                {account.name}
              </div>
              <div className="text-xs font-mono text-slate-400 mb-6">
                {account.accountMask}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                {/* Item 16: Currency & amounts always on same line, never wrapped */}
                <span className="text-xl sm:text-2xl font-normal text-slate-900 tracking-tight whitespace-nowrap">
                  {formatCurrency(account.balance)}
                </span>
                <div className="text-slate-400 group-hover:text-slate-900 transition shrink-0">
                  {account.trendDirection === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Quick transaction inspect modal */}
      {selectedTx && (() => {
        const linkedReceipt = receipts.find(r => r.linkedTransactionId === selectedTx.id || (selectedTx.receiptId && r.id === selectedTx.receiptId));
        const hasReceiptAttached = Boolean(linkedReceipt || selectedTx.receiptFileName || selectedTx.receiptFileUrl || selectedTx.receiptId);
        const proofInfo = getProofRequirementInfo(selectedTx);

        return (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
            onClick={() => setSelectedTx(null)}
          >
            <div 
              className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                  TRANSACTION DETAILS
                </div>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                  aria-label="Close transaction details"
                >
                  ✕
                </button>
              </div>

              {/* Vendor & Amount */}
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{selectedTx.company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Reference #{selectedTx.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-[#fbf050]">{formatCurrency(selectedTx.amount)}</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">CAD</div>
                </div>
              </div>

              {/* Transaction Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 block mb-1">Date</span>
                  <span className="font-semibold text-white">{selectedTx.date}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 block mb-1">Reference ID</span>
                  <span className="font-mono text-white">{selectedTx.id}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl col-span-2 border border-white/5">
                  <span className="text-slate-400 block mb-1">Form 65 Statutory Line</span>
                  <span className="font-semibold text-white">{selectedTx.form65Category || 'Uncategorized'}</span>
                </div>
              </div>

              {/* Statutory Compliance Proof Section */}
              <div className="space-y-2">
                {hasReceiptAttached ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Receipt Proof Attached & Verified</span>
                      </div>
                      <span className="status-tag-compact text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                        BIA Form 65 ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-2 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">
                          {linkedReceipt?.fileName || selectedTx.receiptFileName || 'Receipt_Document.pdf'}
                        </span>
                      </div>
                      {(linkedReceipt?.fileUrl || selectedTx.receiptFileUrl) && (
                        <a 
                          href={linkedReceipt?.fileUrl || selectedTx.receiptFileUrl} 
                          download={linkedReceipt?.fileName || selectedTx.receiptFileName || 'receipt.pdf'}
                          className="text-[10.5px] text-[#b6b3ff] hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Tightly linked to transaction #{selectedTx.id} for Licensed Insolvency Trustee Sarah Jenkins' audit.
                    </p>
                  </div>
                ) : proofInfo.required ? (
                  <div className="bg-amber-950/50 border border-amber-500/70 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Statutory requirement: Receipt must be uploaded</span>
                    </div>
                    <div className="text-[11px] text-amber-200/95 leading-relaxed">
                      <strong className="text-white block mb-0.5">{proofInfo.label}</strong>
                      {proofInfo.explanation}
                    </div>
                    <div className="text-[10.5px] text-amber-300/80 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 leading-tight">
                      Under Canadian Bankruptcy and Insolvency Act (BIA) Form 65 rules, receipts MUST be uploaded on all transactions that require proof of purchase or prescription for trustee deduction approval.
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>Receipt Proof (Optional)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Discretionary day-to-day expenditure. Attaching a receipt is optional but recommended for your monthly reconciliation.
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Success Feedback */}
              {uploadSuccessToast && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{uploadSuccessToast}</span>
                </div>
              )}

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />

              {/* Two-Button Action Layout */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Secondary Button: Upload / Replace Receipt (Requested Feature) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingReceipt}
                  className={`py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    isUploadingReceipt
                      ? 'opacity-60 cursor-wait bg-white/10 text-white'
                      : hasReceiptAttached
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-98'
                      : proofInfo.required
                      ? 'bg-[#fbf050] hover:bg-[#fffa78] text-[#1d1a27] font-bold shadow-md active:scale-98'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/20 active:scale-98'
                  }`}
                  title={proofInfo.required ? 'Receipt / prescription upload mandatory for this transaction' : 'Upload proof receipt'}
                >
                  {isUploadingReceipt ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : hasReceiptAttached ? (
                    <>
                      <Paperclip className="w-3.5 h-3.5 text-[#b6b3ff]" />
                      <span>Replace Receipt</span>
                    </>
                  ) : proofInfo.required ? (
                    <>
                      <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Upload Receipt (Required)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Receipt Proof</span>
                    </>
                  )}
                </button>

                {/* Primary Button: Re-categorize */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTx(null);
                    onNavigateToCategorize();
                  }}
                  className="py-2.5 px-3.5 rounded-xl bg-[#b6b3ff] hover:bg-white text-[#242031] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>Re-categorize in AI Tool</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
