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
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Info, 
  SlidersHorizontal,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Check,
  Trash2
} from 'lucide-react';
import { MonthlyReport, UserProfile, FinancialGoal, Form65CategoryBenchmark } from '../types';
import { 
  computeMonthlySpendingTrends, 
  computeCategoryBenchmarks, 
  saveGoalToDb, 
  deleteGoalFromDb 
} from '../lib/spendingTrendsData';

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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner: Financial Rehabilitation & Behaviour Change Overview */}
      <div className="bg-[#1d1a27] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b6b3ff]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b6b3ff]/15 border border-[#b6b3ff]/30 text-[#b6b3ff] text-xs font-bold tracking-wide uppercase mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              Financial Behaviour & Discharge Progress
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Spending Trends & Bankruptcy Discharge Goals
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Track your financial behaviour change over the past 6 months, benchmark your statutory Form 65 expenses against peer Canadian households, and set progressive milestones toward your official discharge certificate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddGoalModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#242031] font-bold text-sm shadow-lg transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Set Discharge Goal
            </button>
            <button
              onClick={onNavigateToReports}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition"
            >
              <Calendar className="w-4 h-4 text-[#b6b3ff]" />
              View Form 65 Reports
            </button>
          </div>
        </div>

        {/* 4 Key Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          
          {/* Stat 1: Discretionary Spending Reduction */}
          <div className="bg-[#242031]/80 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>6-Mo Discretionary Trend</span>
              <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                summaryMetrics.discretionaryChangePct <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {summaryMetrics.discretionaryChangePct <= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {Math.abs(summaryMetrics.discretionaryChangePct)}%
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              {summaryMetrics.discretionaryChangePct <= 0 ? 'Disciplined' : 'Fluctuating'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summaryMetrics.discretionaryChangePct <= 0 
                ? 'Healthy reduction in non-essential lifestyle spending'
                : 'Focus on dining & personal leisure reduction'}
            </div>
          </div>

          {/* Stat 2: Current Spend vs 6-Mo Average */}
          <div className="bg-[#242031]/80 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Current vs 6-Mo Average</span>
              <span className="text-[#b6b3ff] text-xs font-bold">Avg ${summaryMetrics.avgSpend.toLocaleString()}</span>
            </div>
            <div className="text-2xl font-black text-white">
              ${summaryMetrics.currentSpend.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ${Math.abs(summaryMetrics.avgSpend - summaryMetrics.currentSpend)} {summaryMetrics.currentSpend <= summaryMetrics.avgSpend ? 'under' : 'over'} past 6-month average
            </div>
          </div>

          {/* Stat 3: Surplus Income Obligation */}
          <div className="bg-[#242031]/80 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Statutory Surplus Payment</span>
              <span className="text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/10">STABLE</span>
            </div>
            <div className="text-2xl font-black text-white">
              ${summaryMetrics.surplusPayment} <span className="text-xs font-normal text-slate-400">/ month</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Required estate installment to LIT Sarah Jenkins
            </div>
          </div>

          {/* Stat 4: Discharge Progress */}
          <div className="bg-[#242031]/80 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>9-Month Discharge Target</span>
              <span className="text-[#fbf050] font-bold text-xs">Month 7 of 9</span>
            </div>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              79%
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                On Track
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Target discharge date: June 2023 (~63 days remaining)
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 1: 6-Month Spending Trends Interactive Line Graph */}
      <div className="bg-[#1d1a27] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#b6b3ff]" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Historical Spending & Behaviour Change Trends
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing monthly cash outflow shifts across statutory categories from Form 65 reports
            </p>
          </div>

          {/* Timeframe Selector & Metric Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#242031] p-1 rounded-xl border border-white/10 flex items-center text-xs font-semibold">
              <button
                onClick={() => setTimeframe('3m')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === '3m' ? 'bg-[#b6b3ff] text-[#242031] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Past 3 Months
              </button>
              <button
                onClick={() => setTimeframe('6m')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === '6m' ? 'bg-[#b6b3ff] text-[#242031] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Past 6 Months
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === 'all' ? 'bg-[#b6b3ff] text-[#242031] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All 9 Months
              </button>
            </div>
          </div>
        </div>

        {/* Metric Line Toggles */}
        <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-white/10 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Display Lines:
          </span>
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-3 py-1 rounded-full border transition flex items-center gap-2 ${
              showTotal
                ? 'bg-[#b6b3ff]/20 border-[#b6b3ff] text-[#b6b3ff] font-bold'
                : 'bg-transparent border-white/10 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#b6b3ff]" />
            Total Spend
          </button>
          <button
            onClick={() => setShowDiscretionary(!showDiscretionary)}
            className={`px-3 py-1 rounded-full border transition flex items-center gap-2 ${
              showDiscretionary
                ? 'bg-[#f472b6]/20 border-[#f472b6] text-[#f472b6] font-bold'
                : 'bg-transparent border-white/10 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#f472b6]" />
            Discretionary Spend
          </button>
          <button
            onClick={() => setShowNonDiscretionary(!showNonDiscretionary)}
            className={`px-3 py-1 rounded-full border transition flex items-center gap-2 ${
              showNonDiscretionary
                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] font-bold'
                : 'bg-transparent border-white/10 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
            Non-Discretionary
          </button>
          <button
            onClick={() => setShowSavings(!showSavings)}
            className={`px-3 py-1 rounded-full border transition flex items-center gap-2 ${
              showSavings
                ? 'bg-emerald-400/20 border-emerald-400 text-emerald-400 font-bold'
                : 'bg-transparent border-white/10 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Net Surplus / Savings
          </button>
        </div>

        {/* Recharts Line Graph Container */}
        <div className="h-[340px] w-full">
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0]?.payload;
                    return (
                      <div className="bg-[#181522] border border-[#b6b3ff]/30 p-4 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="font-extrabold text-white text-sm">{data.fullMonth}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            data.status === 'Submitted' ? 'bg-emerald-400/20 text-emerald-400' :
                            data.status === 'Overdue' ? 'bg-rose-400/20 text-rose-400' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {data.status}
                          </span>
                        </div>
                        <div className="space-y-1 pt-1">
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
                              <span className="font-bold text-white">${data.discretionarySpend?.toLocaleString()}</span>
                            </div>
                          )}
                          {showNonDiscretionary && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                                Non-Discretionary:
                              </span>
                              <span className="font-bold text-white">${data.nonDiscretionarySpend?.toLocaleString()}</span>
                            </div>
                          )}
                          {showSavings && (
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                Net Savings / Surplus:
                              </span>
                              <span className="font-bold text-emerald-400">${data.netSavings?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400">
                          Surplus Income Obligation: <span className="text-white font-semibold">${data.surplusPayment}/mo</span>
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
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
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
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#34d399' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Behavioural Insight Advice Box */}
        <div className="mt-6 bg-[#242031] border border-[#b6b3ff]/20 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-[#b6b3ff]/20 text-[#b6b3ff] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white mb-0.5">
              Trustee Behaviour Insight (OSB Section 168.1 Compliance)
            </div>
            <div className="text-slate-300 leading-relaxed">
              Your average monthly spend has stabilized by <strong>-14.2%</strong> over the past 6 months. By eliminating impulsive dining and keeping utility usage steady, your surplus income obligation remains locked at <strong>$159/mo</strong> instead of fluctuating. This consistent budgeting proves debtor rehabilitation to both your Licensed Insolvency Trustee and the Superintendent of Bankruptcy.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Form 65 Category Breakdown & Peer Income Benchmark Comparison */}
      <div className="bg-[#1d1a27] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#fbf050]" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Form 65 Category Spending vs. Peer Income Benchmarks
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare your 6-month average spending to similar Canadian households (Net Income $4,500 - $5,500/mo, Household of 2, BC)
            </p>
          </div>

          {/* Group Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#242031] p-1.5 rounded-2xl border border-white/10 text-xs">
            {(['All', 'Housing & Utilities', 'Day-to-Day & Personal', 'Non-Discretionary'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBenchmarkFilter(tab)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  benchmarkFilter === tab
                    ? 'bg-[#b6b3ff] text-[#242031] font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Benchmarks Grid / List */}
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
                className="bg-[#242031] border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#b6b3ff]/80">
                        {bench.group}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-[#b6b3ff] transition-colors">
                        {bench.name}
                      </h3>
                    </div>

                    {/* Status Pill */}
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1 ${
                      isFrugal 
                        ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
                        : isElevated
                        ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {isFrugal ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          {Math.abs(bench.variancePercent)}% Below Peer Avg
                        </>
                      ) : isElevated ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          +{bench.variancePercent}% Above Peer Avg
                        </>
                      ) : (
                        'Matches Peer Benchmark'
                      )}
                    </span>
                  </div>

                  {/* Amounts Row */}
                  <div className="flex items-center justify-between text-xs py-2 border-t border-b border-white/5 my-3">
                    <div>
                      <div className="text-slate-400 text-[11px]">Your 6-Mo Avg</div>
                      <div className="text-base font-extrabold text-white">
                        ${bench.userAverageSpend.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-slate-400 text-[11px]">Similar Incomes Peer Avg</div>
                      <div className="text-base font-semibold text-slate-300">
                        ${bench.peerAverageSpend.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Comparison Progress Bar */}
                  <div className="space-y-1.5 my-2">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>You: ${bench.userAverageSpend}</span>
                      <span>Benchmark: ${bench.peerAverageSpend}</span>
                    </div>
                    <div className="h-3 w-full bg-[#181522] rounded-full overflow-hidden relative border border-white/5">
                      {/* Peer Target Marker Line */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10"
                        style={{ left: `${peerPct}%` }}
                        title={`Peer Benchmark: $${bench.peerAverageSpend}`}
                      />
                      {/* User Actual Bar */}
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFrugal ? 'bg-emerald-400' : isElevated ? 'bg-amber-400' : 'bg-[#b6b3ff]'
                        }`}
                        style={{ width: `${userPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-400 italic flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-[#b6b3ff]" />
                  <span>{bench.recommendation}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form 65 Benchmark Note */}
        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              OSB Statutory Standard: Non-discretionary medical condition expenses and child care reduce surplus income calculation directly dollar-for-dollar.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">
            Source: Office of the Superintendent of Bankruptcy (Canada)
          </span>
        </div>
      </div>

      {/* SECTION 3: Discharge Milestone & Habit Goal Setting (3, 6, 9, 12 Months) */}
      <div className="bg-[#1d1a27] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#fbf050]" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Bankruptcy Discharge Milestones & Financial Goals
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Set and complete targeted habits over 3, 6, and 9 months to guarantee clean discharge and post-bankruptcy stability
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddGoalModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#242031] font-bold text-xs shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Add Custom Goal
            </button>
          </div>
        </div>

        {/* Milestone Timeline Roadmap */}
        <div className="bg-[#242031] border border-white/5 rounded-2xl p-5 mb-8">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Statutory Discharge Roadmap (9 Months)</span>
            <span className="text-[#fbf050] font-semibold text-xs">Section 168.1 BIA Eligibility</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            
            {/* Step 1: 3-Month */}
            <div className={`p-4 rounded-xl border transition-all ${
              goalHorizonFilter === '3' 
                ? 'bg-[#b6b3ff]/15 border-[#b6b3ff]' 
                : 'bg-[#181522] border-white/5'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#b6b3ff]/20 text-[#b6b3ff]">
                  Month 3 Milestone
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-bold text-white text-sm">Budgeting & 1st Counselling</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Complete 1st mandatory financial counseling session with Trustee Sarah Jenkins & contain lifestyle spend.
              </div>
              <button
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '3' ? 'all' : '3')}
                className="mt-3 text-[11px] font-semibold text-[#b6b3ff] hover:underline flex items-center gap-1"
              >
                {goalHorizonFilter === '3' ? 'Show All Goals' : 'Filter 3-Month Goals &rarr;'}
              </button>
            </div>

            {/* Step 2: 6-Month */}
            <div className={`p-4 rounded-xl border transition-all ${
              goalHorizonFilter === '6' 
                ? 'bg-[#b6b3ff]/15 border-[#b6b3ff]' 
                : 'bg-[#181522] border-white/5'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#f472b6]/20 text-[#f472b6]">
                  Month 6 Milestone
                </span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-bold text-white text-sm">Midway Review & Buffer</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Accumulate $800 - $1,000 emergency savings cushion in NEO Savings; zero overdue Form 65 reports.
              </div>
              <button
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '6' ? 'all' : '6')}
                className="mt-3 text-[11px] font-semibold text-[#f472b6] hover:underline flex items-center gap-1"
              >
                {goalHorizonFilter === '6' ? 'Show All Goals' : 'Filter 6-Month Goals &rarr;'}
              </button>
            </div>

            {/* Step 3: 9-Month Discharge Target */}
            <div className={`p-4 rounded-xl border transition-all ${
              goalHorizonFilter === '9' 
                ? 'bg-[#b6b3ff]/15 border-[#b6b3ff]' 
                : 'bg-[#181522] border-white/5'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#fbf050]/20 text-[#fbf050]">
                  Month 9 Discharge
                </span>
                <Target className="w-4 h-4 text-[#fbf050]" />
              </div>
              <div className="font-bold text-white text-sm">Certificate of Discharge</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Complete 2nd financial counseling session, resolve surplus income balance, receive legal release of debts.
              </div>
              <button
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '9' ? 'all' : '9')}
                className="mt-3 text-[11px] font-semibold text-[#fbf050] hover:underline flex items-center gap-1"
              >
                {goalHorizonFilter === '9' ? 'Show All Goals' : 'Filter 9-Month Goals &rarr;'}
              </button>
            </div>

            {/* Step 4: 12-Month+ Credit Rebuilding */}
            <div className={`p-4 rounded-xl border transition-all ${
              goalHorizonFilter === '12' 
                ? 'bg-[#b6b3ff]/15 border-[#b6b3ff]' 
                : 'bg-[#181522] border-white/5'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-400">
                  Month 12+ Rebuild
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-bold text-white text-sm">Credit Score Rehabilitation</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Acquire secured credit card ($500 limit), pay 100% on time, restore credit bureau score above 650.
              </div>
              <button
                onClick={() => setGoalHorizonFilter(goalHorizonFilter === '12' ? 'all' : '12')}
                className="mt-3 text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                {goalHorizonFilter === '12' ? 'Show All Goals' : 'Filter 12-Month Goals &rarr;'}
              </button>
            </div>

          </div>
        </div>

        {/* Goal Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-slate-400 font-medium mr-1">Time Horizon:</span>
          {(['all', '3', '6', '9', '12'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setGoalHorizonFilter(h)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                goalHorizonFilter === h
                  ? 'bg-[#b6b3ff] text-[#242031] font-bold shadow-sm'
                  : 'bg-[#242031] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {h === 'all' ? 'All Horizons' : `${h} Months`}
            </button>
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
                    ? 'bg-[#181522]/90 border-emerald-400/30'
                    : 'bg-[#242031] border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#b6b3ff]/15 text-[#b6b3ff]">
                      {goal.milestoneStage || `${goal.timeframeMonths}-Month`}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleGoalCompletion(goal)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                          isCompleted
                            ? 'bg-emerald-400 text-[#242031]'
                            : 'border border-white/20 hover:border-white text-transparent hover:text-white/40'
                        }`}
                        title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className={`text-sm font-bold text-white mb-1 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                    {goal.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {goal.description}
                  </p>

                  {/* Progress Tracker */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Target Progress</span>
                      <span className="font-bold text-white">
                        {goal.unit === '$' && '$'}
                        {currentVal.toLocaleString()}
                        {goal.unit === '%' && '%'} / {goal.unit === '$' && '$'}
                        {targetVal.toLocaleString()}
                        {goal.unit === '%' && '%'}
                        {goal.unit === 'tasks' && ` / ${targetVal} Completed`}
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-[#181522] rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-400' : 'bg-[#b6b3ff]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#b6b3ff]" />
                    Target: {goal.targetDate}
                  </span>
                  <span className={`font-semibold ${
                    isCompleted ? 'text-emerald-400' : 
                    goal.status === 'needs-attention' ? 'text-rose-400' : 'text-[#fbf050]'
                  }`}>
                    {isCompleted ? 'Completed' : `${progressPct}% Complete`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Set New Discharge Goal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1d1a27] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Create Discharge Goal</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set a measurable milestone across 3, 6, 9, or 12 months until bankruptcy discharge.
                </p>
              </div>
              <button
                onClick={() => setIsAddGoalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keep Day-to-Day Food Spend under $700/mo"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-[#242031] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#b6b3ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Timeframe Horizon *
                  </label>
                  <select
                    value={newGoalTimeframe}
                    onChange={(e) => setNewGoalTimeframe(parseInt(e.target.value, 10))}
                    className="w-full bg-[#242031] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#b6b3ff]"
                  >
                    <option value={3}>3 Months (Counselling & Discretionary)</option>
                    <option value={6}>6 Months (Midway Review & Buffer)</option>
                    <option value={9}>9 Months (Statutory Discharge Target)</option>
                    <option value={12}>12 Months (Credit Rebuilding)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as FinancialGoal['category'])}
                    className="w-full bg-[#242031] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#b6b3ff]"
                  >
                    <option value="Discretionary Spending">Discretionary Spending</option>
                    <option value="Emergency Buffer">Emergency Buffer</option>
                    <option value="Surplus Income">Surplus Income</option>
                    <option value="Statutory Compliance">Statutory Compliance</option>
                    <option value="Post-Discharge Credit">Post-Discharge Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description / Milestone Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain how this habit proves debtor rehabilitation or supports post-discharge security..."
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  className="w-full bg-[#242031] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#b6b3ff]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Unit Type
                  </label>
                  <select
                    value={newGoalUnit}
                    onChange={(e) => setNewGoalUnit(e.target.value as '$' | '%' | 'tasks')}
                    className="w-full bg-[#242031] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#b6b3ff]"
                  >
                    <option value="$">Dollars ($)</option>
                    <option value="%">Percent (%)</option>
                    <option value="tasks">Tasks / Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Goal
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newGoalTargetAmount}
                    onChange={(e) => setNewGoalTargetAmount(e.target.value)}
                    className="w-full bg-[#242031] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#b6b3ff]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Current Progress
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newGoalCurrentAmount}
                    onChange={(e) => setNewGoalCurrentAmount(e.target.value)}
                    className="w-full bg-[#242031] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#b6b3ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Trustee Guidance / Advisory Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recommended during counseling session #1 with Sarah Jenkins"
                  value={newGoalNotes}
                  onChange={(e) => setNewGoalNotes(e.target.value)}
                  className="w-full bg-[#242031] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#b6b3ff]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#242031] font-bold shadow-lg"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
