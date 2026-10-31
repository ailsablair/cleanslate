import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  Info,
  Award
} from 'lucide-react';
import { MonthlyReport, UserProfile } from '../types';

interface DebtProgressProps {
  reports: MonthlyReport[];
  profile: UserProfile;
  totalDischargeTarget?: number;
  onNavigateToReports?: () => void;
}

export const DebtProgress: React.FC<DebtProgressProps> = ({
  reports,
  profile,
  totalDischargeTarget = 1431, // 9 months * $159/mo standard surplus obligation
  onNavigateToReports
}) => {
  // Count submitted reports as completed payments
  const submittedReports = reports.filter(r => r.status === 'Submitted');
  const submittedMonthsCount = submittedReports.length;
  const targetMonthsTotal = 9; // Statutory 9-month discharge under BIA Section 168.1

  // Monthly surplus rate from profile or reports
  const monthlyRate = 159;
  const amountPaidToDate = Math.min(totalDischargeTarget, submittedMonthsCount * monthlyRate);
  const remainingBalance = Math.max(0, totalDischargeTarget - amountPaidToDate);
  const remainingMonths = Math.max(0, targetMonthsTotal - submittedMonthsCount);
  const percentComplete = Math.min(100, Math.round((amountPaidToDate / totalDischargeTarget) * 100));

  const milestones = [
    {
      month: 1,
      label: 'Estate Filing',
      sublabel: 'Official Assignment',
      status: 'completed',
    },
    {
      month: 3,
      label: 'Counselling 1',
      sublabel: 'Budgeting & Money Habits',
      status: submittedMonthsCount >= 3 ? 'completed' : 'pending',
    },
    {
      month: 6,
      label: 'Counselling 2',
      sublabel: 'Credit Rebuilding & Goals',
      status: submittedMonthsCount >= 6 ? 'completed' : 'pending',
    },
    {
      month: 9,
      label: 'Automatic Discharge',
      sublabel: 'Debts Extinguished (BIA 168.1)',
      status: submittedMonthsCount >= 9 ? 'completed' : 'active',
    }
  ];

  return (
    <div className="bg-[#1e1b29] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#fbf050] text-[#1d1a27] flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Bankruptcy Discharge Progress
            </h3>
            <p className="text-[11px] text-slate-400">
              Track your statutory estate balance and discharge milestones under Section 168.1 of the BIA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            {remainingMonths === 0 ? 'Eligible for Discharge' : `${remainingMonths} Payments Remaining`}
          </span>
          {onNavigateToReports && (
            <button
              onClick={onNavigateToReports}
              className="text-[11px] font-semibold text-[#b6b3ff] hover:text-white flex items-center gap-1 transition"
            >
              <span>View Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Total Estate Obligation
          </span>
          <div className="text-base sm:text-lg font-bold text-white">
            ${totalDischargeTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">9 months @ $159/mo</span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Paid to Date
          </span>
          <div className="text-base sm:text-lg font-bold text-emerald-400">
            ${amountPaidToDate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-400/80">{submittedMonthsCount} of 9 payments filed</span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Remaining Balance
          </span>
          <div className="text-base sm:text-lg font-bold text-[#fbf050]">
            ${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400">{remainingMonths} monthly installments</span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Discharge Timeline
          </span>
          <div className="text-base sm:text-lg font-bold text-[#b6b3ff]">
            Month {Math.min(9, submittedMonthsCount + 1)} of 9
          </div>
          <span className="text-[10px] text-slate-400">{percentComplete}% of statutory term</span>
        </div>
      </div>

      {/* Discharge Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium">Estate Repayment Milestone</span>
          <span className="text-[#fbf050] font-bold">{percentComplete}% Complete</span>
        </div>
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#e76192] via-[#b6b3ff] to-[#45b7d1] transition-all duration-700"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Statutory Milestones Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {milestones.map((m, idx) => {
          const isDone = m.status === 'completed';
          const isActive = m.status === 'active';
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs transition ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                  : isActive
                  ? 'bg-[#b6b3ff]/15 border-[#b6b3ff]/40 text-white'
                  : 'bg-white/5 border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Month {m.month}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </div>
              <div className="font-semibold text-slate-200 text-[11px] truncate">{m.label}</div>
              <div className="text-[10px] text-slate-400 truncate">{m.sublabel}</div>
            </div>
          );
        })}
      </div>

      {/* Plain Language Summary Card for Low Financial Literacy */}
      <div className="bg-[#262235] border border-white/10 rounded-xl p-3.5 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#fbf050] shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-white block">
            What this means in plain language:
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            You only have <strong className="text-white">{remainingMonths} monthly reports and ${remainingBalance.toFixed(2)}</strong> left to complete. As long as you submit on time and attend your second counselling session, your trustee will certify your full legal discharge at month 9, wiping away all qualifying debts.
          </p>
        </div>
      </div>
    </div>
  );
};
