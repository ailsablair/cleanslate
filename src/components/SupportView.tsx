import React from 'react';
import { Headphones, ShieldCheck, Mail, Phone, ExternalLink, HelpCircle, FileText } from 'lucide-react';
import { UserProfile } from '../types';
import { getMailtoUrl } from '../lib/formatters';

interface SupportViewProps {
  profile: UserProfile;
}

export const SupportView: React.FC<SupportViewProps> = ({ profile }) => {
  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Overview Card */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-[#8c93fc]/25">
          <Headphones className="w-5 h-5 text-[#8c93fc] shrink-0" />
          <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
            DEBTOR STATUTORY SUPPORT &amp; LIT DIRECT CONTACT
          </h2>
        </div>
        <p className="text-xs text-[#4b4856] max-w-2xl leading-relaxed">
          CleanSlate provides clear, non-judgmental guidance through the statutory compliance demands of Canadian personal bankruptcy and consumer proposals.
        </p>

        {/* Assigned Trustee Card */}
        <div className="mt-6 bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#6e6b7b] tracking-wider">
              Your Appointed Licensed Insolvency Trustee
            </span>
            <div className="text-base font-extrabold text-[#101010]">
              {profile.litName}
            </div>
            <div className="text-xs font-semibold text-[#4b4856]">
              {profile.litFirm}
            </div>
            <div className="text-xs text-[#6e6b7b] pt-1 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-[#101010]">
                <Mail className="w-3.5 h-3.5 text-[#8c93fc]" />
                <a
                  href={getMailtoUrl(profile.litEmail)}
                  className="underline hover:text-[#6366f1] transition"
                  title="Email LIT"
                >
                  {profile.litEmail}
                </a>
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <Phone className="w-3.5 h-3.5 text-[#8c93fc]" />
                {profile.litPhone}
              </span>
            </div>
          </div>

          <a
            href={getMailtoUrl(profile.litEmail, `Estate Inquiry - ${profile.firstName} ${profile.lastName}`)}
            className="px-5 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Mail className="w-4 h-4 text-[#1d1a27]" />
            <span>Email Trustee Directly</span>
          </a>
        </div>
      </div>

      {/* FAQs and Statutory Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-7 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010] flex items-center gap-2 pb-3 border-b border-[#8c93fc]/25">
            <FileText className="w-4 h-4 text-[#8c93fc]" />
            <span>Statutory Form 65 Questions</span>
          </h3>

          <div className="space-y-3 text-xs text-[#4b4856] leading-relaxed">
            <div className="bg-white p-4 rounded-2xl border border-[#d8d9f8]">
              <div className="font-bold text-[#101010] mb-1">When is my monthly report due?</div>
              Reports must be submitted on the <strong className="text-[#101010]">15th of every month</strong>. On-time submissions are mandatory under the Bankruptcy and Insolvency Act to ensure your discharge is not delayed.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d8d9f8]">
              <div className="font-bold text-[#101010] mb-1">What qualifies as Non-Discretionary Medical?</div>
              Expenses related to an illness or condition that are not reimbursed by a medical plan. This includes prescription medicines, insulin, dental treatments, and physician-authorized medical cannabis.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d8d9f8]">
              <div className="font-bold text-[#101010] mb-1">How is Surplus Income determined?</div>
              Surplus income is calculated based on standards set annually by the Superintendent of Bankruptcy. If your net household income exceeds the threshold for your family size, 50% of the surplus is paid into the estate for your creditors.
            </div>
          </div>
        </div>

        <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-7 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010] flex items-center gap-2 pb-3 border-b border-[#8c93fc]/25">
            <ShieldCheck className="w-4 h-4 text-[#8c93fc]" />
            <span>Bankruptcy Discharge Milestones</span>
          </h3>

          <div className="space-y-3 text-xs text-[#4b4856] leading-relaxed">
            <div className="bg-white p-4 rounded-2xl border border-[#d8d9f8]">
              <div className="font-bold text-[#101010] mb-1">First-Time Bankruptcy Without Surplus</div>
              Eligible for automatic discharge in <strong className="text-[#101010]">9 months</strong>, provided all monthly reports and counseling sessions are completed.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d8d9f8]">
              <div className="font-bold text-[#101010] mb-1">First-Time Bankruptcy With Surplus</div>
              The term extends to <strong className="text-[#101010]">21 months</strong> with required surplus payments contributed to your Licensed Insolvency Trustee.
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d8d9f8]">
              <div className="font-bold text-[#101010] mb-1">Mandatory Financial Counseling</div>
              Two statutory counseling sessions must be attended with your LIT office to receive an absolute certificate of discharge.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
