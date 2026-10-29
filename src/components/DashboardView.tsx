import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  ExternalLink
} from 'lucide-react';
import { BankAccount, Transaction, MonthlyReport, UserProfile } from '../types';
import { INITIAL_RECENT_ACTIVITY } from '../lib/mockData';

interface DashboardViewProps {
  profile: UserProfile;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  monthlyReports: MonthlyReport[];
  onNavigateToReports: () => void;
  onNavigateToBankAccounts: () => void;
  onNavigateToCategorize: () => void;
  onSyncBankAccounts: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  bankAccounts,
  transactions,
  monthlyReports,
  onNavigateToReports,
  onNavigateToBankAccounts,
  onNavigateToCategorize,
  onSyncBankAccounts,
  isSyncing
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

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

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Outstanding Alert Banner (Yellow / Amber card from design) */}
          <div className="bg-[#fbf050] text-[#1d1a27] rounded-3xl p-6 sm:p-7 shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                  You have {outstandingCount} outstanding monthly reports to submit
                </h2>
                <p className="text-sm font-medium text-[#2d283c] leading-relaxed max-w-xl">
                  You're on track! Reports are due on the <span className="font-bold underline decoration-slate-900/30">15th of every month</span>. Completing them on time is important for early discharge.
                </p>
              </div>
              <button
                onClick={onNavigateToReports}
                className="shrink-0 bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold px-5 py-3 rounded-2xl shadow transition flex items-center justify-center gap-1.5 self-start sm:self-center"
              >
                <span>Complete Form 65</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3 Metric Cards (Lavender `#b4b1fc` from design) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Monthly Reports */}
            <div 
              onClick={onNavigateToReports}
              className="bg-[#b4b1fc] hover:bg-[#bebbff] text-[#242031] rounded-3xl p-6 transition cursor-pointer shadow-sm relative group"
            >
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#3f3b54] mb-3">
                MONTHLY REPORTS
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-2xl sm:text-3xl font-black">
                  {completionPercent}% <span className="text-sm font-semibold opacity-75">({submittedCount})</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#242031]/10 flex items-center justify-center text-[#242031] group-hover:bg-[#242031]/20 transition">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              {/* Progress bar line matching the screenshot */}
              <div className="w-full bg-[#242031]/20 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#242031] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Average Spend */}
            <div 
              onClick={onNavigateToBankAccounts}
              className="bg-[#b4b1fc] hover:bg-[#bebbff] text-[#242031] rounded-3xl p-6 transition cursor-pointer shadow-sm relative group"
            >
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#3f3b54] mb-3">
                AVERAGE SPEND
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-2xl sm:text-3xl font-black">
                  $ 2,397.22
                </div>
                <div className="w-8 h-8 rounded-full bg-[#242031]/10 flex items-center justify-center text-[#242031] group-hover:bg-[#242031]/20 transition">
                  <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="w-full bg-[#242031]/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#242031] h-full rounded-full w-2/3" />
              </div>
            </div>

            {/* Metric 3: Current Payment */}
            <div 
              onClick={onNavigateToReports}
              className="bg-[#b4b1fc] hover:bg-[#bebbff] text-[#242031] rounded-3xl p-6 transition cursor-pointer shadow-sm relative group"
            >
              <div className="text-[11px] font-bold tracking-wider uppercase text-[#3f3b54] mb-3">
                CURRENT PAYMENT
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-2xl sm:text-3xl font-black">
                  $ {currentPayment}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#242031]/10 flex items-center justify-center text-[#242031] group-hover:bg-[#242031]/20 transition">
                  <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="text-[11px] font-medium text-[#3f3b54] opacity-90 truncate">
                Superintendent surplus target
              </div>
            </div>
          </div>

          {/* LATEST TRANSACTIONS Card (Off-white / cream `#fbf9f5`) */}
          <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold tracking-wider uppercase text-[#242031]">
                LATEST TRANSACTIONS
              </h3>
              <button
                onClick={onNavigateToCategorize}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
              >
                <span>AI Categorizer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80 pb-3">
                    <th className="pb-3 font-semibold">Transaction ID</th>
                    <th className="pb-3 font-semibold">Company</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transactions.slice(0, 4).map((tx) => (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-slate-100/70 transition cursor-pointer group"
                    >
                      <td className="py-4 text-xs font-mono text-slate-500 font-normal">
                        {tx.id}
                      </td>
                      <td className="py-4 font-bold text-slate-800">
                        {tx.company}
                      </td>
                      <td className="py-4 text-xs text-slate-500">
                        {tx.date}
                      </td>
                      <td className="py-4 text-right font-black text-slate-900">
                        $ {tx.amount.toFixed(2)}
                      </td>
                      <td className="py-4 text-right text-slate-300 group-hover:text-slate-700 transition">
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Connected Bank Accounts (Bottom 3 cards - dynamic API driven!) */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  CONNECTED BANK ACCOUNTS (LIVE AGGREGATOR API)
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
                className="text-xs font-bold text-[#b6b3ff] hover:text-white transition flex items-center gap-1"
              >
                <span>Manage & Add Accounts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={onNavigateToBankAccounts}
                  className="bg-[#fbf9f5] hover:bg-white text-[#242031] rounded-3xl p-6 shadow-sm transition cursor-pointer group relative"
                >
                  <div className="text-[12px] font-extrabold uppercase tracking-wide text-slate-900 mb-1 truncate">
                    {account.name}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mb-6">
                    {account.accountMask}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      $ {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-slate-400 group-hover:text-slate-900 transition">
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
        </div>

        {/* Right Side Column (1/3 width): RECENT ACTIVITY */}
        <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-extrabold tracking-wider uppercase text-[#242031]">
              RECENT ACTIVITY
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Feed
            </span>
          </div>

          <div className="space-y-4">
            {INITIAL_RECENT_ACTIVITY.map((act) => (
              <div 
                key={act.id} 
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100/60 transition group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Vendor Avatar / Logo icon */}
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs shrink-0">
                    {act.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {act.company}
                    </div>
                    <div className="text-xs font-mono text-slate-400 truncate">
                      {act.ref}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs text-slate-500 font-medium">
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sell All / See All button at bottom matching design */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={onNavigateToCategorize}
              className="w-full py-3 px-4 rounded-2xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <span>See All Activity</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick transaction inspect modal */}
      {selectedTx && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setSelectedTx(null)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                Transaction Details
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{selectedTx.company}</div>
              <div className="text-xl font-black text-[#fbf050] mt-1">$ {selectedTx.amount.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Date</span>
                <span className="font-semibold text-white">{selectedTx.date}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Reference ID</span>
                <span className="font-mono text-white">{selectedTx.id}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl col-span-2">
                <span className="text-slate-400 block mb-1">Form 65 Statutory Line</span>
                <span className="font-semibold text-white">{selectedTx.form65Category || 'Uncategorized'}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedTx(null);
                  onNavigateToCategorize();
                }}
                className="w-full py-2.5 rounded-xl bg-[#b6b3ff] text-[#242031] font-bold text-xs hover:bg-white transition"
              >
                Re-categorize in AI Tool
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
