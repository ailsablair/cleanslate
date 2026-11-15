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
import { UploadConfirmationModal } from './UploadConfirmationModal';
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
  const [isUploadConfirmOpen, setIsUploadConfirmOpen] = useState<boolean>(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

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

  // Handle linking uploaded receipt/proof from UploadConfirmationModal to selectedTx
  const handleAttachConfirmedReceipt = (newRec: Omit<Receipt, 'id'>) => {
    if (!selectedTx) return;
    const generatedReceiptId = `rec-${Date.now()}`;

    if (onAddReceipt) {
      onAddReceipt({
        ...newRec,
        linkedTransactionId: selectedTx.id
      });
    }

    const updatedTx: Transaction = {
      ...selectedTx,
      form65Category:
        newRec.category && newRec.category !== 'Unknown'
          ? newRec.category
          : selectedTx.form65Category,
      isCategorized:
        Boolean(newRec.category && newRec.category !== 'Unknown') || selectedTx.isCategorized,
      receiptId: generatedReceiptId,
      receiptFileName: newRec.fileName || `${selectedTx.company}_Proof.pdf`,
      receiptFileUrl: newRec.fileUrl
    };

    if (onUpdateTransaction) {
      onUpdateTransaction(updatedTx);
    }

    setSelectedTx(updatedTx);
    setUploadSuccessToast(
      `Proof "${updatedTx.receiptFileName}" linked to ${selectedTx.company} (#${selectedTx.id})`
    );
    setTimeout(() => setUploadSuccessToast(null), 4500);
  };

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* 1. Top Outstanding Alert Banner */}
      <div className="bg-[#fbf050] text-[#101010] rounded-3xl p-6 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#101010]">
              You have {outstandingCount} outstanding monthly reports to submit
            </h2>
            <p className="text-xs sm:text-sm font-normal text-[#2d283c] leading-relaxed max-w-xl">
              You're on track! Reports are due on the <span className="font-bold underline decoration-[#101010]/35">15th of every month</span>. Completing them on time is important for early discharge.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToReports}
            className="shrink-0 bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-bold px-5 py-2.5 rounded-xl border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer whitespace-nowrap"
          >
            <span>Complete</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Main Section: Metrics + Budget on Left, Helpful Hints on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7-8 cols): 3 Metric Cards + Budget Summary */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* 3 Metric Cards matching Pathway to Discharge KPI card language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Monthly Reports */}
            <div
              onClick={onNavigateToReports}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToReports()}
              className="bg-white hover:bg-[#fbf9f5] text-[#101010] rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] transition cursor-pointer group min-h-[136px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#6e6b7b]">
                  MONTHLY REPORTS
                </span>
                <div className="w-7 h-7 rounded-full bg-[#b4b1fc]/25 flex items-center justify-center text-[#101010] group-hover:bg-[#b4b1fc]/45 transition shrink-0">
                  <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>

              <div className="space-y-2.5 mt-auto pt-3">
                <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#46e3a5] h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums whitespace-nowrap text-[#101010]">
                  {completionPercent}%{' '}
                  <span className="text-xs font-semibold text-[#6e6b7b]">
                    ({submittedCount}/{monthlyReports.length || 12})
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 2: Average Spend -> Navigates to Bank Accounts */}
            <div
              onClick={onNavigateToBankAccounts}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToBankAccounts()}
              className="bg-white hover:bg-[#fbf9f5] text-[#101010] rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] transition cursor-pointer group min-h-[136px] flex flex-col justify-between"
              title="Click to view connected bank accounts & balances"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#6e6b7b]">
                  AVERAGE SPEND
                </span>
                <div className="w-7 h-7 rounded-full bg-[#b4b1fc]/25 flex items-center justify-center text-[#101010] group-hover:bg-[#b4b1fc]/45 transition shrink-0">
                  <ArrowDownRight className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-auto pt-3 space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e9e8ec] text-[#4b4856] text-[10px] font-semibold">
                  Bank Import Feed
                </span>
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums whitespace-nowrap text-[#101010]">
                  {formatCurrency(avgSpend)}
                </div>
              </div>
            </div>

            {/* Metric 3: Current Payment */}
            <div
              onClick={onNavigateToReports}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateToReports()}
              className="bg-white hover:bg-[#fbf9f5] text-[#101010] rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] transition cursor-pointer group min-h-[136px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#6e6b7b]">
                  CURRENT PAYMENT
                </span>
                <div className="w-7 h-7 rounded-full bg-[#46e3a5]/30 flex items-center justify-center text-[#102a1f] transition shrink-0">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-auto pt-3 space-y-1.5">
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums whitespace-nowrap text-[#101010]">
                  {formatCurrency(currentPayment)}
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

      {/* 5. LATEST TRANSACTIONS Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#8c93fc]/25">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#8c93fc] shrink-0" />
            <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
              LATEST TRANSACTIONS
            </h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToCategorize}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#101010] text-xs font-bold border border-[#101010] shadow-[2px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Open Categorizer</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8c93fc]" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-[#6e6b7b] border-b border-slate-200/80 pb-3">
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
            <tbody className="divide-y divide-[#d8d9f8]/70 font-medium">
              {transactions.slice(0, 5).map((tx) => {
                const txLinkedReceipt = receipts.find(r => r.linkedTransactionId === tx.id || (tx.receiptId && r.id === tx.receiptId));
                const isAttached = Boolean(txLinkedReceipt || tx.receiptFileName || tx.receiptId);
                const txProofInfo = getProofRequirementInfo(tx);

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-white transition cursor-pointer group"
                  >
                    <td className="py-4 pr-4 text-xs font-mono text-[#6e6b7b] font-normal whitespace-nowrap">
                      #{tx.id}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-[#101010] block text-sm">{tx.company}</span>
                      <span className="block text-[11px] text-[#6e6b7b] font-normal truncate max-w-[200px] sm:max-w-none">
                        {tx.form65Category || tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-[#4b4856] font-normal tabular-nums whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {isAttached ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Receipt attached</span>
                        </span>
                      ) : txProofInfo.required ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fbf050] text-[#1d1a27] border border-black/15 text-[11px] font-semibold">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{txProofInfo.type === 'prescription' ? 'Prescription needed' : 'Receipt needed'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#e9e8ec] text-[#4b4856] text-[11px] font-semibold">
                          <span>Optional</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right font-bold text-[#101010] tabular-nums whitespace-nowrap text-sm sm:text-base">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 pl-2 text-right text-[#6e6b7b] group-hover:text-[#101010] transition">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Connected Bank Accounts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#8c93fc]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-white">
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
            type="button"
            onClick={onNavigateToBankAccounts}
            className="text-xs font-semibold text-[#b6b3ff] hover:text-white transition flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>Manage &amp; Add Accounts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              onClick={onNavigateToBankAccounts}
              className="bg-[#fbf9f5] hover:bg-white text-[#101010] rounded-3xl p-6 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] transition cursor-pointer group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-extrabold uppercase tracking-wide text-[#101010] truncate">
                    {account.name}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#e9e8ec] text-[#4b4856] text-[10px] font-semibold shrink-0">
                    {account.accountType}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#6e6b7b] mb-6">
                  {account.accountMask}
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-3 border-t border-[#d8d9f8]">
                <span className="text-xl sm:text-2xl font-extrabold text-[#101010] tracking-tight tabular-nums whitespace-nowrap">
                  {formatCurrency(account.balance)}
                </span>
                <div className="w-7 h-7 rounded-full bg-white border border-[#d8d9f8] group-hover:border-[#101010] flex items-center justify-center text-[#101010] transition shrink-0">
                  {account.trendDirection === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.2] text-emerald-700" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 stroke-[2.2] text-rose-600" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick transaction inspect modal — unified light neo-brutalist modal style */}
      {selectedTx && (() => {
        const linkedReceipt = receipts.find(r => r.linkedTransactionId === selectedTx.id || (selectedTx.receiptId && r.id === selectedTx.receiptId));
        const hasReceiptAttached = Boolean(linkedReceipt || selectedTx.receiptFileName || selectedTx.receiptFileUrl || selectedTx.receiptId);
        const proofInfo = getProofRequirementInfo(selectedTx);

        return (
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150"
            onClick={() => setSelectedTx(null)}
          >
            <div
              className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-[6px_8px_0px_#000000] space-y-5 my-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#b4b1fc]/35">
                <div className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                  TRANSACTION DETAILS
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
                  aria-label="Close transaction details"
                >
                  ✕
                </button>
              </div>

              {/* Vendor & Amount */}
              <div className="flex items-baseline justify-between gap-4 bg-[#fbf9f5] rounded-2xl p-4 border border-[#d8d9f8]">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-extrabold text-[#101010] tracking-tight truncate">
                    {selectedTx.company}
                  </div>
                  <div className="text-xs font-mono text-[#6e6b7b] mt-0.5">
                    Reference #{selectedTx.id}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-xl font-extrabold text-[#101010] tabular-nums">
                    {formatCurrency(selectedTx.amount)}
                  </div>
                  <div className="text-[10px] text-[#6e6b7b] uppercase tracking-wider font-bold">CAD</div>
                </div>
              </div>

              {/* Transaction Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border border-[#d8d9f8]">
                  <span className="text-[#6e6b7b] block mb-1 text-[11px]">Date</span>
                  <span className="font-bold text-[#101010] tabular-nums">{selectedTx.date}</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-[#d8d9f8]">
                  <span className="text-[#6e6b7b] block mb-1 text-[11px]">Reference ID</span>
                  <span className="font-mono font-semibold text-[#101010]">{selectedTx.id}</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl col-span-2 border border-[#d8d9f8]">
                  <span className="text-[#6e6b7b] block mb-1 text-[11px]">Form 65 Statutory Line</span>
                  <span className="font-bold text-[#101010]">{selectedTx.form65Category || 'Uncategorized'}</span>
                </div>
              </div>

              {/* Statutory Compliance Proof Section */}
              <div className="space-y-2">
                {hasReceiptAttached ? (
                  <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Receipt Proof Attached &amp; Verified</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[10px] font-bold">
                        BIA Form 65 Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#101010] bg-white p-2.5 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-mono text-[11px] truncate">
                          {linkedReceipt?.fileName || selectedTx.receiptFileName || 'Receipt_Document.pdf'}
                        </span>
                      </div>
                      {(linkedReceipt?.fileUrl || selectedTx.receiptFileUrl) && (
                        <a
                          href={linkedReceipt?.fileUrl || selectedTx.receiptFileUrl}
                          download={linkedReceipt?.fileName || selectedTx.receiptFileName || 'receipt.pdf'}
                          className="text-[11px] text-[#5b56d6] font-semibold hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-900/80 leading-tight">
                      Tightly linked to transaction #{selectedTx.id} for Licensed Insolvency Trustee Sarah Jenkins' audit.
                    </p>
                  </div>
                ) : proofInfo.required ? (
                  <div className="bg-[#fbf9f5] border border-[#101010] p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#101010] text-xs font-extrabold">
                      <AlertCircle className="w-4 h-4 text-[#b45309] shrink-0" />
                      <span>Statutory Requirement: Proof Upload Needed</span>
                    </div>
                    <div className="text-xs text-[#4b4856] leading-relaxed">
                      <strong className="text-[#101010] block mb-0.5">{proofInfo.label}</strong>
                      {proofInfo.explanation}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#fbf9f5] border border-[#d8d9f8] p-3.5 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-2 text-[#101010] font-bold">
                      <Paperclip className="w-3.5 h-3.5 text-[#8c93fc]" />
                      <span>Receipt Proof (Optional)</span>
                    </div>
                    <p className="text-[11px] text-[#4b4856] leading-tight">
                      Discretionary day-to-day expenditure. Attaching a receipt is optional but recommended for your monthly reconciliation.
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Success Feedback */}
              {uploadSuccessToast && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate">{uploadSuccessToast}</span>
                </div>
              )}

              {/* Two-Button Action Layout */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadConfirmOpen(true)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    hasReceiptAttached
                      ? 'bg-white hover:bg-slate-50 text-[#101010]'
                      : proofInfo.required
                      ? 'bg-[#F9F45D] hover:brightness-105 text-[#1d1a27]'
                      : 'bg-white hover:bg-slate-50 text-[#101010]'
                  }`}
                  title={proofInfo.required ? 'Receipt / prescription upload mandatory for this transaction' : 'Upload proof receipt'}
                >
                  {hasReceiptAttached ? (
                    <>
                      <Paperclip className="w-3.5 h-3.5 text-[#8c93fc]" />
                      <span>Replace Receipt</span>
                    </>
                  ) : proofInfo.required ? (
                    <>
                      <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Upload Receipt (Required)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-[#8c93fc]" />
                      <span>Upload Receipt Proof</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTx(null);
                    onNavigateToCategorize();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-white font-bold text-xs border-[1.5px] border-[#F9F45D] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Re-categorize in AI Tool</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upload Confirmation Modal when attaching receipt/prescription/bill to a transaction */}
      {selectedTx && (
        <UploadConfirmationModal
          isOpen={isUploadConfirmOpen}
          onClose={() => setIsUploadConfirmOpen(false)}
          userId={selectedTx.userId || profile.uid}
          initialValues={{
            vendorName: selectedTx.company,
            date: selectedTx.date,
            amount: selectedTx.amount,
            category: selectedTx.form65Category || selectedTx.category,
            documentType:
              getProofRequirementInfo(selectedTx).type === 'prescription'
                ? 'Prescription'
                : 'New Receipt',
            linkedTransactionId: selectedTx.id
          }}
          onSaveReceipt={handleAttachConfirmedReceipt}
        />
      )}
    </div>
  );
};
