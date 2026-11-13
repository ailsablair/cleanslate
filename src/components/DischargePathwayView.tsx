import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Check,
  Download,
  Calculator,
  Route
} from 'lucide-react';
import { UserProfile, MonthlyReport, Receipt } from '../types';
import { generateLITAuditPacketPDF } from '../lib/pdfAuditPacketGenerator';

interface DischargePathwayViewProps {
  profile: UserProfile;
  monthlyReports: MonthlyReport[];
  receipts: Receipt[];
  onNavigateToReports: () => void;
  onNavigateToSimulator: () => void;
}

interface Milestone {
  id: string;
  title: string;
  subtitle: string;
  statutoryRef: string;
  isCompleted: boolean;
  completedDate?: string;
  scheduledDate?: string;
  completedPrefix?: string;
  scheduledPrefix?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  category: 'counseling' | 'filing' | 'payment' | 'discharge';
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'counseling-1',
    title: 'Mandatory Financial Counselling - Session #1',
    subtitle: 'Budgeting, Money Management, and Consumer Debt Triggers',
    statutoryRef: 'Directive 1R6 · Section 66.13',
    isCompleted: true,
    completedDate: 'Friday 1 January 2022',
    scheduledDate: 'Friday 1 January 2022',
    completedPrefix: 'Confirmed Attendance:',
    scheduledPrefix: 'Scheduled:',
    status: 'completed',
    category: 'counseling'
  },
  {
    id: 'counseling-2',
    title: 'Mandatory Financial Counselling - Session #2',
    subtitle: 'Credit Rebuilding, Long-Term Savings & Avoiding Predatory Lending',
    statutoryRef: 'Directive 1R6 · Section 66.13',
    isCompleted: false,
    scheduledDate: 'Friday 1 February 2022',
    completedPrefix: 'Confirmed Attendance:',
    scheduledPrefix: 'Scheduled:',
    status: 'in-progress',
    category: 'counseling'
  },
  {
    id: 'form65-filings',
    title: 'Complete Your Monthly Income & Expenses via Form 65',
    subtitle: 'Timely submission for all 21 months of statutory statements to LIT',
    statutoryRef: 'Section 68 · Form 65',
    isCompleted: false,
    scheduledDate: 'Friday 1 February 2022',
    completedPrefix: 'Confirmed Submission:',
    scheduledPrefix: 'Scheduled:',
    status: 'in-progress',
    category: 'filing'
  },
  {
    id: 'surplus-repayment',
    title: 'Discharge Surplus Repayment Contributions',
    subtitle: 'Total assessed statutory surplus payments remitted to bankruptcy estate',
    statutoryRef: 'BIA Section 68(3)',
    isCompleted: false,
    scheduledDate: 'Ongoing Monthly',
    completedPrefix: 'Confirmed Payment:',
    scheduledPrefix: 'Scheduled:',
    status: 'in-progress',
    category: 'payment'
  },
  {
    id: 'tax-returns',
    title: 'Pre-Bankruptcy & Post-Bankruptcy Tax Returns',
    subtitle: 'Filing of tax returns by Trustee with Canada Revenue Agency (CRA)',
    statutoryRef: 'Income Tax Act · Section 128(2)',
    isCompleted: true,
    completedDate: 'Monday 20 March 2023',
    scheduledDate: 'Friday 28 April 2023',
    completedPrefix: 'Confirmed Filing:',
    scheduledPrefix: 'Scheduled:',
    status: 'completed',
    category: 'filing'
  },
  {
    id: 'section-170-report',
    title: 'Trustee Section 170 Report on Debtor Conduct',
    subtitle: 'Trustee assessment of compliance with BIA commitments recommending discharge',
    statutoryRef: 'BIA Section 170',
    isCompleted: false,
    scheduledDate: 'May 2024',
    completedPrefix: 'Confirmed Issuance:',
    scheduledPrefix: 'Scheduled:',
    status: 'upcoming',
    category: 'discharge'
  },
  {
    id: 'absolute-discharge',
    title: 'Official Certificate of Absolute Discharge',
    subtitle: 'Court/OSB issuance relieving debtor from all dischargeable unsecured debts',
    statutoryRef: 'BIA Section 169',
    isCompleted: false,
    scheduledDate: 'June 2024',
    completedPrefix: 'Confirmed Discharge:',
    scheduledPrefix: 'Scheduled:',
    status: 'upcoming',
    category: 'discharge'
  }
];

export const DischargePathwayView: React.FC<DischargePathwayViewProps> = ({
  profile,
  monthlyReports,
  receipts,
  onNavigateToReports,
  onNavigateToSimulator
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('cleanslate_discharge_milestones_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults
      }
    }
    return DEFAULT_MILESTONES;
  });

  const [isExportingAudit, setIsExportingAudit] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => {
      const updated = prev.map(m => {
        if (m.id === id) {
          const nextCompleted = !m.isCompleted;
          const formattedToday = new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          return {
            ...m,
            isCompleted: nextCompleted,
            status: nextCompleted ? ('completed' as const) : ('in-progress' as const),
            completedDate: nextCompleted ? (m.completedDate || formattedToday) : m.completedDate
          };
        }
        return m;
      });
      localStorage.setItem('cleanslate_discharge_milestones_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const handleExportAuditDossier = () => {
    setIsExportingAudit(true);
    try {
      generateLITAuditPacketPDF({
        profile,
        reports: monthlyReports,
        receipts
      });
      setExportSuccessMessage('Complete OSB Audit Packet PDF generated and downloaded!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Audit packet generation error:', err);
    } finally {
      setIsExportingAudit(false);
    }
  };

  // Status Metrics
  const completedCount = milestones.filter(m => m.isCompleted).length;
  const inProgressCount = milestones.length - completedCount;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  // Format Trustee Name into Line 1 (Name) & Line 2 (Credentials / Firm)
  const rawLitName = profile.litName || 'Sarah Jenkins, CPA, CIRP, LIT';
  const commaIdx = rawLitName.indexOf(',');
  const trusteePrimary = commaIdx !== -1 ? rawLitName.slice(0, commaIdx + 1) : rawLitName;
  const trusteeSecondary =
    commaIdx !== -1
      ? rawLitName.slice(commaIdx + 1).trim()
      : profile.litFirm || 'BDO Canada Limited';

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* Top Overview Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border border-[#1a1822] shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Route className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                PATHWAY TO DISCHARGE
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] max-w-md leading-relaxed">
              Fulfilling these steps guarantees your eligibility for an Absolute Discharge from your eligible unsecured debt.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportAuditDossier}
              disabled={isExportingAudit}
              className="px-4 py-2.5 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-semibold border border-black shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-70"
              title="Compile all reports, receipts & signed Form 65 declarations into a single OSB audit PDF"
            >
              <Download className={`w-3.5 h-3.5 text-white ${isExportingAudit ? 'animate-bounce' : ''}`} />
              <span>{isExportingAudit ? 'Generating Packet...' : 'Download Audit Packet'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToSimulator}
              className="px-4 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border border-black shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5 text-[#1d1a27]" />
              <span>Surplus Simulator</span>
            </button>
          </div>
        </div>

        {/* Audit Packet Toast */}
        {exportSuccessMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{exportSuccessMessage}</span>
          </div>
        )}

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Track progress */}
          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[144px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Track progress
            </span>
            <div className="mt-auto pt-4 space-y-2.5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.25]" />
                  <span>On Track</span>
                </span>
              </div>
              <div className="text-lg sm:text-xl text-[#101010] tabular-nums leading-tight">
                <span className="font-bold">Month 9</span>{' '}
                <span className="font-normal">of 21</span>
              </div>
            </div>
          </div>

          {/* Card 2: Target Discharge Date */}
          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[144px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Target Discharge Date
            </span>
            <div className="mt-auto pt-4">
              <div className="text-lg sm:text-xl font-bold text-[#101010] tabular-nums leading-tight">
                June, 2024
              </div>
            </div>
          </div>

          {/* Card 3: Commitments Complete */}
          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[144px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Commitments Complete
            </span>
            <div className="mt-auto pt-4 space-y-3">
              <div className="w-full bg-[#e5e7eb] h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#46e3a5] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-lg sm:text-xl text-[#101010] tabular-nums leading-tight">
                <span className="font-bold">{completedCount} of {milestones.length}</span>{' '}
                <span className="font-normal">({progressPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Assigned Trustee */}
          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[144px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Assigned Trustee
            </span>
            <div className="mt-auto pt-4 leading-snug">
              <div className="text-base sm:text-lg font-bold text-[#101010] truncate">
                {trusteePrimary}
              </div>
              <div className="text-sm sm:text-base font-normal text-[#101010] truncate">
                {trusteeSecondary}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discharge Commitments List Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border border-[#1a1822] shadow-[5px_6px_0px_#000000] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <h3 className="text-xs sm:text-sm font-extrabold text-[#101010] uppercase tracking-wide">
            DISCHARGE COMMITMENTS
          </h3>
          <span className="text-xs font-mono text-[#6e6b7b] tabular-nums">
            {completedCount} Completed · {inProgressCount} In Progress
          </span>
        </div>

        <div className="space-y-3">
          {milestones.map((milestone) => {
            const isCompleted = milestone.isCompleted;
            const datePrefix = isCompleted
              ? (milestone.completedPrefix || 'Confirmed Attendance:')
              : (milestone.scheduledPrefix || 'Scheduled:');
            const dateValue = isCompleted
              ? (milestone.completedDate || 'Completed')
              : (milestone.scheduledDate || 'Scheduled');

            return (
              <div
                key={milestone.id}
                onClick={() => toggleMilestone(milestone.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMilestone(milestone.id);
                  }
                }}
                className="bg-white rounded-2xl px-5 py-4 border border-slate-200/80 hover:border-[#8c93fc] transition flex items-start gap-4 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c93fc]"
              >
                {/* Circular Completion Checkbox */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1.5 transition ${
                    isCompleted
                      ? 'bg-[#46e3a5] border-[1.5px] border-[#101010] text-[#101010]'
                      : 'bg-white border-[1.5px] border-[#52525b] hover:border-[#101010] text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.75]" />
                </div>

                {/* Milestone Details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                    <span className="text-sm font-bold text-[#101010]">
                      {milestone.title}
                    </span>
                    <span className="text-xs font-mono text-[#6e6b7b]">
                      {milestone.statutoryRef}
                    </span>
                  </div>

                  <p className="text-xs text-[#4b4856] leading-relaxed">
                    {milestone.subtitle}
                  </p>

                  <div className="pt-0.5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full border border-[#767676]/60 bg-white text-[11px] text-[#101010] tabular-nums">
                      <span className="font-semibold mr-1">{datePrefix}</span>
                      <span>{dateValue}</span>
                    </span>

                    {milestone.id === 'form65-filings' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToReports();
                        }}
                        className="text-[11px] font-semibold text-[#5b56d6] hover:underline cursor-pointer"
                      >
                        Go to Monthly Report(s) &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful Legal FAQ Callout: What Happens at Month 21 */}
        <div className="mt-6 p-5 rounded-2xl bg-[#1d1a27] text-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#b6b3ff]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                What Happens at Month 21?
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Section 169 BIA</span>
          </div>

          <p className="text-xs text-slate-300 font-light leading-relaxed">
            When all 21 monthly Form 65 reports are submitted, both counseling sessions are attended, and assessed surplus contributions are paid, your Licensed Insolvency Trustee issues a <strong>Section 170 Report</strong> confirming complete debtor rehabilitation. You receive an <strong>Absolute Certificate of Discharge</strong>, permanently extinguishing credit cards, personal loans, and unsecured tax debts.
          </p>

          <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400">
              Need assistance booking Counseling Session 2?
            </span>
            <a
              href={`mailto:${profile.litEmail}?subject=Cleanslate: Booking Counseling Session 2`}
              className="text-[#b6b3ff] hover:text-white underline font-semibold transition"
            >
              Contact {profile.litName?.split(',')[0] || 'Trustee'} &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
