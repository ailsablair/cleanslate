import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Award, 
  Building, 
  FileText, 
  DollarSign, 
  Check, 
  ChevronRight 
} from 'lucide-react';
import { UserProfile, LIT } from '../types';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';

interface OnboardingWizardProps {
  isOpen: boolean;
  profile: UserProfile;
  lits: LIT[];
  onComplete: (updatedProfile: UserProfile) => void;
  onSkip?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  profile,
  lits,
  onComplete,
  onSkip
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [dischargePathway, setDischargePathway] = useState<string>('9-Month First-Time Bankruptcy (Standard)');
  const [selectedLitId, setSelectedLitId] = useState<string>(profile.litId || 'lit-1');

  if (!isOpen) return null;

  const handleSelectLit = (litId: string) => {
    setSelectedLitId(litId);
    const lit = lits.find(l => l.id === litId);
    if (lit) {
      setFormData(prev => ({
        ...prev,
        litId: lit.id,
        litName: lit.name,
        litFirm: lit.firm,
        litEmail: lit.email,
        litPhone: lit.phone
      }));
    }
  };

  const handleFinish = () => {
    const updated = {
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#242031] text-white border border-[#38324d] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
      >
        {/* Wizard Header Banner */}
        <div className="bg-gradient-to-r from-[#2d283c] via-[#352f47] to-[#2d283c] px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fbf050] text-[#242031] flex items-center justify-center font-black shadow-md">
              <Award className="w-6 h-6 text-[#242031]" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#b6b3ff] uppercase">
                Personalized Onboarding · Step {step} of 3
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Customize Your Pathway to Freedom
              </h2>
            </div>
          </div>

          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-white transition font-medium underline"
            >
              Skip Setup
            </button>
          )}
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-[#1d1a27] h-1.5 flex">
          <div className={`h-full bg-[#b6b3ff] transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        {/* Wizard Step Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase text-[#b6b3ff] tracking-wider">
                  Step 1: Personal & Statutory Estate Info
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Enter your details so CleanSlate can automatically populate your OSB Form 65 reports and calculate statutory thresholds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <FloatingInput
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
                <FloatingInput
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <FloatingInput
                  type="tel"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Address Line 1"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                />
                <FloatingInput
                  label="Province / Territory"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase text-[#b6b3ff] tracking-wider">
                  Step 2: Assign Your Licensed Insolvency Trustee (LIT)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select your trustee from the verified Canadian LIT directory. CleanSlate automatically formats and emails your monthly Form 65 reports to them.
                </p>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {lits.map((lit) => {
                  const isSelected = lit.id === selectedLitId;
                  return (
                    <div
                      key={lit.id}
                      onClick={() => handleSelectLit(lit.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#b6b3ff]/15 border-[#b6b3ff]'
                          : 'bg-[#1d1a27] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{lit.name}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-md bg-[#b6b3ff] text-[#242031] text-[10px] font-black">
                              Assigned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 font-medium">{lit.firm}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Lic #{lit.licenseNumber} · {lit.city}, {lit.province} · {lit.email}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                          isSelected
                            ? 'bg-[#b6b3ff] text-[#242031]'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-black uppercase text-[#b6b3ff] tracking-wider">
                  Step 3: Custom Discharge Timeline & Surplus Budget Goal
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select your insolvency statutory track to personalize your discharge progress counter, surplus income thresholds, and LITbot recommendations.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: '9-Month First-Time Bankruptcy (Standard)',
                    title: '9-Month First-Time Bankruptcy (No Surplus)',
                    desc: 'Standard discharge track under Directive 11R2 for debtors with income under the OSB surplus limit.'
                  },
                  {
                    id: '21-Month First-Time Bankruptcy (Surplus)',
                    title: '21-Month First-Time Bankruptcy (With Surplus)',
                    desc: 'Extended track when average net monthly income exceeds OSB statutory threshold by over $200.'
                  },
                  {
                    id: '24-Month Second-Time Bankruptcy',
                    title: '24-Month Second-Time Bankruptcy Track',
                    desc: 'Statutory 24-month period for second-time personal bankruptcy filings in Canada.'
                  },
                  {
                    id: 'Consumer Proposal (36-60 Months)',
                    title: 'Consumer Proposal Track (36 to 60 Months)',
                    desc: 'Restructuring plan with negotiated fixed monthly payments to trustee.'
                  }
                ].map((track) => {
                  const isSelected = dischargePathway === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => setDischargePathway(track.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-[#fbf050]/15 border-[#fbf050]'
                          : 'bg-[#1d1a27] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-[#fbf050] bg-[#fbf050] text-[#242031]' : 'border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="font-bold text-white text-xs">{track.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{track.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-6 border-t border-white/10 bg-[#1d1a27] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold transition"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              style={{
                background: 'var(--colour-dark-highlight, #F9F45D)',
                boxShadow: '3px 4px 0px black',
                borderRadius: 10,
                color: 'var(--colour-dark-accent, #3E4A4F)',
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '13px',
                fontWeight: '800',
              }}
              className="px-6 py-2.5 transition-all flex items-center gap-2 hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                background: 'var(--colour-dark-highlight, #F9F45D)',
                boxShadow: '4px 6px 0px black',
                borderRadius: 10,
                color: 'var(--colour-dark-accent, #3E4A4F)',
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '13px',
                fontWeight: '800',
              }}
              className="px-8 py-3 transition-all flex items-center gap-2 hover:brightness-105 active:translate-x-[2px] active:translate-y-[3px] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Launch My Estate Portal</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
