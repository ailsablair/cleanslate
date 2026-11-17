import React from 'react';
import {
  CheckIcon,
  SparklesIcon,
  ChevronRightIcon,
  HistoryIcon,
  TrophyIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { MonthlyReport, UserProfile } from '../types';
import { formatCurrency } from '../lib/formatters';

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
    <div className="bg-[#fbf9f5] text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-8 shadow-[5px_6px_0px_#000000] space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#8c93fc]/25">
        <div className="flex items-start gap-2.5">
          <TrophyIcon className="w-5 h-5 text-[#8c93fc] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#101010] uppercase tracking-wide">
              Bankruptcy Discharge Progress
            </h3>
            <p className="text-xs text-[#4b4856] mt-0.5">
              Track your statutory estate balance and discharge milestones under Section 168.1 of the BIA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20 text-[11px] font-bold">
            {remainingMonths === 0 ? 'Eligible for Discharge' : `${remainingMonths} Payments Remaining`}
          </span>
          {onNavigateToReports && (
            <CleanSlateButton
              variant="white"
              size="xs"
              rightIcon={ChevronRightIcon}
              onClick={onNavigateToReports}
            >
              View Reports
            </CleanSlateButton>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs text-[#6e6b7b] font-medium">
            Total Estate Obligation
          </span>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-extrabold text-[#101010] tabular-nums">
              {formatCurrency(totalDischargeTarget)}
            </div>
            <span className="text-[11px] text-[#6e6b7b] tabular-nums">9 months @ {formatCurrency(159)}/mo</span>
          </div>
        </div>

        <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs text-[#6e6b7b] font-medium">
            Paid to Date
          </span>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums">
              {formatCurrency(amountPaidToDate)}
            </div>
            <span className="text-[11px] text-[#6e6b7b] tabular-nums">{submittedMonthsCount} of 9 payments filed</span>
          </div>
        </div>

        <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs text-[#6e6b7b] font-medium">
            Remaining Balance
          </span>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-extrabold text-[#101010] tabular-nums">
              {formatCurrency(remainingBalance)}
            </div>
            <span className="text-[11px] text-[#6e6b7b] tabular-nums">{remainingMonths} monthly installments</span>
          </div>
        </div>

        <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs text-[#6e6b7b] font-medium">
            Discharge Timeline
          </span>
          <div className="mt-3">
            <div className="text-lg sm:text-xl font-extrabold text-[#101010] tabular-nums">
              Month {Math.min(9, submittedMonthsCount + 1)} <span className="font-normal text-base">of 9</span>
            </div>
            <span className="text-[11px] text-[#6e6b7b] tabular-nums">{percentComplete}% of statutory term</span>
          </div>
        </div>
      </div>

      {/* Discharge Progress Bar */}
      <div className="space-y-2 bg-white border border-[#d8d9f8] rounded-2xl p-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#101010] font-bold">Estate Repayment Milestone</span>
          <span className="text-[#101010] font-extrabold tabular-nums">{percentComplete}% Complete</span>
        </div>
        <div className="w-full bg-[#e5e7eb] h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#46e3a5] transition-all duration-700"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Statutory Milestones Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {milestones.map((m, idx) => {
          const isDone = m.status === 'completed';
          const isActive = m.status === 'active';
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-xs transition ${
                isDone
                  ? 'bg-[#f7f4eb] border-[#101010]'
                  : isActive
                  ? 'bg-white border-[#2d2a37] shadow-[2px_3px_0px_#a5a7fb]'
                  : 'bg-white border-[#d8d9f8]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6e6b7b]">
                  Month {m.month}
                </span>
                {isDone ? (
                  <span className="w-5 h-5 rounded-md bg-[#46e3a5] border border-[#101010] flex items-center justify-center shrink-0">
                    <CheckIcon className="w-3 h-3 text-[#101010]" />
                  </span>
                ) : (
                  <HistoryIcon className="w-4 h-4 text-[#6e6b7b] shrink-0" />
                )}
              </div>
              <div className="font-bold text-[#101010] text-xs truncate">{m.label}</div>
              <div className="text-[11px] text-[#6e6b7b] truncate mt-0.5">{m.sublabel}</div>
            </div>
          );
        })}
      </div>

      {/* Plain Language Summary Card */}
      <div className="bg-[#1d1a27] text-white border-[1.5px] border-[#101010] rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <SparklesIcon className="w-4 h-4 text-[#F9F45D] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-white block">
            What this means in plain language:
          </span>
          <p className="text-slate-300 text-xs leading-relaxed">
            You only have <strong className="text-[#F9F45D]">{remainingMonths} monthly reports and {formatCurrency(remainingBalance)}</strong> left to complete. As long as you submit on time and attend your second counselling session, your trustee will certify your full legal discharge at month 9, wiping away all qualifying debts.
          </p>
        </div>
      </div>
    </div>
  );
};
