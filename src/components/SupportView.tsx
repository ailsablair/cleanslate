import React from 'react';
import { Headphones, ShieldCheck, Mail, Phone, ExternalLink, HelpCircle, FileText } from 'lucide-react';
import { UserProfile } from '../types';

interface SupportViewProps {
  profile: UserProfile;
}

export const SupportView: React.FC<SupportViewProps> = ({ profile }) => {
  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Overview Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-5 h-5 text-[#242031]" />
          <h2 className="text-lg font-black tracking-wider uppercase text-slate-900">
            DEBTOR STATUTORY SUPPORT & LIT DIRECT CONTACT
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          CleanSlate provides clear, non-judgmental guidance through the statutory compliance demands of Canadian personal bankruptcy and consumer proposals.
        </p>

        {/* Assigned Trustee Card */}
        <div className="mt-6 bg-white border-2 border-[#b4b1fc] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Your Appointed Licensed Insolvency Trustee
            </span>
            <div className="text-base font-black text-slate-900">
              {profile.litName}
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {profile.litFirm}
            </div>
            <div className="text-xs text-slate-500 pt-1 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 font-bold text-slate-800">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {profile.litEmail}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {profile.litPhone}
              </span>
            </div>
          </div>

          <a
            href={`mailto:${profile.litEmail}?subject=CleanSlate Estate Inquiry - ${profile.firstName} ${profile.lastName}`}
            className="px-5 py-3 rounded-2xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            <Mail className="w-4 h-4 text-[#b4b1fc]" />
            <span>Email Trustee Directly</span>
          </a>
        </div>
      </div>

      {/* FAQs and Statutory Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Statutory Form 65 Questions
          </h3>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">When is my monthly report due?</div>
              Reports must be submitted on the <strong>15th of every month</strong>. On-time submissions are mandatory under the Bankruptcy and Insolvency Act to ensure your discharge is not delayed.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">What qualifies as Non-Discretionary Medical?</div>
              Expenses related to an illness or condition that are not reimbursed by a medical plan. This includes prescription medicines, insulin, dental treatments, and physician-authorized medical cannabis.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">How is Surplus Income determined?</div>
              Surplus income is calculated based on standards set annually by the Superintendent of Bankruptcy. If your net household income exceeds the threshold for your family size, 50% of the surplus is paid into the estate for your creditors.
            </div>
          </div>
        </div>

        <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Bankruptcy Discharge Milestones
          </h3>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">First-Time Bankruptcy Without Surplus</div>
              Eligible for automatic discharge in <strong>9 months</strong>, provided all monthly reports and counseling sessions are completed.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">First-Time Bankruptcy With Surplus</div>
              The term extends to <strong>21 months</strong> with required surplus payments contributed to your Licensed Insolvency Trustee.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80">
              <div className="font-bold text-slate-900 mb-1">Mandatory Financial Counseling</div>
              Two statutory counseling sessions must be attended with your LIT office to receive an absolute certificate of discharge.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
