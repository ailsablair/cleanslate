import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  Award, 
  ChevronRight, 
  ArrowUpRight, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { UserProfile, MonthlyReport, Receipt } from '../types';
import { generateLITAuditPacketPDF } from '../lib/pdfAuditPacketGenerator';
import { formatCurrency } from '../lib/formatters';

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
  status: 'completed' | 'in-progress' | 'upcoming';
  category: 'counseling' | 'filing' | 'payment' | 'discharge';
}

export const DischargePathwayView: React.FC<DischargePathwayViewProps> = ({
  profile,
  monthlyReports,
  receipts,
  onNavigateToReports,
  onNavigateToSimulator
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('cleanslate_discharge_milestones');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'counseling-1',
        title: 'Mandatory Financial Counseling Session 1',
        subtitle: 'Budgeting, Money Management, and Consumer Debt Triggers',
        statutoryRef: 'BIA Directive No. 1R6 · Section 66.13',
        isCompleted: true,
        completedDate: 'November 15, 2022',
        status: 'completed',
        category: 'counseling'
      },
      {
        id: 'counseling-2',
        title: 'Mandatory Financial Counseling Session 2',
        subtitle: 'Credit Rebuilding, Long-Term Savings & Avoiding Predatory Lenders',
        statutoryRef: 'BIA Directive No. 1R6 · Section 66.13',
        isCompleted: false,
        completedDate: undefined,
        status: 'in-progress',
        category: 'counseling'
      },
      {
        id: 'form65-filings',
        title: 'Monthly Form 65 Income & Expense Filings',
        subtitle: 'Timely submission of all 21 monthly statutory statements to LIT',
        statutoryRef: 'BIA Section 68 · Form 65',
        isCompleted: false,
        status: 'in-progress',
        category: 'filing'
      },
      {
        id: 'surplus-repayment',
        title: 'Discharge Surplus Repayment Contributions',
        subtitle: 'Total assessed statutory surplus payments remitted to bankruptcy estate',
        statutoryRef: 'BIA Section 68(3)',
        isCompleted: false,
        status: 'in-progress',
        category: 'payment'
      },
      {
        id: 'tax-returns',
        title: 'Pre-Bankruptcy & Post-Bankruptcy Tax Returns',
        subtitle: 'Filing of tax returns by Trustee with Canada Revenue Agency (CRA)',
        statutoryRef: 'Income Tax Act · Section 128(2)',
        isCompleted: true,
        completedDate: 'March 20, 2023',
        status: 'completed',
        category: 'filing'
      },
      {
        id: 'section-170-report',
        title: 'Trustee Section 170 Report on Debtor Conduct',
        subtitle: 'Trustee assessment of compliance with BIA commitments recommending discharge',
        statutoryRef: 'BIA Section 170',
        isCompleted: false,
        status: 'upcoming',
        category: 'discharge'
      },
      {
        id: 'absolute-discharge',
        title: 'Official Certificate of Absolute Discharge',
        subtitle: 'Court/OSB issuance relieving debtor from all dischargeable unmanageable debts',
        statutoryRef: 'BIA Section 169',
        isCompleted: false,
        status: 'upcoming',
        category: 'discharge'
      }
    ];
  });

  const [activeInfoMilestone, setActiveInfoMilestone] = useState<string | null>(null);
  const [isExportingAudit, setIsExportingAudit] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => {
      const updated = prev.map(m => {
        if (m.id === id) {
          const nextCompleted = !m.isCompleted;
          return {
            ...m,
            isCompleted: nextCompleted,
            status: nextCompleted ? ('completed' as const) : ('in-progress' as const),
            completedDate: nextCompleted ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
          };
        }
        return m;
      });
      localStorage.setItem('cleanslate_discharge_milestones', JSON.stringify(updated));
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
  const progressPercent = Math.round((completedCount / milestones.length) * 100);
  const submittedReports = monthlyReports.filter(r => r.status === 'Submitted').length;

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      
      {/* Top Banner Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide uppercase">
                Pathway to Discharge: Statutory Commitments Tracker
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl font-light leading-relaxed">
              Track your legal commitments under the Canadian Bankruptcy and Insolvency Act (BIA). Fulfilling these steps guarantees your eligibility for an Absolute Discharge from eligible unsecured debt.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleExportAuditDossier}
              disabled={isExportingAudit}
              className="px-4 py-2.5 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-70"
              title="Compile all reports, receipts & signed Form 65 declarations into a single OSB audit PDF"
            >
              <Download className={`w-3.5 h-3.5 text-[#b6b3ff] ${isExportingAudit ? 'animate-bounce' : ''}`} />
              <span>{isExportingAudit ? 'Generating Dossier...' : 'Export Complete LIT Audit Packet'}</span>
            </button>

            <button
              onClick={onNavigateToSimulator}
              className="px-3.5 py-2.5 rounded-xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#1d1a27] text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-800" />
              <span>Surplus Simulator</span>
            </button>
          </div>
        </div>

        {/* Audit Packet Toast */}
        {exportSuccessMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">{exportSuccessMessage}</span>
          </div>
        )}

        {/* Main Countdown Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Statutory Discharge Track
            </span>
            <div className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>21-Month Track</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-light mt-0.5 block">
              Month 9 of 21 (12 months remaining)
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Target Discharge Date
            </span>
            <div className="text-xl font-bold text-slate-900">
              June 2024
            </div>
            <span className="text-[11px] text-slate-500 font-light mt-0.5 block">
              Earliest statutory eligibility window
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Commitments Completed
            </span>
            <div className="text-xl font-bold text-slate-900">
              {completedCount} of {milestones.length} ({progressPercent}%)
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className="bg-[#242031] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Assigned Trustee Contact
            </span>
            <div className="text-sm font-bold text-slate-900 truncate">
              {profile.litName || 'Sarah Jenkins, LIT'}
            </div>
            <span className="text-[11px] text-slate-500 font-light truncate block">
              {profile.litFirm || 'BDO Canada Limited'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Milestones List */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Mandatory Bankruptcy Commitments (BIA Checklist)
            </h3>
            <p className="text-[11px] text-slate-500 font-light">
              Click a milestone to mark as completed or inspect statutory directives
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {completedCount} Completed · {milestones.length - completedCount} In Progress
          </span>
        </div>

        <div className="space-y-3">
          {milestones.map((milestone, idx) => {
            const isCompleted = milestone.isCompleted;
            return (
              <div
                key={milestone.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none ${
                  isCompleted
                    ? 'bg-white border-emerald-200 hover:border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
                onClick={() => toggleMilestone(milestone.id)}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Checkbox circle */}
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-2xs' 
                        : 'border-2 border-slate-300 hover:border-slate-500 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold truncate ${isCompleted ? 'text-slate-900 line-through text-slate-500' : 'text-slate-900'}`}>
                        {milestone.title}
                      </span>
                      <span className="text-[6.5px] font-mono text-slate-400 bg-slate-100 px-1.5 py-[2px] rounded shrink-0">
                        {milestone.statutoryRef}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      {milestone.subtitle}
                    </p>

                    {milestone.completedDate && (
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completed on {milestone.completedDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-[6.5px] font-bold uppercase tracking-wider px-2 py-[2px] rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : milestone.status === 'in-progress'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? 'Fulfilled' : milestone.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Discharge Legal FAQ Accordion Callout */}
        <div className="mt-6 p-5 rounded-2xl bg-[#1d1a27] text-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#b6b3ff]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                What Happens at Month 21?
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Section 169 BIA</span>
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
