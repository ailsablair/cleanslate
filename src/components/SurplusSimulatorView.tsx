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
import { getFallbackLitBotResponse } from '../lib/litbotFallback';
import { loadKnowledgeArticlesFromStorage } from '../lib/litbotKnowledge';

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
  const [isAskingBot, setIsAskingBot] = useState<boolean>(false);

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

  const getLocalSimulatorFallback = (q: string): string => {
    return getFallbackLitBotResponse(
      q,
      {
        firstName: profile.firstName,
        province: profile.province,
        householdSize,
        litName: profile.litName,
        surplusPayment: Math.round(newCalculatedSurplus),
        activeThreshold
      },
      loadKnowledgeArticlesFromStorage()
    ).text;
  };

  const handleAskQuestion = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isAskingBot) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const historyForApi = messages.map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.text
    }));

    setMessages(prev => [...prev, userMsg]);
    if (!questionText) setInputQuestion('');
    setIsAskingBot(true);

    try {
      const response = await fetch('/api/litbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          messages: historyForApi,
          contextProfile: {
            firstName: profile.firstName,
            province: profile.province,
            householdSize,
            litName: profile.litName,
            surplusPayment: Math.round(newCalculatedSurplus),
            activeThreshold
          },
          knowledgeArticles: loadKnowledgeArticlesFromStorage()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const botMsg: Message = {
        id: 'b_' + Date.now(),
        sender: 'litbot',
        text: data.text || getLocalSimulatorFallback(q),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const botMsg: Message = {
        id: 'b_' + Date.now(),
        sender: 'litbot',
        text: getLocalSimulatorFallback(q),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsAskingBot(false);
    }
  };

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      
      {/* Top Banner / Header Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#8c93fc]/25">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                Virtual LIT &amp; Surplus Income Projection Simulator
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] max-w-2xl leading-relaxed">
              Test how variable earnings (overtime, commissions, holiday pay) or new mandatory costs (work car, daycare, prescription therapy) impact your monthly Form 65 payment and discharge eligibility.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setExtraIncome(500);
                setExtraDeductions(0);
                setHouseholdSize(profile.householdSize || 2);
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] text-[#101010] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#4b4856]" />
              <span>Reset Values</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToPathway}
              className="px-4 py-2.5 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-semibold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-[#b6b3ff]" />
              <span>View Pathway to Discharge</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Pills */}
        <div className="pt-4 flex items-center gap-2.5 overflow-x-auto text-xs pb-1.5 select-none">
          <span className="text-[11px] font-bold uppercase text-[#6e6b7b] shrink-0">
            Test Preset Scenarios:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('Overtime Shift (10-15 hrs)', 500, 0, '10-15 hrs of monthly overtime pay')}
            className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              extraIncome === 500 && extraDeductions === 0
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>+$500 Overtime Shift</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Work Commuter Vehicle', 0, 380, 'Monthly fuel, maintenance & insurance for job commuting')}
            className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              extraIncome === 0 && extraDeductions === 380
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>New Work Vehicle (-$380/mo)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Medical Prescription Hike', 0, 180, 'Prescriptions and medical therapy condition expenses')}
            className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              extraIncome === 0 && extraDeductions === 180
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Medical Prescriptions (-$180/mo)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('Annual Performance Bonus', 1500, 0, 'One-time or recurring performance incentive')}
            className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              extraIncome === 1500 && extraDeductions === 0
                ? 'bg-[#2d2a37] text-white font-bold border border-[#101010] shadow-[2px_3px_0px_#000000]'
                : 'bg-[#e9e8ec] text-[#101010] hover:bg-[#dfdde4] font-semibold border border-[#767676]/50'
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
        <div className="lg:col-span-6 bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-7 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#8c93fc]/25">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#101010]">
              Simulation Inputs
            </span>
            <span className="text-xs text-[#6e6b7b] font-medium">
              Live BIA S.68 Formula
            </span>
          </div>

          {/* Household Size Selector */}
          <div>
            <label className="text-xs font-bold text-[#101010] mb-2 flex items-center justify-between">
              <span>Household Size</span>
              <span className="text-xs font-semibold text-[#6e6b7b] tabular-nums">
                OSB Threshold: {formatCurrency(activeThreshold)}
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setHouseholdSize(num)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    householdSize === num
                      ? 'bg-[#2d2a37] text-white border-[#101010] shadow-[2px_3px_0px_#000000]'
                      : 'bg-white text-[#101010] border-[#d8d9f8] hover:border-[#8c93fc]'
                  }`}
                >
                  {num} {num === 1 ? 'Person' : 'People'}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Monthly Income Slider */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-[#d8d9f8]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#101010] block">
                  Additional Net Monthly Income (Overtime / Bonus)
                </span>
                <span className="text-[11px] text-[#6e6b7b]">
                  Wages, commissions, or side earnings above base
                </span>
              </div>
              <span className="text-base font-extrabold text-emerald-700 tabular-nums shrink-0">
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
              className="w-full accent-[#2d2a37] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-[#6e6b7b] font-mono tabular-nums">
              <span>$0.00</span>
              <span>$500.00</span>
              <span>$1,000.00</span>
              <span>$1,500.00</span>
              <span>$2,500.00</span>
            </div>
          </div>

          {/* New Allowable Non-Discretionary Expenses */}
          <div className="space-y-2 bg-white p-4 rounded-2xl border border-[#d8d9f8]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#101010] block">
                  New Allowable Deductions (Medical, Transit, Childcare)
                </span>
                <span className="text-[11px] text-[#6e6b7b]">
                  Statutory proof-backed deductions under BIA
                </span>
              </div>
              <span className="text-base font-extrabold text-[#6366f1] tabular-nums shrink-0">
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
              className="w-full accent-[#2d2a37] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-[#6e6b7b] font-mono tabular-nums">
              <span>$0.00</span>
              <span>$300.00</span>
              <span>$600.00</span>
              <span>$1,000.00</span>
              <span>$1,500.00</span>
            </div>
          </div>

          {/* Calculation Parameters Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb]">
            <div>
              <span className="text-[#6e6b7b] block text-[10px] uppercase font-semibold">Base Monthly Income</span>
              <span className="font-extrabold text-[#101010] tabular-nums">{formatCurrency(baseIncome)}</span>
            </div>
            <div>
              <span className="text-[#6e6b7b] block text-[10px] uppercase font-semibold">Base Deductions</span>
              <span className="font-extrabold text-[#101010] tabular-nums">{formatCurrency(baseDeductions)}</span>
            </div>
            <div>
              <span className="text-[#6e6b7b] block text-[10px] uppercase font-semibold">New Net Household</span>
              <span className="font-extrabold text-[#101010] tabular-nums">{formatCurrency(newTotalIncome - newTotalDeductions)}</span>
            </div>
            <div>
              <span className="text-[#6e6b7b] block text-[10px] uppercase font-semibold">Active OSB Threshold</span>
              <span className="font-extrabold text-[#101010] tabular-nums">{formatCurrency(activeThreshold)}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Immediate Visual Impact & Discharge Analysis */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Reassurance Banner: You Keep 50% */}
          <div className="bg-[#1d1a27] text-white rounded-3xl p-6 sm:p-7 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-extrabold uppercase tracking-wide text-[#b6b3ff]">
                STATUTORY 50/50 OUTCOME ANALYSIS
              </span>
              <span className="text-[10px] bg-[#46e3a5] text-[#102a1f] font-bold px-2.5 py-0.5 rounded-full">
                Always More Take-Home
              </span>
            </div>

            {/* Big Dual Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                  What You Keep in Pocket
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#46e3a5] tabular-nums">
                  +{formatCurrency(netTakeHomeGain)}
                </div>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  Kept by you for household living
                </span>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1 uppercase tracking-wider">
                  Remitted to LIT Estate
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F9F45D] tabular-nums">
                  {surplusDelta >= 0 ? `+${formatCurrency(surplusDelta)}` : formatCurrency(surplusDelta)}
                </div>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  50% statutory surplus portion
                </span>
              </div>
            </div>

            {/* New Monthly Surplus Comparison */}
            <div className="bg-white/10 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">New Monthly Trustee Payment:</span>
                <span className="text-lg font-extrabold text-white tabular-nums">
                  {formatCurrency(newCalculatedSurplus)} <span className="text-xs font-normal text-slate-400">/ month</span>
                </span>
              </div>
              <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff5ea7] via-[#F9F45D] to-[#46e3a5] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (newCalculatedSurplus / 800) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 tabular-nums">
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
                <p className="text-[11px] text-slate-300 leading-relaxed">
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
            type="button"
            onClick={onNavigateToReports}
            className="w-full py-3.5 px-5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Form 65 Monthly Report</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

        </div>
      </div>

      {/* Bottom Section: LITbot Virtual Licensed Insolvency Trustee */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-7 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#8c93fc]/25 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2d2a37] border border-[#101010] flex items-center justify-center text-[#b6b3ff] shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#101010] uppercase tracking-wide">
                Ask LITbot: Your Virtual Licensed Insolvency Trustee
              </h3>
              <p className="text-[11px] text-[#6e6b7b]">
                Grounded in Canadian Bankruptcy &amp; Insolvency Act (BIA) &amp; OSB Directives
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#102a1f] animate-pulse" />
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
                    ? 'bg-[#2d2a37] text-white border border-[#101010]'
                    : 'bg-white border border-[#d8d9f8] text-[#101010]'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className={`font-bold text-[11px] ${msg.sender === 'user' ? 'text-[#b6b3ff]' : 'text-[#6e6b7b]'}`}>
                    {msg.sender === 'user' ? 'You (Chad Johnson)' : 'Virtual LIT (LITbot)'}
                  </span>
                  <span className={`text-[10px] tabular-nums ${msg.sender === 'user' ? 'text-slate-400' : 'text-[#6e6b7b]'}`}>{msg.time}</span>
                </div>
                <div className="space-y-1">
                  {msg.text.split('\n').map((line, lIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={lIdx} className="h-1" />;
                    const formatted = line.replace(/^#{2,3}\s+/, '').split(/(\*\*[^*]+\*\*)/g).map((part, pIdx) =>
                      part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>
                      ) : (
                        part
                      )
                    );
                    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
                      return <div key={lIdx} className="font-extrabold text-xs text-[#101010] pt-1">{formatted}</div>;
                    }
                    return <p key={lIdx}>{formatted}</p>;
                  })}
                </div>
              </div>
            </div>
          ))}
          {isAskingBot && (
            <div className="flex justify-start">
              <div className="rounded-2xl p-3 bg-white border border-[#d8d9f8] text-xs text-[#4b4856] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8c93fc] animate-spin" />
                <span>LITbot is preparing a clear step-by-step answer...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input & Suggested Questions */}
        <div className="space-y-3 pt-3 border-t border-[#8c93fc]/25">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-[#6e6b7b] self-center">
              Suggested:
            </span>
            {[
              "If I work 10 hours overtime this month, what happens?",
              "Which categories are not counted towards my bankruptcy payment calculation?",
              "What is the difference between Medical Condition Expenses and Prescriptions?",
              "Does my spouse's income count towards my payment?"
            ].map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskQuestion(s)}
                disabled={isAskingBot}
                className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 border border-[#d8d9f8] hover:border-[#8c93fc] text-[#101010] text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <FloatingInput
              label="Ask anything in plain English about Form 65, surplus income, or bank transfers..."
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
              wrapperClassName="flex-1"
            />
            <button
              type="button"
              onClick={() => handleAskQuestion()}
              disabled={isAskingBot || !inputQuestion.trim()}
              className="px-5 py-3 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
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
