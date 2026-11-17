import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendUpIcon,
  TrendDownIcon,
  AutoGraphIcon,
  TrophyIcon,
  PlusIcon,
  CheckIcon,
  HistoryIcon,
  InfoCircleIcon,
  FilterIcon,
  CalendarIcon,
  SparklesIcon,
  ShieldCheckeredIcon,
  BankIcon,
  TrashIcon,
  CloseIcon,
  CancelIcon,
  SaveIcon,
  ArrowRightIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { MonthlyReport, UserProfile, FinancialGoal } from '../types';
import { 
  computeMonthlySpendingTrends, 
  computeCategoryBenchmarks, 
  saveGoalToDb, 
  deleteGoalFromDb 
} from '../lib/spendingTrendsData';
import { DebtProgress } from './DebtProgress';
import { formatCurrency } from '../lib/formatters';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';

interface SpendingTrendsViewProps {
  reports: MonthlyReport[];
  profile: UserProfile;
  goals: FinancialGoal[];
  onAddGoal: (goal: FinancialGoal) => void;
  onUpdateGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  onNavigateToReports: () => void;
}

export const SpendingTrendsView: React.FC<SpendingTrendsViewProps> = ({
  reports,
  profile,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onNavigateToReports,
}) => {
  // Chart timeframe filter: 6 months (default), 3 months, 9 months
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | 'all'>('6m');
  
  // Metric toggle visibility
  const [showTotal, setShowTotal] = useState<boolean>(true);
  const [showDiscretionary, setShowDiscretionary] = useState<boolean>(true);
  const [showNonDiscretionary, setShowNonDiscretionary] = useState<boolean>(true);
  const [showSavings, setShowSavings] = useState<boolean>(true);

  // Category benchmark filter
  const [benchmarkFilter, setBenchmarkFilter] = useState<'All' | 'Housing & Utilities' | 'Day-to-Day & Personal' | 'Non-Discretionary'>('All');

  // Goal horizon filter
  const [goalHorizonFilter, setGoalHorizonFilter] = useState<'all' | '3' | '6' | '9' | '12'>('all');

  // New Goal Modal state
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState<boolean>(false);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalDesc, setNewGoalDesc] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<FinancialGoal['category']>('Discretionary Spending');
  const [newGoalTimeframe, setNewGoalTimeframe] = useState<number>(3);
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState<string>('500');
  const [newGoalCurrentAmount, setNewGoalCurrentAmount] = useState<string>('150');
  const [newGoalUnit, setNewGoalUnit] = useState<'$' | '%' | 'tasks'>('$');
  const [newGoalNotes, setNewGoalNotes] = useState<string>('');

  // 1. Compute trend data series
  const allTrends = useMemo(() => computeMonthlySpendingTrends(reports), [reports]);

  const filteredTrends = useMemo(() => {
    if (timeframe === '3m') {
      return allTrends.slice(-3);
    }
    if (timeframe === '6m') {
      return allTrends.slice(-6);
    }
    return allTrends;
  }, [allTrends, timeframe]);

  // 2. Metrics summary
  const summaryMetrics = useMemo(() => {
    if (filteredTrends.length === 0) {
      return {
        avgSpend: 2580,
        currentSpend: 2397,
        discretionaryChangePct: -14.2,
        savingsBuffer: 574,
        surplusPayment: 159,
      };
    }
    const current = filteredTrends[filteredTrends.length - 1];
    const initial = filteredTrends[0];
    const totalSpendSum = filteredTrends.reduce((acc, curr) => acc + curr.totalSpend, 0);
    const avgSpend = Math.round(totalSpendSum / filteredTrends.length);

    const discretionaryDiff = current.discretionarySpend - initial.discretionarySpend;
    const discretionaryChangePct = initial.discretionarySpend > 0
      ? Math.round((discretionaryDiff / initial.discretionarySpend) * 100 * 10) / 10
      : 0;

    return {
      avgSpend,
      currentSpend: current.totalSpend,
      discretionaryChangePct,
      savingsBuffer: 574.11, // from NEO savings
      surplusPayment: 159,
    };
  }, [filteredTrends]);

  // 3. Category Form 65 Benchmarks
  const categoryBenchmarks = useMemo(() => computeCategoryBenchmarks(reports), [reports]);

  const filteredBenchmarks = useMemo(() => {
    if (benchmarkFilter === 'All') return categoryBenchmarks;
    return categoryBenchmarks.filter(b => b.group === benchmarkFilter);
  }, [categoryBenchmarks, benchmarkFilter]);

  // 4. Goals filtering
  const filteredGoals = useMemo(() => {
    if (goalHorizonFilter === 'all') return goals;
    const targetMonths = parseInt(goalHorizonFilter, 10);
    return goals.filter(g => g.timeframeMonths === targetMonths);
  }, [goals, goalHorizonFilter]);

  // Handle toggle completion
  const handleToggleGoalCompletion = async (goal: FinancialGoal) => {
    const updated: FinancialGoal = {
      ...goal,
      isCompleted: !goal.isCompleted,
      status: !goal.isCompleted ? 'completed' : 'on-track',
      currentAmount: !goal.isCompleted ? (goal.targetAmount || 1) : Math.max(0, (goal.currentAmount || 0) * 0.8)
    };
    onUpdateGoal(updated);
    await saveGoalToDb(updated);
  };

  // Handle submit new goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const targetVal = parseFloat(newGoalTargetAmount) || 0;
    const currentVal = parseFloat(newGoalCurrentAmount) || 0;

    let milestoneStage: FinancialGoal['milestoneStage'] = '3-Month';
    if (newGoalTimeframe === 6) milestoneStage = '6-Month';
    else if (newGoalTimeframe === 9) milestoneStage = '9-Month (Discharge)';
    else if (newGoalTimeframe >= 12) milestoneStage = '12-Month+ (Rebuild)';

    const newGoal: FinancialGoal = {
      id: `goal-${Date.now()}`,
      userId: profile.uid || 'demo-user',
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || `Complete milestone over ${newGoalTimeframe} months`,
      category: newGoalCategory,
      timeframeMonths: newGoalTimeframe,
      targetDate: new Date(Date.now() + newGoalTimeframe * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      targetAmount: targetVal,
      currentAmount: currentVal,
      unit: newGoalUnit,
      isCompleted: false,
      status: currentVal >= targetVal ? 'completed' : 'on-track',
      createdAt: new Date().toISOString(),
      milestoneStage,
      notes: newGoalNotes.trim()
    };

    onAddGoal(newGoal);
    await saveGoalToDb(newGoal);

    // Reset and close
    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalNotes('');
    setIsAddGoalModalOpen(false);
  };

  return (
    <div className="px-4 sm:px-8 py-4 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner: Financial Rehabilitation & Behaviour Change Overview */}
      <div className="bg-[#fbf9f5] text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-8 shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <TrendUpIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h1 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                Spending Trends &amp; Bankruptcy Discharge Goals
              </h1>
            </div>
            <p className="text-[#4b4856] text-xs max-w-2xl leading-relaxed">
              Track how your spending habits have improved over the past 6 months, see how your expenses compare to other Canadians with similar incomes, and monitor your progress toward discharge.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <CleanSlateButton
              variant="yellow"
              size="md"
              leftIcon={PlusIcon}
              onClick={() => setIsAddGoalModalOpen(true)}
            >
              Set Discharge Goal
            </CleanSlateButton>
            <CleanSlateButton
              variant="dark"
              size="md"
              leftIcon={CalendarIcon}
              onClick={onNavigateToReports}
            >
              View Form 65
            </CleanSlateButton>
          </div>
        </div>
      </div>

      {/* Prominent Debt Progress & Statutory Discharge Milestones Component */}
      <DebtProgress
        reports={reports}
        profile={profile}
        onNavigateToReports={onNavigateToReports}
      />

      {/* SECTION 1: 6-Month Spending Trends Interactive Line Graph */}
      <div className="bg-[#fbf9f5] text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-8 shadow-[5px_6px_0px_#000000] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#8c93fc]/25">
          <div>
            <div className="flex items-center gap-2.5">
              <TrendUpIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                Historical Spending &amp; Behaviour Change Trends
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] mt-1">
              Visualizing monthly cash outflow shifts across statutory categories from Form 65 reports
            </p>
          </div>

          {/* Segmented Timeframe Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { id: '3m', label: 'Past 3 Months' },
              { id: '6m', label: 'Past 6 Months' },
              { id: 'all', label: 'All 9 Months' }
            ].map((item) => (
              <CleanSlateButton
                key={item.id}
                variant={timeframe === item.id ? 'dark' : 'white'}
                size="xs"
                onClick={() => setTimeframe(item.id as '3m' | '6m' | 'all')}
              >
                {item.label}
              </CleanSlateButton>
            ))}
          </div>
        </div>

        {/* Metric Line Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#6e6b7b] font-bold mr-1 flex items-center gap-1 uppercase text-[11px]">
            <FilterIcon className="w-3.5 h-3.5 text-[#8c93fc]" />
            Display Lines:
          </span>
          <CleanSlateButton
            variant={showTotal ? 'dark' : 'white'}
            size="xs"
            onClick={() => setShowTotal(!showTotal)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#b6b3ff]" />
            <span>Total Spend</span>
          </CleanSlateButton>
          <CleanSlateButton
            variant={showDiscretionary ? 'dark' : 'white'}
            size="xs"
            onClick={() => setShowDiscretionary(!showDiscretionary)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
            <span>Discretionary Spend</span>
          </CleanSlateButton>
          <CleanSlateButton
            variant={showNonDiscretionary ? 'dark' : 'white'}
            size="xs"
            onClick={() => setShowNonDiscretionary(!showNonDiscretionary)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
            <span>Non-Discretionary</span>
          </CleanSlateButton>
          <CleanSlateButton
            variant={showSavings ? 'dark' : 'white'}
            size="xs"
            onClick={() => setShowSavings(!showSavings)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#46e3a5]" />
            <span>Net Surplus / Savings</span>
          </CleanSlateButton>
        </div>

        {/* High-Contrast Dark Plot Panel inside Cream Card */}
        <div className="bg-[#1d1a27] border-[1.5px] border-[#101010] rounded-2xl p-4 sm:p-5 h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredTrends}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#37314d" vertical={false} />
              <XAxis
                dataKey="monthKey"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#37314d' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#37314d' }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-[#181522] border-[1.5px] border-[#b6b3ff] p-4 rounded-2xl shadow-[4px_5px_0px_#000000] text-xs space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="font-extrabold text-white text-sm">{data.fullMonth}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            data.status === 'Submitted' ? 'bg-[#46e3a5] text-[#102a1f]' :
                            data.status === 'Overdue' ? 'bg-rose-400/20 text-rose-300' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {data.status}
                          </span>
                        </div>
                        <div className="space-y-1 pt-1 tabular-nums">
                          {showTotal && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#b6b3ff]" />
                                Total Spend:
                              </span>
                              <span className="font-bold text-white">${data.totalSpend?.toLocaleString()}</span>
                            </div>
                          )}
                          {showDiscretionary && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#f472b6]" />
                                Discretionary:
                              </span>
                              <span className="font-bold text-white">${Number(data.discretionarySpend || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {showNonDiscretionary && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                                Non-Discretionary:
                              </span>
                              <span className="font-bold text-white">${Number(data.nonDiscretionarySpend || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {showSavings && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#46e3a5]" />
                                Net Savings / Surplus:
                              </span>
                              <span className="font-bold text-[#46e3a5]">${Number(data.netSavings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 tabular-nums">
                          Surplus Income Obligation: <span className="text-white font-semibold">{formatCurrency(Number(data.surplusPayment || 0))}/mo</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#e2e8f0' }}
              />

              {showTotal && (
                <Line
                  type="monotone"
                  dataKey="totalSpend"
                  name="Total Spend"
                  stroke="#b6b3ff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#b6b3ff', strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              )}
              {showDiscretionary && (
                <Line
                  type="monotone"
                  dataKey="discretionarySpend"
                  name="Discretionary Spend"
                  stroke="#f472b6"
                  strokeWidth={2.5}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#f472b6' }}
                />
              )}
              {showNonDiscretionary && (
                <Line
                  type="monotone"
                  dataKey="nonDiscretionarySpend"
                  name="Non-Discretionary"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#38bdf8' }}
                />
              )}
              {showSavings && (
                <Line
                  type="monotone"
                  dataKey="netSavings"
                  name="Net Savings Buffer"
                  stroke="#46e3a5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#46e3a5' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Behavioural Insight Advice Box */}
        <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#b6b3ff]/25 text-[#5b52d6] border border-[#b6b3ff] flex items-center justify-center shrink-0 mt-0.5">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-[#101010] mb-0.5">
              Trustee Behaviour Insight (OSB Section 168.1 Compliance)
            </div>
            <div className="text-[#4b4856] leading-relaxed">
              Your average monthly spend has stabilized by <strong className="text-[#101010]">-14.2%</strong> over the past 6 months. By eliminating impulsive dining and keeping utility usage steady, your surplus income obligation remains locked at <strong className="text-[#101010] tabular-nums">{formatCurrency(159)}/mo</strong> instead of fluctuating. This consistent budgeting proves debtor rehabilitation to both your Licensed Insolvency Trustee and the Superintendent of Bankruptcy.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Form 65 Category Breakdown & Peer Income Benchmark Comparison */}
      <div className="bg-[#fbf9f5] text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-8 shadow-[5px_6px_0px_#000000] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#8c93fc]/25">
          <div>
            <div className="flex items-center gap-2.5">
              <BankIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                Form 65 Category Spending vs. Peer Income Benchmarks
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] mt-1">
              Compare your 6-month average spending to similar Canadian households (Net Income $4,500 - $5,500/mo, Household of 2, BC)
            </p>
          </div>

          {/* Group Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(['All', 'Housing & Utilities', 'Day-to-Day & Personal', 'Non-Discretionary'] as const).map((tab) => (
              <CleanSlateButton
                key={tab}
                variant={benchmarkFilter === tab ? 'dark' : 'white'}
                size="xs"
                onClick={() => setBenchmarkFilter(tab)}
              >
                {tab}
              </CleanSlateButton>
            ))}
          </div>
        </div>

        {/* Benchmarks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBenchmarks.map((bench) => {
            const isFrugal = bench.variancePercent <= -5;
            const isElevated = bench.variancePercent > 10;
            const maxVal = Math.max(bench.userAverageSpend, bench.peerAverageSpend) * 1.25 || 100;
            const userPct = Math.min(100, Math.round((bench.userAverageSpend / maxVal) * 100));
            const peerPct = Math.min(100, Math.round((bench.peerAverageSpend / maxVal) * 100));

            return (
              <div
                key={bench.key}
                className="bg-white border border-[#d8d9f8] hover:border-[#8c93fc] rounded-2xl p-5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6b7b]">
                        {bench.group}
                      </span>
                      <h3 className="text-sm font-extrabold text-[#101010]">
                        {bench.name}
                      </h3>
                    </div>

                    {/* Status Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 border ${
                      isFrugal
                        ? 'bg-[#46e3a5] text-[#102a1f] border-[#101010]/20'
                        : isElevated
                        ? 'bg-[#fbf050] text-[#101010] border-[#101010]/20'
                        : 'bg-[#e9e8ec] text-[#4b4856] border-[#d8d9f8]'
                    }`}>
                      {isFrugal ? (
                        <>
                          <TrendDownIcon className="w-3 h-3" />
                          {Math.abs(bench.variancePercent)}% Below Peer Avg
                        </>
                      ) : isElevated ? (
                        <>
                          <TrendUpIcon className="w-3 h-3" />
                          +{bench.variancePercent}% Above Peer Avg
                        </>
                      ) : (
                        'Matches Peer Benchmark'
                      )}
                    </span>
                  </div>

                  {/* Amounts Row */}
                  <div className="flex items-center justify-between text-xs py-2.5 border-t border-b border-[#d8d9f8]/70 my-3 tabular-nums">
                    <div>
                      <div className="text-[#6e6b7b] text-[11px]">Your 6-Mo Avg</div>
                      <div className="text-base font-extrabold text-[#101010]">
                        {formatCurrency(bench.userAverageSpend)} <span className="text-[10px] text-[#6e6b7b] font-normal">/ mo</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[#6e6b7b] text-[11px]">Similar Incomes Peer Avg</div>
                      <div className="text-base font-semibold text-[#4b4856]">
                        {formatCurrency(bench.peerAverageSpend)} <span className="text-[10px] text-[#6e6b7b] font-normal">/ mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Comparison Progress Bar */}
                  <div className="space-y-1.5 my-2">
                    <div className="flex justify-between text-[10px] text-[#6e6b7b] tabular-nums">
                      <span>You: {formatCurrency(bench.userAverageSpend)}</span>
                      <span>Benchmark: {formatCurrency(bench.peerAverageSpend)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#e9e8ec] rounded-full overflow-hidden relative border border-[#101010]/10">
                      {/* Peer Target Marker Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[#101010] z-10"
                        style={{ left: `${peerPct}%` }}
                        title={`Peer Benchmark: $${bench.peerAverageSpend}`}
                      />
                      {/* User Actual Bar */}
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFrugal ? 'bg-[#46e3a5]' : isElevated ? 'bg-[#F9F45D]' : 'bg-[#8c93fc]'
                        }`}
                        style={{ width: `${userPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-[#4b4856] flex items-center gap-1.5">
                  <InfoCircleIcon className="w-3.5 h-3.5 shrink-0 text-[#8c93fc]" />
                  <span>{bench.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form 65 Benchmark Note */}
        <div className="p-4 rounded-2xl bg-white border border-[#d8d9f8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4b4856]">
          <div className="flex items-center gap-2">
            <ShieldCheckeredIcon className="w-4 h-4 text-[#8c93fc] shrink-0" />
            <span>
              OSB Statutory Standard: Non-discretionary medical condition expenses and child care reduce surplus income calculation directly dollar-for-dollar.
            </span>
          </div>
          <span className="text-[11px] text-[#6e6b7b] font-medium shrink-0">
            Source: Office of the Superintendent of Bankruptcy (Canada)
          </span>
        </div>
      </div>

      {/* SECTION 3: Discharge Milestone & Habit Goal Setting (3, 6, 9, 12 Months) */}
      <div className="bg-[#fbf9f5] text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-8 shadow-[5px_6px_0px_#000000] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#8c93fc]/25">
          <div>
            <div className="flex items-center gap-2.5">
              <TrophyIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                Bankruptcy Discharge Milestones &amp; Financial Goals
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] mt-1">
              Set and complete targeted habits over 3, 6, and 9 months to guarantee clean discharge and post-bankruptcy stability
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CleanSlateButton
              variant="yellow"
              size="md"
              leftIcon={PlusIcon}
              onClick={() => setIsAddGoalModalOpen(true)}
            >
              Add Custom Goal
            </CleanSlateButton>
          </div>
        </div>

        {/* Milestone Timeline Roadmap */}
        <div className="space-y-4">
          <div className="text-xs font-extrabold text-[#101010] uppercase tracking-wider flex items-center justify-between">
            <span>Statutory Discharge Roadmap (9 Months)</span>
            <span className="text-[#6e6b7b] font-semibold text-xs">Section 168.1 BIA Eligibility</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: 3-Month */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              goalHorizonFilter === '3'
                ? 'bg-[#f7f4eb] border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000]'
                : 'bg-white border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb]'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e9e8ec] text-[#101010]">
                    Month 3 Milestone
                  </span>
                  <CheckIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-extrabold text-[#101010] text-sm">Budgeting &amp; 1st Counselling</div>
                <div className="text-xs text-[#4b4856] mt-1 leading-relaxed">
                  Complete 1st mandatory financial counseling session with Trustee Sarah Jenkins &amp; contain lifestyle spend.
                </div>
              </div>
              <CleanSlateButton
                variant={goalHorizonFilter === '3' ? 'periwinkle' : 'white'}
                size="xs"
                rightIcon={ArrowRightIcon}
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '3' ? 'all' : '3')}
                className="mt-3 self-start"
              >
                {goalHorizonFilter === '3' ? 'Show All Goals' : 'Filter 3-Month'}
              </CleanSlateButton>
            </div>

            {/* Step 2: 6-Month */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              goalHorizonFilter === '6'
                ? 'bg-[#f7f4eb] border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000]'
                : 'bg-white border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb]'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e9e8ec] text-[#101010]">
                    Month 6 Milestone
                  </span>
                  <HistoryIcon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-extrabold text-[#101010] text-sm">Midway Review &amp; Buffer</div>
                <div className="text-xs text-[#4b4856] mt-1 leading-relaxed">
                  Accumulate $800 - $1,000 emergency savings cushion in NEO Savings; zero overdue Form 65 reports.
                </div>
              </div>
              <CleanSlateButton
                variant={goalHorizonFilter === '6' ? 'periwinkle' : 'white'}
                size="xs"
                rightIcon={ArrowRightIcon}
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '6' ? 'all' : '6')}
                className="mt-3 self-start"
              >
                {goalHorizonFilter === '6' ? 'Show All Goals' : 'Filter 6-Month'}
              </CleanSlateButton>
            </div>

            {/* Step 3: 9-Month Discharge Target */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              goalHorizonFilter === '9'
                ? 'bg-[#f7f4eb] border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000]'
                : 'bg-white border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb]'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#fbf050] text-[#101010] border border-[#101010]/20">
                    Month 9 Discharge
                  </span>
                  <AutoGraphIcon className="w-4 h-4 text-[#101010]" />
                </div>
                <div className="font-extrabold text-[#101010] text-sm">Certificate of Discharge</div>
                <div className="text-xs text-[#4b4856] mt-1 leading-relaxed">
                  Complete 2nd financial counseling session, resolve surplus income balance, receive legal release of debts.
                </div>
              </div>
              <CleanSlateButton
                variant={goalHorizonFilter === '9' ? 'periwinkle' : 'white'}
                size="xs"
                rightIcon={ArrowRightIcon}
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '9' ? 'all' : '9')}
                className="mt-3 self-start"
              >
                {goalHorizonFilter === '9' ? 'Show All Goals' : 'Filter 9-Month'}
              </CleanSlateButton>
            </div>

            {/* Step 4: 12-Month+ Credit Rebuilding */}
            <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              goalHorizonFilter === '12'
                ? 'bg-[#f7f4eb] border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000]'
                : 'bg-white border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb]'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f]">
                    Month 12+ Rebuild
                  </span>
                  <ShieldCheckeredIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="font-extrabold text-[#101010] text-sm">Credit Score Rehabilitation</div>
                <div className="text-xs text-[#4b4856] mt-1 leading-relaxed">
                  Acquire secured credit card ($500 limit), pay 100% on time, restore credit bureau score above 650.
                </div>
              </div>
              <CleanSlateButton
                variant={goalHorizonFilter === '12' ? 'periwinkle' : 'white'}
                size="xs"
                rightIcon={ArrowRightIcon}
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '12' ? 'all' : '12')}
                className="mt-3 self-start"
              >
                {goalHorizonFilter === '12' ? 'Show All Goals' : 'Filter 12-Month'}
              </CleanSlateButton>
            </div>
          </div>
        </div>

        {/* Goal Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#8c93fc]/25">
          <span className="text-xs text-[#6e6b7b] font-bold mr-1">Time Horizon:</span>
          {(['all', '3', '6', '9', '12'] as const).map((h) => (
            <CleanSlateButton
              key={h}
              variant={goalHorizonFilter === h ? 'dark' : 'white'}
              size="xs"
              onClick={() => setGoalHorizonFilter(h)}
            >
              {h === 'all' ? 'All Horizons' : `${h} Months`}
            </CleanSlateButton>
          ))}
        </div>

        {/* Active Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const isCompleted = goal.isCompleted || goal.status === 'completed';
            const targetVal = goal.targetAmount || 1;
            const currentVal = goal.currentAmount || 0;
            const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));

            return (
              <div
                key={goal.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-[#f7f4eb] border-[#101010]'
                    : 'bg-white border-[#d8d9f8] hover:border-[#8c93fc]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="status-tag-compact bg-[#e9e8ec] text-[#101010] border border-[#d8d9f8] font-bold">
                      {goal.milestoneStage || `${goal.timeframeMonths}-month`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <CleanSlateButton
                        variant={isCompleted ? 'status-success' : 'white'}
                        size="icon"
                        onClick={() => handleToggleGoalCompletion(goal)}
                        title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                        aria-label={isCompleted ? `Mark ${goal.title} incomplete` : `Mark ${goal.title} completed`}
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                      </CleanSlateButton>
                      <CleanSlateButton
                        variant="status-error"
                        size="icon"
                        onClick={() => onDeleteGoal(goal.id)}
                        title="Delete Goal"
                        aria-label={`Delete goal ${goal.title}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </CleanSlateButton>
                    </div>
                  </div>

                  <h3 className={`text-sm font-extrabold text-[#101010] mb-1 ${isCompleted ? 'line-through text-[#6e6b7b]' : ''}`}>
                    {goal.title}
                  </h3>
                  <p className="text-xs text-[#4b4856] leading-relaxed mb-4">
                    {goal.description}
                  </p>

                  {/* Progress Tracker */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-xs tabular-nums">
                      <span className="text-[#6e6b7b]">Target Progress</span>
                      <span className="font-bold text-[#101010]">
                        {goal.unit === '$' && '$'}
                        {goal.unit === '$' ? currentVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : currentVal.toLocaleString()}
                        {goal.unit === '%' && '%'} / {goal.unit === '$' && '$'}
                        {goal.unit === '$' ? targetVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : targetVal.toLocaleString()}
                        {goal.unit === '%' && '%'}
                        {goal.unit === 'tasks' && ` / ${targetVal} Completed`}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-[#e5e7eb] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-[#46e3a5]' : 'bg-[#8c93fc]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#d8d9f8]/70 mt-2 flex items-center justify-between text-[11px] text-[#6e6b7b] tabular-nums">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-[#8c93fc]" />
                    Target: {goal.targetDate}
                  </span>
                  <span className={`font-bold ${
                    isCompleted ? 'text-emerald-700' :
                    goal.status === 'needs-attention' ? 'text-rose-700' : 'text-[#101010]'
                  }`}>
                    {isCompleted ? 'Completed' : `${progressPct}% Complete`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Set New Discharge Goal — crisp white neo-brutalist design */}
      {isAddGoalModalOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsAddGoalModalOpen(false)}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-[6px_8px_0px_#000000] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#b4b1fc]/35">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#101010]">
                  Create Discharge Goal
                </h3>
                <p className="text-xs text-[#6e6b7b] mt-0.5">
                  Set a measurable milestone across 3, 6, 9, or 12 months until bankruptcy discharge.
                </p>
              </div>
              <CleanSlateButton
                variant="white"
                size="icon"
                onClick={() => setIsAddGoalModalOpen(false)}
                aria-label="Close goal modal"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </CleanSlateButton>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <FloatingInput
                label="Goal Title"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FloatingSelect
                  label="Timeframe Horizon"
                  value={newGoalTimeframe.toString()}
                  onChange={(e) => setNewGoalTimeframe(parseInt(e.target.value, 10))}
                  options={[
                    { value: '3', label: '3 Months (Counselling & Discretionary)' },
                    { value: '6', label: '6 Months (Midway Review & Buffer)' },
                    { value: '9', label: '9 Months (Statutory Discharge Target)' },
                    { value: '12', label: '12 Months (Credit Rebuilding)' }
                  ]}
                />

                <FloatingSelect
                  label="Category"
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value as FinancialGoal['category'])}
                  options={[
                    { value: 'Discretionary Spending', label: 'Discretionary Spending' },
                    { value: 'Emergency Buffer', label: 'Emergency Buffer' },
                    { value: 'Surplus Income', label: 'Surplus Income' },
                    { value: 'Statutory Compliance', label: 'Statutory Compliance' },
                    { value: 'Post-Discharge Credit', label: 'Post-Discharge Credit' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-[#4b4856] font-bold mb-1">
                  Description / Milestone Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain how this habit proves debtor rehabilitation or supports post-discharge security..."
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  className="w-full bg-white text-[#101010] border border-[#767676] rounded-xl px-3.5 py-3 placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#a5a7fb]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FloatingSelect
                  label="Unit Type"
                  value={newGoalUnit}
                  onChange={(e) => setNewGoalUnit(e.target.value as '$' | '%' | 'tasks')}
                  options={[
                    { value: '$', label: 'Dollars ($)' },
                    { value: '%', label: 'Percent (%)' },
                    { value: 'tasks', label: 'Tasks / Count' }
                  ]}
                />

                <FloatingInput
                  type="number"
                  step="0.01"
                  label="Target Goal"
                  value={newGoalTargetAmount}
                  onChange={(e) => setNewGoalTargetAmount(e.target.value)}
                />

                <FloatingInput
                  type="number"
                  step="0.01"
                  label="Current Progress"
                  value={newGoalCurrentAmount}
                  onChange={(e) => setNewGoalCurrentAmount(e.target.value)}
                />
              </div>

              <FloatingInput
                label="Trustee Guidance / Advisory Note"
                value={newGoalNotes}
                onChange={(e) => setNewGoalNotes(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#b4b1fc]/35">
                <CleanSlateButton
                  variant="white"
                  size="md"
                  leftIcon={CancelIcon}
                  onClick={() => setIsAddGoalModalOpen(false)}
                >
                  Cancel
                </CleanSlateButton>
                <CleanSlateButton
                  type="submit"
                  variant="yellow"
                  size="md"
                  leftIcon={SaveIcon}
                >
                  Save Goal
                </CleanSlateButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
