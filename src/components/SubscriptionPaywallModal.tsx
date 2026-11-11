import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Award, 
  X, 
  CreditCard, 
  Bot, 
  RefreshCw, 
  MailCheck, 
  FileText 
} from 'lucide-react';

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onSelectTier: (tierName: string) => void;
}

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  isOpen,
  onClose,
  currentTier = 'Pro Advocate',
  onSelectTier
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'Free Statutory Explorer',
      name: 'Statutory Free',
      priceMonthly: '$0',
      priceAnnual: '$0',
      badge: 'Basic Compliance',
      description: 'Essential OSB Form 65 monthly income & expense tracking for Canadian bankruptcy filings.',
      features: [
        'OSB Form 65 Monthly Report Editor',
        'Basic Receipt Vault (up to 10 files)',
        'Manual Bank Entry Ledger',
        'Standard PDF Export'
      ],
      highlighted: false,
      cta: 'Current Basic Plan'
    },
    {
      id: 'Pro Advocate',
      name: 'Pro Advocate',
      priceMonthly: '$14.99',
      priceAnnual: '$11.99',
      badge: 'Most Popular',
      description: 'Full statutory automation suite with LITbot AI assistance, bank API auto-sync, and auto-dispatch to trustee.',
      features: [
        'All Statutory Free Features',
        'LITbot AI Trustee Assistant (Unlimited Questions)',
        'Automatic Bank Account API Aggregator Sync',
        'Automated LIT Direct Email Dispatch Log',
        'Discharge Pathway & Surplus Income Simulator',
        'Prescription & Employment Proof Attachments'
      ],
      highlighted: true,
      cta: 'Upgrade to Pro Advocate'
    },
    {
      id: 'Enterprise LIT Managed',
      name: 'LIT Enterprise',
      priceMonthly: '$39.99',
      priceAnnual: '$31.99',
      badge: 'Full Support',
      description: 'Priority trustee portal connection with dedicated paralegal audit review and instant discharge audit packet export.',
      features: [
        'All Pro Advocate Features',
        'Instant Full Audit Packet Export (PDF + Zip)',
        'Priority Direct Trustee Office Pipeline',
        'Dedicated Insolvency Support Hotline',
        'Multi-Year Rebuild & Credit Restoration Toolkit'
      ],
      highlighted: false,
      cta: 'Choose LIT Enterprise'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-[#242031] text-white border border-[#38324d] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2d283c] via-[#352f47] to-[#2d283c] px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fbf050] text-[#242031] flex items-center justify-center font-black shadow-md">
              <Zap className="w-6 h-6 text-[#242031]" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#b6b3ff] uppercase">
                CleanSlate Subscription Tiers
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Accelerate Your Pathway to Bankruptcy Discharge
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="p-6 bg-[#1d1a27] border-b border-white/10 flex items-center justify-center gap-4">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 rounded-full bg-[#b6b3ff]/30 border border-[#b6b3ff] p-0.5 transition cursor-pointer relative"
          >
            <div className={`w-5 h-5 rounded-full bg-[#fbf050] transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
            Annual Billing
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold">
              Save 20%
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.id || (currentTier.includes('Pro') && plan.id.includes('Pro'));
            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition border relative ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-[#2d2845] to-[#1e1b29] border-[#b6b3ff] shadow-xl shadow-[#b6b3ff]/10 ring-2 ring-[#b6b3ff]/50'
                    : 'bg-[#1d1a27] border-white/10 hover:border-white/20'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#fbf050] text-[#242031] text-[10px] font-black uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-[#b6b3ff] uppercase tracking-wider">
                      {plan.name}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">
                        {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-2.5">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Includes:
                    </div>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTier(plan.id);
                      onClose();
                    }}
                    style={plan.highlighted ? {
                      background: 'var(--colour-dark-highlight, #F9F45D)',
                      boxShadow: '3px 4px 0px black',
                      borderRadius: 12,
                      color: 'var(--colour-dark-accent, #3E4A4F)',
                      fontFamily: "'Google Sans Flex', sans-serif",
                      fontSize: '13px',
                      fontWeight: '800',
                    } : undefined}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      plan.highlighted
                        ? 'hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px]'
                        : isCurrent
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isCurrent ? 'Active Plan' : plan.cta}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-[#1a1724] border-t border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Cancel anytime in your profile settings · 100% PIPEDA compliant Canadian encryption guarantee</span>
        </div>
      </div>
    </div>
  );
};
