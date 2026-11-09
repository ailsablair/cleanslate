import React, { useState } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Car, 
  Briefcase, 
  HeartPulse, 
  Users, 
  DollarSign, 
  Send, 
  Bot, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { UserProfile } from '../types';
import { formatCurrency } from '../lib/formatters';
import { FloatingInput } from './FloatingInput';

interface SurplusSimulatorViewProps {
  profile: UserProfile;
  onNavigateToReports: () => void;
  onNavigateToPathway: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'litbot';
  text: string;
  time: string;
  highlight?: string;
}

export const SurplusSimulatorView: React.FC<SurplusSimulatorViewProps> = ({
  profile,
  onNavigateToReports,
  onNavigateToPathway
}) => {
  // Simulator State
  const [householdSize, setHouseholdSize] = useState<number>(profile.householdSize || 2);
  const [baseIncome, setBaseIncome] = useState<number>(6680.00);
  const [baseDeductions, setBaseDeductions] = useState<number>(1200.00);

  // What-If Dynamic Adjusters
  const [extraIncome, setExtraIncome] = useState<number>(500.00);
  const [extraDeductions, setExtraDeductions] = useState<number>(0.00);
  const [simulatedReason, setSimulatedReason] = useState<string>('Overtime Shift (10-15 hrs/mo)');

  // LITbot Interactive Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'litbot',
      text: "Hello Chad! I am your Virtual Licensed Insolvency Trustee (LITbot). In Canadian bankruptcy law under BIA Section 68, many debtors worry that earning extra income will be completely clawed back. The golden rule is: You always keep at least 50% of any surplus earnings in your pocket! Adjust the sliders above or ask me a scenario question below.",
      time: 'Just now'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');

  // OSB Canadian Statutory Household Thresholds (Directive 11R2-2024 standards)
  const getThreshold = (size: number) => {
    switch (size) {
      case 1: return 2400.00;
      case 2: return 2980.00;
      case 3: return 3600.00;
      case 4: return 4200.00;
      case 5: return 4800.00;
      default: return 4800.00 + (size - 5) * 600.00;
    }
  };

  const activeThreshold = getThreshold(householdSize);

  // Calculations
  const baselineSurplusBasis = Math.max(0, baseIncome - baseDeductions);
  const baselineSurplus = Math.max(0, (baselineSurplusBasis - activeThreshold) * 0.5);

  const newTotalIncome = baseIncome + extraIncome;
  const newTotalDeductions = baseDeductions + extraDeductions;
  const newSurplusBasis = Math.max(0, newTotalIncome - newTotalDeductions);
  const newCalculatedSurplus = Math.max(0, (newSurplusBasis - activeThreshold) * 0.5);

  const surplusDelta = newCalculatedSurplus - baselineSurplus;
  const netTakeHomeGain = extraIncome - Math.max(0, surplusDelta);

  // Discharge Timeline Status
  const isSurplusOver200 = newCalculatedSurplus >= 200.00;

  // Preset quick scenarios
  const applyPreset = (title: string, income: number, deductions: number, reason: string) => {
    setExtraIncome(income);
    setExtraDeductions(deductions);
    setSimulatedReason(reason);
  };

  const handleAskQuestion = (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');

    // Generate authoritative Canadian BIA guidance
    setTimeout(() => {
      let botResponse = "";
      const lower = q.toLowerCase();

      if (lower.includes('overtime') || lower.includes('extra') || lower.includes('500') || lower.includes('raise')) {
        botResponse = "If you earn $500 in overtime, your net surplus basis increases by $500. Under statutory BIA rules, 50% ($250.00) is paid to the trustee estate, and the remaining 50% ($250.00) stays in your pocket! You are NEVER penalized for earning more money during bankruptcy—you always take home more cash.";
      } else if (lower.includes('car') || lower.includes('vehicle') || lower.includes('transportation')) {
        botResponse = "Under OSB guidelines, reasonable transportation expenses required for employment (e.g. gas, maintenance, mandatory vehicle insurance, or transit passes) are allowable Form 65 expenses. If purchasing a modest vehicle is necessary to keep your job, the ongoing fuel/insurance reduces your discretionary income, keeping your surplus payments balanced.";
      } else if (lower.includes('medical') || lower.includes('prescription') || lower.includes('cannabis')) {
        botResponse = "Prescription medicines, physician-authorized treatments (including medical cannabis), and necessary dental/optical expenses not covered by provincial health insurance qualify as statutory Non-Discretionary Deductions. Every dollar spent on verified medical expenses directly reduces your surplus basis dollar-for-dollar.";
      } else if (lower.includes('spouse') || lower.includes('partner') || lower.includes('wife') || lower.includes('husband')) {
        botResponse = "Your spouse's income is used only to determine the household's proportional share of the OSB threshold under BIA Directive 11R2. A spouse is never personally liable for your individual bankruptcy debt, but household income pooling ensures fair surplus calculation.";
      } else {
        botResponse = `Under the Canadian Bankruptcy and Insolvency Act, every change in monthly net income or mandatory living costs is reported on your monthly Form 65. With a household of ${householdSize}, your statutory threshold is ${formatCurrency(activeThreshold)}. Keep all receipts in your CleanSlate Vault so your trustee (${profile.litName || 'Sarah Jenkins, LIT'}) can apply every allowable deduction.`;
      }

      const botMsg: Message = {
        id: 'b_' + Date.now(),
        sender: 'litbot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      
      {/* Top Banner / Header Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide uppercase">
                Virtual LIT & Surplus Income Projection Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl font-light leading-relaxed">
              Test how variable earnings (overtime, commissions, holiday pay) or new mandatory costs (work car, daycare, prescription therapy) impact your monthly Form 65 payment and discharge eligibility.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setExtraIncome(500);
                setExtraDeductions(0);
                setHouseholdSize(profile.householdSize || 2);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Values</span>
            </button>

            <button
              onClick={onNavigateToPathway}
              className="px-4 py-2.5 rounded-xl bg-[#1d1a27] hover:bg-[#2e293f] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-[#b6b3ff]" />
              <span>View Pathway to Discharge</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Pills */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto text-xs pb-1 select-none">
          <span className="text-[11px] font-semibold uppercase text-slate-400 shrink-0">
            Test Preset Scenarios:
          </span>
          <button
            onClick={() => applyPreset('Overtime Shift (10-15 hrs)', 500, 0, '10-15 hrs of monthly overtime pay')}
            className={`px-3 py-1.5 rounded-xl border transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              extraIncome === 500 && extraDeductions === 0
                ? 'bg-[#1d1a27] text-white border-[#1d1a27] font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-normal'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>+$500 Overtime Shift</span>
          </button>

          <button
            onClick={() => applyPreset('Work Commuter Vehicle', 0, 380, 'Monthly fuel, maintenance & insurance for job commuting')}
            className={`px-3 py-1.5 rounded-xl border transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              extraIncome === 0 && extraDeductions === 380
                ? 'bg-[#1d1a27] text-white border-[#1d1a27] font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-normal'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>New Work Vehicle Expenses (-$380/mo)</span>
          </button>

          <button
            onClick={() => applyPreset('Medical Prescription Hike', 0, 180, 'Prescriptions and medical therapy condition expenses')}
            className={`px-3 py-1.5 rounded-xl border transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              extraIncome === 0 && extraDeductions === 180
                ? 'bg-[#1d1a27] text-white border-[#1d1a27] font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-normal'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Medical Prescriptions (-$180/mo)</span>
          </button>

          <button
            onClick={() => applyPreset('Annual Performance Bonus', 1500, 0, 'One-time or recurring performance incentive')}
            className={`px-3 py-1.5 rounded-xl border transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              extraIncome === 1500 && extraDeductions === 0
                ? 'bg-[#1d1a27] text-white border-[#1d1a27] font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-normal'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>+$1,500 Bonus</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls (Left 6 cols) + Impact Visualizer (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Sliders & Inputs */}
        <div className="lg:col-span-6 bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Simulation Inputs
            </span>
            <span className="text-xs text-slate-500 font-light">
              Live BIA S.68 Formula
            </span>
          </div>

          {/* Household Size Selector */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5 flex items-center justify-between">
              <span>Household Size</span>
              <span className="text-xs font-medium text-slate-500">
                OSB Threshold: {formatCurrency(activeThreshold)}
              </span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setHouseholdSize(num)}
                  className={`py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                    householdSize === num
                      ? 'bg-[#1d1a27] text-white border-[#1d1a27]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} {num === 1 ? 'Person' : 'People'}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Monthly Income Slider */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/90">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Additional Net Monthly Income (Overtime / Bonus)
                </span>
                <span className="text-[11px] text-slate-500 font-light">
                  Wages, commissions, or side earnings above base
                </span>
              </div>
              <span className="text-base font-bold text-emerald-700">
                +{formatCurrency(extraIncome)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={extraIncome}
              onChange={e => setExtraIncome(parseFloat(e.target.value) || 0)}
              className="w-full accent-[#1d1a27] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$0.00</span>
              <span>$500.00</span>
              <span>$1,000.00</span>
              <span>$1,500.00</span>
              <span>$2,500.00</span>
            </div>
          </div>

          {/* New Allowable Non-Discretionary Expenses */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/90">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  New Allowable Deductions (Medical, Transit, Childcare)
                </span>
                <span className="text-[11px] text-slate-500 font-light">
                  Statutory proof-backed deductions under BIA
                </span>
              </div>
              <span className="text-base font-bold text-indigo-700">
                +{formatCurrency(extraDeductions)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1500"
              step="25"
              value={extraDeductions}
              onChange={e => setExtraDeductions(parseFloat(e.target.value) || 0)}
              className="w-full accent-[#1d1a27] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$0.00</span>
              <span>$300.00</span>
              <span>$600.00</span>
              <span>$1,000.00</span>
              <span>$1,500.00</span>
            </div>
          </div>

          {/* Calculation Parameters Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-100/70 p-3.5 rounded-2xl">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Base Monthly Income</span>
              <span className="font-bold text-slate-900">{formatCurrency(baseIncome)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Base Deductions</span>
              <span className="font-bold text-slate-900">{formatCurrency(baseDeductions)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">New Net Household</span>
              <span className="font-bold text-slate-900">{formatCurrency(newTotalIncome - newTotalDeductions)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Active OSB Threshold</span>
              <span className="font-bold text-slate-900">{formatCurrency(activeThreshold)}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Immediate Visual Impact & Discharge Analysis */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Reassurance Banner: You Keep 50% */}
          <div className="bg-[#2d293d] text-white rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                STATUTORY 50/50 OUTCOME ANALYSIS
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                Always More Take-Home
              </span>
            </div>

            {/* Big Dual Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                  What You Keep in Pocket
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2be4a7]">
                  +{formatCurrency(netTakeHomeGain)}
                </div>
                <span className="text-[11px] text-slate-300 font-light mt-1 block">
                  Kept by you for household living
                </span>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                  Remitted to LIT Estate
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#fbf050]">
                  {surplusDelta >= 0 ? `+${formatCurrency(surplusDelta)}` : formatCurrency(surplusDelta)}
                </div>
                <span className="text-[11px] text-slate-300 font-light mt-1 block">
                  50% statutory surplus portion
                </span>
              </div>
            </div>

            {/* New Monthly Surplus Comparison */}
            <div className="bg-white/10 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">New Monthly Trustee Payment:</span>
                <span className="text-lg font-bold text-white">
                  {formatCurrency(newCalculatedSurplus)} <span className="text-xs font-normal text-slate-400">/ month</span>
                </span>
              </div>
              <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff5ea7] via-[#fbf050] to-[#2be4a7] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (newCalculatedSurplus / 800) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Baseline Payment: {formatCurrency(baselineSurplus)}</span>
                <span>Change: {surplusDelta >= 0 ? `+${formatCurrency(surplusDelta)}` : formatCurrency(surplusDelta)}</span>
              </div>
            </div>

            {/* Impact on Discharge Timeline */}
            <div className="pt-2 border-t border-white/10 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#b6b3ff] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block mb-0.5">
                  Discharge Track: {isSurplusOver200 ? '21-Month Track (Surplus > $200.00/mo)' : '9-Month Track (Standard)'}
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                  {isSurplusOver200
                    ? `Because monthly surplus exceeds $200.00, BIA S.68 mandates a 21-month statutory period for first-time bankruptcies to repay dividends to creditors.`
                    : `Your monthly surplus is under $200.00. First-time bankruptcies are eligible for automatic absolute discharge at 9 months upon completing counseling sessions.`
                  }
                </p>
              </div>
            </div>

          </div>

          {/* Action button to sync simulated scenario */}
          <button
            onClick={onNavigateToReports}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#1d1a27] font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Proceed to Form 65 Monthly Report</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>
      </div>

      {/* Bottom Section: LITbot Virtual Licensed Insolvency Trustee */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2e293f] flex items-center justify-center text-[#b6b3ff]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Ask LITbot: Your Virtual Licensed Insolvency Trustee
              </h3>
              <p className="text-[11px] text-slate-500 font-light">
                Grounded in Canadian Bankruptcy & Insolvency Act (BIA) & OSB Directives
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LITbot AI Active
          </span>
        </div>

        {/* Message Thread */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto p-1 pr-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#1d1a27] text-white'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="font-bold text-[11px] text-slate-400">
                    {msg.sender === 'user' ? 'You (Chad Johnson)' : 'Virtual LIT (LITbot)'}
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                </div>
                <p className="whitespace-pre-line font-light">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input & Suggested Questions */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 self-center">
              Suggested:
            </span>
            {[
              "If I work 10 hours overtime this month, what happens?",
              "Can I buy a vehicle to commute to a new job?",
              "What if my prescription medicine costs increase?",
              "Does my spouse's income count towards my payment?"
            ].map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskQuestion(s)}
                className="px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-[11px] transition cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <FloatingInput
              label="Ask a question about Canadian surplus income, allowable deductions, or discharge..."
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
              wrapperClassName="flex-1"
            />
            <button
              type="button"
              onClick={() => handleAskQuestion()}
              className="px-5 py-3 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Ask LITbot</span>
              <Send className="w-3.5 h-3.5 text-[#b6b3ff]" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
