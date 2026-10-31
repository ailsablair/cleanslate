import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle, 
  DollarSign, 
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MonthlyReport, UserProfile } from '../types';

interface BudgetSummaryProps {
  currentReport?: MonthlyReport;
  profile: UserProfile;
  onNavigateToReports: () => void;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  currentReport,
  profile,
  onNavigateToReports
}) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Income calculations
  const debtorIncome = currentReport?.income 
    ? Object.values(currentReport.income.debtor).reduce((a, b) => a + Number(b || 0), 0)
    : 3850;
  const spouseIncome = currentReport?.income
    ? Object.values(currentReport.income.spouse).reduce((a, b) => a + Number(b || 0), 0)
    : 2400;
  const totalIncome = debtorIncome + spouseIncome;

  // Non-Discretionary Expenses
  const nonDiscretionary = currentReport?.nonDiscretionary
    ? (Object.values(currentReport.nonDiscretionary)
        .filter(val => typeof val === 'number')
        .reduce((a, b) => a + Number(b || 0), 0) as number)
    : 635;

  // Discretionary Expenses breakdown
  const housing = currentReport?.discretionary?.housing
    ? Object.values(currentReport.discretionary.housing).reduce((a, b) => a + Number(b || 0), 0)
    : 2090;
  const personal = currentReport?.discretionary?.personal
    ? Object.values(currentReport.discretionary.personal).reduce((a, b) => a + Number(b || 0), 0)
    : 25;
  const medical = currentReport?.discretionary?.medical
    ? Object.values(currentReport.discretionary.medical).reduce((a, b) => a + Number(b || 0), 0)
    : 80;
  const livingAndTransit = currentReport?.discretionary
    ? (Object.values(currentReport.discretionary.dayToDay).reduce((a, b) => a + Number(b || 0), 0) +
       Object.values(currentReport.discretionary.transportation).reduce((a, b) => a + Number(b || 0), 0))
    : 1295;
  const insuranceAndPayments = currentReport?.discretionary
    ? (Object.values(currentReport.discretionary.insurance).reduce((a, b) => a + Number(b || 0), 0) +
       (currentReport.discretionary.payments?.toSecuredCreditor || 0) +
       (currentReport.discretionary.payments?.otherThanMortgageOrVehicle || 0))
    : 280;

  const totalLivingExpenses = housing + personal + medical + livingAndTransit + insuranceAndPayments;

  // Monthly Surplus Income Payment to Bankruptcy Estate
  const estatePayment = currentReport?.discretionary?.payments?.toEstate || 159;

  // Remaining Disposable Buffer
  const remainingSavings = Math.max(0, totalIncome - nonDiscretionary - totalLivingExpenses - estatePayment);

  // Bankruptcy Repayment Milestones
  // Standard Canadian bankruptcy: 9 months without surplus, 21 months with surplus
  const completedMonths = 9;
  const totalTargetMonths = 21; // With surplus obligations
  const repaymentProgressPercent = Math.min(100, Math.round((completedMonths / totalTargetMonths) * 100));
  const totalPaidToEstate = completedMonths * estatePayment;
  const totalTargetToEstate = totalTargetMonths * estatePayment;

  // Doughnut Chart Data Structure
  const chartData = [
    { name: 'Estate Payment (Trustee)', value: estatePayment, color: '#e76192', description: 'Statutory surplus paid to your LIT for creditors' },
    { name: 'Living Expenses', value: totalLivingExpenses, color: '#b4b1fc', description: 'Housing, food, transit & utilities' },
    { name: 'Non-Discretionary Deductions', value: nonDiscretionary, color: '#45b7d1', description: 'Medical prescriptions, childcare & court orders' },
    { name: 'Retained Cash Buffer', value: remainingSavings, color: '#fbf050', description: 'Household buffer retained after all statutory costs' }
  ];

  return (
    <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 space-y-6">
      {/* Header with Title and Month Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold tracking-wide uppercase text-[#242031]">
              BUDGET SUMMARY & REPAYMENT TRACKER
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              BIA Form 65
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual breakdown of statutory income allocation, monthly surplus contributions, and discharge progress.
          </p>
        </div>

        <button
          onClick={onNavigateToReports}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition self-start sm:self-center"
        >
          <span>{currentReport?.month || 'September'} {currentReport?.year || '2022'} Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main 2-Column Section: Doughnut Chart (Left) + Breakdown & Progress (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Doughnut Chart Canvas (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#fbf9f5"
                      strokeWidth={2}
                      className="cursor-pointer transition-opacity hover:opacity-85"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: '#1d1a27',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label in the Doughnut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Monthly Income
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                ${totalIncome.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                On Track
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center font-medium mt-1">
            Hover or tap slices to inspect budget allocations
          </div>
        </div>

        {/* Legend & Breakdown List (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {chartData.map((item) => {
              const percent = Math.round((item.value / (totalIncome || 1)) * 100);
              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveSegment(item.name)}
                  onMouseLeave={() => setActiveSegment(null)}
                  className={`p-3 rounded-2xl border transition cursor-default ${
                    activeSegment === item.name
                      ? 'bg-white border-slate-400 shadow-xs'
                      : 'bg-white/80 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-slate-900 shrink-0 ml-1">
                      {percent}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs pt-0.5">
                    <span className="text-sm font-black text-slate-900">
                      $ {item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">CAD</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bankruptcy Estate Repayment Milestone Strip */}
          <div className="bg-[#1d1a27] text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#b4b1fc] block">
                  Discharge Repayment Progress (Month {completedMonths} of {totalTargetMonths})
                </span>
                <span className="text-sm font-black text-white">
                  $ {totalPaidToEstate.toLocaleString()} of $ {totalTargetToEstate.toLocaleString()} Paid to LIT
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-[#fbf050]">
                  {repaymentProgressPercent}% Complete
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  {totalTargetMonths - completedMonths} months remaining
                </span>
              </div>
            </div>

            {/* Repayment Progress Bar */}
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-[#e76192] via-[#b4b1fc] to-[#fbf050] h-full rounded-full transition-all duration-500"
                style={{ width: `${repaymentProgressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Current monthly surplus: <strong>${estatePayment}/mo</strong></span>
              </span>
              <span className="text-slate-400 text-[10px]">
                Target Discharge: <strong>June 2024</strong>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
