import React, { useState } from 'react';
import { 
  Calendar, 
  Hourglass, 
  Paperclip, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  FileCheck,
  Send,
  ExternalLink,
  ShieldAlert,
  Download,
  FileText,
  Check,
  Sparkles
} from 'lucide-react';
import { MonthlyReport, UserProfile, Receipt, Transaction } from '../types';
import { generateMonthlyReportPDF } from '../lib/pdfReportGenerator';
import { generateLITAuditPacketPDF } from '../lib/pdfAuditPacketGenerator';
import { FloatingInput } from './FloatingInput';
import { LitBotReportAssistant } from './LitBotReportAssistant';
import { getMailtoUrl, formatCurrency } from '../lib/formatters';

interface MonthlyReportViewProps {
  reports: MonthlyReport[];
  currentReportId: string;
  onSelectReport: (reportId: string) => void;
  profile: UserProfile;
  receipts: Receipt[];
  transactions?: Transaction[];
  onUpdateReport: (updatedReport: MonthlyReport) => void;
  onSubmitReportToLIT: (report: MonthlyReport) => void;
  onNavigateToProfile: () => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  reports,
  currentReportId,
  onSelectReport,
  profile,
  receipts,
  transactions = [],
  onUpdateReport,
  onSubmitReportToLIT,
  onNavigateToProfile
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [attachingCategory, setAttachingCategory] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isExportingAuditPacket, setIsExportingAuditPacket] = useState<boolean>(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);

  const activeReport = reports.find(r => r.id === currentReportId) || reports[0];

  const handleDownloadReport = () => {
    setIsGeneratingPdf(true);
    try {
      generateMonthlyReportPDF({
        report: activeReport,
        profile,
        receipts,
        transactions
      });
      setPdfSuccessToast(`Form 65 PDF report for ${activeReport.month} ${activeReport.year} generated and downloaded!`);
      setTimeout(() => setPdfSuccessToast(null), 4000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportAuditPacket = () => {
    setIsExportingAuditPacket(true);
    try {
      generateLITAuditPacketPDF({
        profile,
        reports,
        receipts,
        transactions
      });
      setPdfSuccessToast('Complete OSB Audit Packet PDF dossier generated & downloaded!');
      setTimeout(() => setPdfSuccessToast(null), 4000);
    } catch (err) {
      console.error('Error exporting audit packet:', err);
    } finally {
      setIsExportingAuditPacket(false);
    }
  };

  if (!activeReport) {
    return <div className="p-8 text-white">No reports available.</div>;
  }

  // Helpers to update values in current report
  const handleDebtorIncomeChange = (field: keyof typeof activeReport.income.debtor, value: number) => {
    const updated = {
      ...activeReport,
      lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      income: {
        ...activeReport.income,
        debtor: {
          ...activeReport.income.debtor,
          [field]: value
        }
      }
    };
    onUpdateReport(updated);
  };

  const handleSpouseIncomeChange = (field: keyof typeof activeReport.income.spouse, value: number) => {
    const updated = {
      ...activeReport,
      lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      income: {
        ...activeReport.income,
        spouse: {
          ...activeReport.income.spouse,
          [field]: value
        }
      }
    };
    onUpdateReport(updated);
  };

  const handleNonDiscChange = (field: keyof typeof activeReport.nonDiscretionary, value: number) => {
    const updated = {
      ...activeReport,
      lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      nonDiscretionary: {
        ...activeReport.nonDiscretionary,
        [field]: value
      }
    };
    onUpdateReport(updated);
  };

  const handleDiscretionaryChange = (section: keyof typeof activeReport.discretionary, field: string, value: number) => {
    const updated = {
      ...activeReport,
      lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      discretionary: {
        ...activeReport.discretionary,
        [section]: {
          // @ts-ignore
          ...activeReport.discretionary[section],
          [field]: value
        }
      }
    };
    onUpdateReport(updated);
  };

  // Calculations
  const debtorIncomeTotal = Object.values(activeReport.income.debtor).reduce((a, b) => a + Number(b || 0), 0);
  const spouseIncomeTotal = Object.values(activeReport.income.spouse).reduce((a, b) => a + Number(b || 0), 0);
  const totalGrossIncome = debtorIncomeTotal + spouseIncomeTotal;

  const totalNonDiscretionary = Object.values(activeReport.nonDiscretionary)
    .filter(val => typeof val === 'number')
    .reduce((a, b) => a + Number(b || 0), 0) as number;

  const housingTotal = Object.values(activeReport.discretionary.housing).reduce((a, b) => a + Number(b || 0), 0);
  const personalTotal = Object.values(activeReport.discretionary.personal).reduce((a, b) => a + Number(b || 0), 0);
  const medicalTotal = Object.values(activeReport.discretionary.medical).reduce((a, b) => a + Number(b || 0), 0);
  const dayToDayTotal = Object.values(activeReport.discretionary.dayToDay).reduce((a, b) => a + Number(b || 0), 0);
  const transportTotal = Object.values(activeReport.discretionary.transportation).reduce((a, b) => a + Number(b || 0), 0);
  const insuranceTotal = Object.values(activeReport.discretionary.insurance).reduce((a, b) => a + Number(b || 0), 0);
  const paymentsTotal = Object.values(activeReport.discretionary.payments).reduce((a, b) => a + Number(b || 0), 0);
  const totalDiscretionary = housingTotal + personalTotal + medicalTotal + dayToDayTotal + transportTotal + insuranceTotal + paymentsTotal;

  // OSB Canadian Surplus Income threshold (2022-2026 standard)
  const householdThreshold = profile.householdSize === 1 ? 2400 : profile.householdSize === 2 ? 2980 : 3600;
  const netSurplusBasis = Math.max(0, totalGrossIncome - totalNonDiscretionary);
  const calculatedSurplus = Math.max(0, (netSurplusBasis - householdThreshold) * 0.5);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmitReportToLIT(activeReport);
    setIsSubmitting(false);
  };

  const statutoryExplanations: Record<string, string> = {
    'employmentIncome': 'Net wages or salary after statutory deductions (tax, CPP/EI). Include overtime and bonuses.',
    'pensionAnnuities': 'Monthly pension payments, CPP retirement benefits, OAS, or annuity income.',
    'childSupport': 'Court-ordered or agreed child support receipts.',
    'spousalSupport': 'Court-ordered or agreed spousal support received.',
    'employmentIncomeBenefits': 'EI regular benefits, parental leave, or sickness benefits.',
    'socialAssistance': 'Provincial or municipal income assistance receipts.',
    'selfEmploymentIncome': 'Net business income (gross revenues minus direct verified expenses).',
    'childTaxBenefit': 'Canada Child Benefit (CCB) and provincial child supplements.',
    'otherNetIncome': 'Rental income, tips, dividends, or monetary family gifts.',
    'childSupportPayments': 'Legally mandated child support paid pursuant to a court order or written agreement.',
    'spousalSupportPayments': 'Mandatory spousal support paid to a former spouse.',
    'childCare': 'Daycare, preschool, or babysitting expenses required for debtor employment.',
    'medicalConditionExpenses': 'Prescription medicines, physician-authorized medical cannabis, medical devices, dental therapy not covered by MSP/insurance.',
    'finesPenaltiesCourt': 'Statutory fines or court restitution payments.',
    'expensesConditionEmployment': 'Mandatory safety equipment, union dues, or tools required to maintain employment.',
    'debtsStayLifted': 'Statutory obligations where the bankruptcy stay has been lifted by court order.'
  };

  const handleAttachReceiptToCategory = (category: string, receiptId: string) => {
    const currentAttachments = activeReport.nonDiscretionary.attachments || {};
    const updatedAttachments = {
      ...currentAttachments,
      [category]: [receiptId]
    };
    const updated = {
      ...activeReport,
      nonDiscretionary: {
        ...activeReport.nonDiscretionary,
        attachments: updatedAttachments
      }
    };
    onUpdateReport(updated);
  };

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: HISTORY Card & LITbot AI Assistant (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Hourglass className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-extrabold tracking-wider uppercase text-[#242031]">
                MONTHLY HISTORY
              </h3>
            </div>

            <div className="space-y-1 divide-y divide-slate-100">
              {reports.map((rep) => {
                const isCurrent = rep.id === activeReport.id;
                const isOverdue = rep.status === 'Overdue';
                const isSubmitted = rep.status === 'Submitted';

                return (
                  <div
                    key={rep.id}
                    onClick={() => onSelectReport(rep.id)}
                    className={`py-3.5 px-3 rounded-2xl transition cursor-pointer flex items-center justify-between relative ${
                      isCurrent 
                        ? 'bg-slate-100/90' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Active highlight bar on left */}
                    {isCurrent && (
                      <div className="absolute left-1 top-2.5 bottom-2.5 w-1.5 rounded-full bg-[#242031]" />
                    )}

                    <div className="pl-3 min-w-0">
                      <div className="text-sm font-bold text-slate-900">
                        {rep.month}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {isSubmitted 
                          ? `Sent to ${rep.sentToLitName?.split(',')[0] || profile.litName?.split(',')[0] || 'LIT'} on ${new Date(rep.submittedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : rep.lastEditDate
                        }
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span 
                        className={`text-xs ${
                          isCurrent 
                            ? 'text-slate-500 font-medium' 
                            : isOverdue 
                            ? 'text-rose-500 font-semibold' 
                            : isSubmitted 
                            ? 'text-emerald-700 font-semibold' 
                            : 'text-slate-400 font-normal'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {}}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>See All (12 Months)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* LITbot AI Assistant & Bank Statement Auto-Categorization Widget */}
          <LitBotReportAssistant
            activeReport={activeReport}
            profile={profile}
            receipts={receipts}
            onUpdateReport={onUpdateReport}
            onAttachReceiptToCategory={handleAttachReceiptToCategory}
            isStatementModalOpen={isStatementModalOpen}
            setIsStatementModalOpen={setIsStatementModalOpen}
          />
        </div>

        {/* Right Column: Multi-Step Form 65 Wizard (8 cols) */}
        <div className="lg:col-span-8 bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Top Bar: Calendar + Month/Year + Download Report + Update Profile Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#b4b1fc] flex items-center justify-center text-[#242031]">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 
                className="text-lg font-bold tracking-wider uppercase text-slate-900"
                style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
              >
                {activeReport.month} {activeReport.year}
              </h2>
              {activeReport.status === 'Submitted' && (
                <span className="ml-2 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Filed to LIT
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 rounded-xl bg-[#1d1a27] hover:bg-[#2e293f] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-75"
                title={`Download Form 65 PDF Summary for ${activeReport.month} ${activeReport.year}`}
              >
                <Download className={`w-3.5 h-3.5 text-[#b6b3ff] ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                <span className="font-bold">{isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportAuditPacket}
                disabled={isExportingAuditPacket}
                className="px-3.5 py-2 rounded-xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#1d1a27] text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-75"
                title="Compile all 12 monthly reports, receipts & signed Form 65 declarations into a single OSB audit dossier PDF"
              >
                <FileCheck className={`w-3.5 h-3.5 text-slate-900 ${isExportingAuditPacket ? 'animate-bounce' : ''}`} />
                <span className="font-bold">{isExportingAuditPacket ? 'Exporting Dossier...' : 'Export LIT Audit Packet'}</span>
              </button>

              <button
                onClick={onNavigateToProfile}
                style={{ color: '#FF6BBC' }}
                className="text-xs flex items-center gap-1 px-2.5 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                <span className="font-normal text-right">Update Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {pdfSuccessToast && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{pdfSuccessToast}</span>
            </div>
          )}

          {/* Statement Auto-Categorization Hero Banner */}
          <div className="bg-[#1d1a27] text-white rounded-2xl p-5 shadow-sm border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#fbf050] text-[#1d1a27] flex items-center justify-center font-extrabold shrink-0 mt-0.5 shadow-xs">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Auto-Fill Form 65 from Bank Statement
                  </h3>
                  <span className="status-tag-compact bg-[#fbf050] text-[#1d1a27] font-bold border border-[#fbf050]">
                    Jan 1 – Jan 30
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Upload your monthly bank or credit card statement to automatically populate earnings and expenses directly into these inputs, then refine with LITbot.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStatementModalOpen(true)}
              className="shrink-0 bg-[#fbf050] hover:bg-[#fffa78] text-[#1d1a27] font-bold text-xs px-4.5 py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 self-start sm:self-center"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Statement (Jan 1-30)</span>
            </button>
          </div>

          {/* Debtor Overview Strip matching mockups */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">{profile.firstName} {profile.lastName}</div>
              <div>{profile.addressLine1}, {profile.province} {profile.postalCode}</div>
              <div>{profile.phone}</div>
            </div>
            <div className="sm:text-right">
              <div className="font-semibold text-slate-900">{profile.currentTitle}, {profile.company}</div>
              <div>{profile.maritalStatus}, {profile.spouseName}</div>
              <div className="font-medium text-slate-500">{profile.householdSize} in household · LIT: {profile.litName?.split(',')[0]}</div>
            </div>
          </div>

          {/* Wizard Step Navigation Pills */}
          <div className="flex items-center justify-between overflow-x-auto pb-1 text-xs gap-2 select-none">
            {[
              { num: 1, label: '1. Household Income' },
              { num: 2, label: '2. Non-Discretionary' },
              { num: 3, label: '3. Housing & Personal' },
              { num: 4, label: '4. Living & Transit' },
              { num: 5, label: '5. Summary & Filing' }
            ].map(step => (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                  currentStep === step.num
                    ? 'bg-[#1d1a27] text-white shadow-sm font-bold'
                    : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200 font-normal'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          {/* STEP 1: MONTHLY HOUSEHOLD INCOME (Screen 1) */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                MONTHLY HOUSEHOLD INCOME (STATUTORY FORM 65)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Debtor */}
                <div className="space-y-3">
                  <div className="font-extrabold text-sm text-slate-900 mb-1">
                    {profile.firstName} {profile.lastName} (Debtor)
                  </div>
                  {[
                    { key: 'employmentIncome', label: 'Employment Income' },
                    { key: 'pensionAnnuities', label: 'Pension/Annuities' },
                    { key: 'childSupport', label: 'Child Support' },
                    { key: 'spousalSupport', label: 'Spousal Support' },
                    { key: 'employmentIncomeBenefits', label: 'Employment Income Benefits' },
                    { key: 'socialAssistance', label: 'Social Assistance' },
                    { key: 'selfEmploymentIncome', label: 'Self-Employment Income' },
                    { key: 'childTaxBenefit', label: 'Child Tax Benefit' },
                    { key: 'otherNetIncome', label: 'Other Net Income' }
                  ].map(row => (
                    <div key={row.key} className="relative">
                      <FloatingInput
                        type="number"
                        prefix="$"
                        label={row.label}
                        helpText={statutoryExplanations[row.key] || 'Statutory line item for monthly Form 65 determination.'}
                        value={activeReport.income.debtor[row.key as keyof typeof activeReport.income.debtor] || ''}
                        onChange={(e) => handleDebtorIncomeChange(row.key as any, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                  <div className="pt-2 text-xs font-bold text-slate-900">
                    Total: {formatCurrency(debtorIncomeTotal)}
                  </div>
                </div>

                {/* Column 2: Spouse */}
                <div className="space-y-3">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                    {profile.spouseName || 'Jane Johnson'} (Spouse / Partner)
                  </div>
                  {[
                    { key: 'employmentIncome', label: 'Employment Income' },
                    { key: 'pensionAnnuities', label: 'Pension/Annuities' },
                    { key: 'childSupport', label: 'Child Support' },
                    { key: 'spousalSupport', label: 'Spousal Support' },
                    { key: 'employmentIncomeBenefits', label: 'Employment Income Benefits' },
                    { key: 'socialAssistance', label: 'Social Assistance' },
                    { key: 'selfEmploymentIncome', label: 'Self-Employment Income' },
                    { key: 'childTaxBenefit', label: 'Child Tax Benefit' },
                    { key: 'otherNetIncome', label: 'Other Net Income' }
                  ].map(row => (
                    <div key={row.key} className="flex items-center gap-2">
                      <FloatingInput
                        type="number"
                        prefix="$"
                        label={row.label}
                        value={activeReport.income.spouse[row.key as keyof typeof activeReport.income.spouse] || ''}
                        onChange={(e) => handleSpouseIncomeChange(row.key as any, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                  <div className="pt-2 text-xs font-bold text-slate-900">
                    Total: {formatCurrency(spouseIncomeTotal)}
                  </div>
                </div>
              </div>

              {/* Total combined */}
              <div className="p-4 bg-slate-100 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="font-bold">Combined Monthly Household Gross:</span>
                <span className="text-base font-normal text-slate-900">
                  {formatCurrency(totalGrossIncome)} CAD
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: NON-DISCRETIONARY EXPENSES (Screen 2) */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                NON-DISCRETIONARY EXPENSES (STATUTORY DEDUCTIONS)
              </div>

              <div className="space-y-3">
                {[
                  { key: 'childSupportPayments', label: 'Child Support Payments' },
                  { key: 'spousalSupportPayments', label: 'Spousal Support Payments' },
                  { key: 'childCare', label: 'Child Care' },
                  { key: 'medicalConditionExpenses', label: 'Medical Condition Expenses' },
                  { key: 'finesPenaltiesCourt', label: 'Fines/Penalties imposed by the court' },
                  { key: 'expensesConditionEmployment', label: 'Expenses as a condition of employment' },
                  { key: 'debtsStayLifted', label: 'Debts where stay has been lifted' }
                ].map(row => {
                  const hasAttachment = activeReport.nonDiscretionary.attachments?.[row.key]?.length;
                  return (
                    <div key={row.key} className="relative">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <FloatingInput
                            type="number"
                            prefix="$"
                            label={row.label}
                            helpText={statutoryExplanations[row.key] || 'Statutory deduction item.'}
                            value={
                              typeof activeReport.nonDiscretionary[row.key as keyof typeof activeReport.nonDiscretionary] === 'number'
                                ? (activeReport.nonDiscretionary[row.key as keyof typeof activeReport.nonDiscretionary] as number)
                                : ''
                            }
                            onChange={(e) => handleNonDiscChange(row.key as any, parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        {/* Attach button matching input design */}
                        <button
                          type="button"
                          onClick={() => setAttachingCategory(row.key)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[52px] ${
                            hasAttachment
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-white border border-[#2d2d2d] text-slate-700 hover:bg-slate-100 shadow-[0_2px_0_rgba(0,0,0,0.22)]'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>{hasAttachment ? 'Attached' : 'Attach'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-sm font-bold text-slate-900">
                Total: {formatCurrency(totalNonDiscretionary)}
              </div>

              {/* Did you know? callout matching screenshot */}
              <div className="bg-slate-100 border border-slate-200/90 rounded-2xl p-5 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 text-sm">Did you know?</div>
                <p>
                  <span className="font-bold text-slate-900">Medical Condition Expenses</span> include medical marijuana prescriptions and can be submitted with other medicines.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: HOUSEHOLD DISCRETIONARY EXPENSES (Screen 3) */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                HOUSEHOLD DISCRETIONARY EXPENSES: HOUSING & PERSONAL
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Housing & Properties */}
                <div className="space-y-3">
                  <div className="font-bold text-sm text-slate-900 mb-1">
                    Housing & Properties
                  </div>
                  {[
                    { key: 'rentOrMortgage', label: 'Rent or Mortgage Payments' },
                    { key: 'propertyTaxesCondo', label: 'Property Taxes and Condo Fees' },
                    { key: 'heatingGasOil', label: 'Heating / Gas / Oil' },
                    { key: 'telephone', label: 'Telephone' },
                    { key: 'cable', label: 'Cable' },
                    { key: 'hydro', label: 'Hydro' },
                    { key: 'water', label: 'Water' },
                    { key: 'furniture', label: 'Furniture' },
                    { key: 'other', label: 'Other' }
                  ].map(row => (
                    <div key={row.key} className="relative">
                      <FloatingInput
                        type="number"
                        prefix="$"
                        label={row.label}
                        helpText="Form 65 housing allowance guideline. Keep bills and rent receipts for audit."
                        value={activeReport.discretionary.housing[row.key as keyof typeof activeReport.discretionary.housing] || ''}
                        onChange={(e) => handleDiscretionaryChange('housing', row.key, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                  <div className="pt-2 text-xs font-bold text-slate-900">
                    Total: {formatCurrency(housingTotal)}
                  </div>
                </div>

                {/* Personal */}
                <div className="space-y-3">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                    Personal
                  </div>
                  {[
                    { key: 'smoking', label: 'Smoking' },
                    { key: 'alcohol', label: 'Alcohol' },
                    { key: 'heatingGasOil', label: 'Heating / Gas / Oil' },
                    { key: 'rentOrMortgage', label: 'Rent or Mortgage Payments' },
                    { key: 'cable', label: 'Cable' },
                    { key: 'hydro', label: 'Hydro' },
                    { key: 'water', label: 'Water' },
                    { key: 'furniture', label: 'Furniture' },
                    { key: 'other', label: 'Other' }
                  ].map(row => (
                    <div key={row.key} className="relative">
                      <FloatingInput
                        type="number"
                        prefix="$"
                        label={row.label}
                        helpText="Form 65 personal expenditure allowance item."
                        value={activeReport.discretionary.personal[row.key as keyof typeof activeReport.discretionary.personal] || ''}
                        onChange={(e) => handleDiscretionaryChange('personal', row.key, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                  <div className="pt-2 text-xs font-bold text-slate-900">
                    Total: {formatCurrency(personalTotal)}
                  </div>
                </div>
              </div>

              {/* Did you know? callout matching Screen 3 */}
              <div className="bg-slate-100 border border-slate-200/90 rounded-2xl p-5 text-xs text-slate-700 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">Did you know?</div>
                <p>
                  All discretionary expenses should have a receipt or prescription attached. Any transactions without attachments will be moved into <span className="font-bold text-slate-900">Non-Discretionary</span> section.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: HOUSEHOLD DISCRETIONARY EXPENSES (Screen 4) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                HOUSEHOLD DISCRETIONARY EXPENSES: MEDICAL, LIVING & TRANSIT
              </div>

              {/* Group 1: Non-recoverable Medical */}
              <div className="space-y-3">
                <div className="font-bold text-sm text-slate-900">Non-recoverable Medical</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Prescriptions"
                    value={activeReport.discretionary.medical.prescriptions || ''}
                    onChange={(e) => handleDiscretionaryChange('medical', 'prescriptions', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Dental"
                    value={activeReport.discretionary.medical.dental || ''}
                    onChange={(e) => handleDiscretionaryChange('medical', 'dental', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Medical Subtotal: {formatCurrency(medicalTotal)}
                </div>
              </div>

              {/* Group 2: Day-to-day Living */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-xs sm:text-sm text-slate-900">Day-to-day Living</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Food & Grocery"
                    value={activeReport.discretionary.dayToDay.foodGrocery || ''}
                    onChange={(e) => handleDiscretionaryChange('dayToDay', 'foodGrocery', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Clothing"
                    value={activeReport.discretionary.dayToDay.clothing || ''}
                    onChange={(e) => handleDiscretionaryChange('dayToDay', 'clothing', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Laundry & Dry Cleaning"
                    value={activeReport.discretionary.dayToDay.laundryDryCleaning || ''}
                    onChange={(e) => handleDiscretionaryChange('dayToDay', 'laundryDryCleaning', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Grooming & Toiletries"
                    value={activeReport.discretionary.dayToDay.groomingToiletries || ''}
                    onChange={(e) => handleDiscretionaryChange('dayToDay', 'groomingToiletries', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Living Subtotal: {formatCurrency(dayToDayTotal)}
                </div>
              </div>

              {/* Group 3: Transportation */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-xs sm:text-sm text-slate-900">Transportation</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Repair, Maintenance & Gas"
                    value={activeReport.discretionary.transportation.repairMaintenanceGas || ''}
                    onChange={(e) => handleDiscretionaryChange('transportation', 'repairMaintenanceGas', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Public Transportation"
                    value={activeReport.discretionary.transportation.publicTransportation || ''}
                    onChange={(e) => handleDiscretionaryChange('transportation', 'publicTransportation', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Transportation Subtotal: {formatCurrency(transportTotal)}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: INSURANCE, PAYMENTS & STATUTORY FILING TO LIT (Screen 5 + Submission) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                INSURANCE, STATUTORY PAYMENTS & STATUTORY REVIEW
              </div>

              {/* Insurance */}
              <div className="space-y-3">
                <div className="font-bold text-xs sm:text-sm text-slate-900">Insurance Expenses</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Vehicle Insurance"
                    value={activeReport.discretionary.insurance.vehicle || ''}
                    onChange={(e) => handleDiscretionaryChange('insurance', 'vehicle', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="House Insurance"
                    value={activeReport.discretionary.insurance.house || ''}
                    onChange={(e) => handleDiscretionaryChange('insurance', 'house', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Furniture & Contents"
                    value={activeReport.discretionary.insurance.furnitureContents || ''}
                    onChange={(e) => handleDiscretionaryChange('insurance', 'furnitureContents', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Life Insurance"
                    value={activeReport.discretionary.insurance.lifeInsurance || ''}
                    onChange={(e) => handleDiscretionaryChange('insurance', 'lifeInsurance', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Insurance Total: {formatCurrency(insuranceTotal)}
                </div>
              </div>

              {/* Payments */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-xs sm:text-sm text-slate-900">Payments</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="To The Estate (Trustee Dividend)"
                    value={activeReport.discretionary.payments.toEstate || ''}
                    onChange={(e) => handleDiscretionaryChange('payments', 'toEstate', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="To Secured Creditor"
                    value={activeReport.discretionary.payments.toSecuredCreditor || ''}
                    onChange={(e) => handleDiscretionaryChange('payments', 'toSecuredCreditor', parseFloat(e.target.value) || 0)}
                  />
                  <FloatingInput
                    type="number"
                    prefix="$"
                    label="Other Than Mortgage or Vehicle"
                    value={activeReport.discretionary.payments.otherThanMortgageOrVehicle || ''}
                    onChange={(e) => handleDiscretionaryChange('payments', 'otherThanMortgageOrVehicle', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Statutory Surplus Income Calculation Breakdown (OSB Official Standard) */}
              <div className="bg-[#1d1a27] text-white p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="text-sm font-bold uppercase tracking-wider text-[#b6b3ff]">
                    Superintendent of Bankruptcy Surplus Calculation
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Statutory Household Size: {profile.householdSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Gross Household:</span>
                    <span className="text-base font-bold text-white">{formatCurrency(totalGrossIncome)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Non-Discretionary:</span>
                    <span className="text-base font-bold text-white">{formatCurrency(totalNonDiscretionary)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">OSB Threshold:</span>
                    <span className="text-base font-bold text-slate-300">{formatCurrency(householdThreshold)}</span>
                  </div>
                  <div>
                    <span className="text-[#fbf050] font-bold block mb-1">Surplus Owed (50%):</span>
                    <span className="text-xl font-bold text-[#fbf050]">{formatCurrency(calculatedSurplus)}</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#b6b3ff] shrink-0 mt-0.5" />
                  <span>
                    When submitted, this Form 65 report and all linked receipt proofs will be automatically transmitted to <strong className="text-white">{profile.litName} (<a href={getMailtoUrl(profile.litEmail, `Form 65 Filing - ${activeReport.month} ${activeReport.year}`)} className="text-[#b6b3ff] underline hover:text-white transition" title="Email LIT">{profile.litEmail}</a>)</strong> at {profile.litFirm} for official filing in your bankruptcy estate.
                  </span>
                </div>
              </div>

              {/* Action Buttons: Download PDF & Submit Monthly Report */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-[#1d1a27] hover:bg-[#2d283c] text-white font-bold text-xs tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-white/10 shrink-0 disabled:opacity-70 active:scale-95"
                >
                  <Download className={`w-4 h-4 text-[#b6b3ff] ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Form 65 PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    background: 'var(--colour-dark-highlight, #F9F45D)',
                    boxShadow: '4px 6px 0px black',
                    borderRadius: 8,
                    color: 'var(--colour-dark-accent, #3E4A4F)',
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontSize: '13.34px',
                    fontWeight: '700',
                    lineHeight: '20.96px'
                  }}
                  className="flex-1 w-full py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:translate-x-[2px] active:translate-y-[3px] active:[box-shadow:2px_3px_0px_black]"
                >
                  <Send className={`w-4 h-4 stroke-[2.5] ${isSubmitting ? 'animate-pulse' : ''}`} style={{ color: '#3E4A4F' }} />
                  <span style={{ fontWeight: '700' }}>
                    {isSubmitting 
                      ? 'Generating Form 65 & Dispatching to LIT...' 
                      : `Submit ${activeReport.month} Report & Email to Trustee (${profile.litName?.split(',')[0] || 'LIT'})`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons at Bottom */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev. Section</span>
              </button>
            ) : <div />}

            {currentStep < 5 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                style={{
                  background: 'var(--colour-dark-highlight, #F9F45D)',
                  boxShadow: '4px 6px 0px black',
                  borderRadius: 8,
                  color: 'var(--colour-dark-accent, #3E4A4F)',
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '13.34px',
                  fontWeight: '700',
                  lineHeight: '20.96px'
                }}
                className="px-5 py-2.5 transition-all flex items-center gap-2 cursor-pointer hover:brightness-105 active:translate-x-[2px] active:translate-y-[3px] active:[box-shadow:2px_3px_0px_black]"
              >
                <span style={{ fontWeight: '700' }}>Next Section</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" style={{ color: '#3E4A4F' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attach Receipt Modal */}
      {attachingCategory && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setAttachingCategory(null)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-[#b6b3ff]">
                Attach Statutory Proof: {attachingCategory}
              </div>
              <button 
                onClick={() => setAttachingCategory(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              The Superintendent of Bankruptcy requires verified receipts or medical prescriptions for non-discretionary statutory deductions. Select from your receipt vault or upload a new scan.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {receipts.map(r => (
                <label 
                  key={r.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-xs ${
                    selectedReceiptId === r.id
                      ? 'border-[#b6b3ff] bg-[#b6b3ff]/10 text-white'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="receiptAttachment"
                      checked={selectedReceiptId === r.id}
                      onChange={() => setSelectedReceiptId(r.id)}
                      className="accent-[#b6b3ff]"
                    />
                    <div>
                      <div className="font-bold text-white">{r.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.fileName || 'Document.pdf'} · {r.date}</div>
                    </div>
                  </div>
                  <span className="font-bold text-[#fbf050]">{formatCurrency(r.amount)}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  if (attachingCategory) {
                    const currentAttachments = activeReport.nonDiscretionary.attachments || {};
                    const updatedAttachments = {
                      ...currentAttachments,
                      [attachingCategory]: selectedReceiptId ? [selectedReceiptId] : ['mock-rec-1']
                    };
                    const updated = {
                      ...activeReport,
                      nonDiscretionary: {
                        ...activeReport.nonDiscretionary,
                        attachments: updatedAttachments
                      }
                    };
                    onUpdateReport(updated);
                  }
                  setAttachingCategory(null);
                }}
                className="flex-1 py-3 rounded-xl bg-[#b6b3ff] text-[#242031] font-bold text-xs hover:bg-white transition"
              >
                Link Selected Proof to Form 65
              </button>
                <button
                  type="button"
                  onClick={() => setAttachingCategory(null)}
                  className="py-3 px-4 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      {/* PDF Download Toast Notification */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 left-6 max-w-sm bg-[#1d1a27] text-white border-2 border-[#b6b3ff] rounded-2xl p-4 shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-xl bg-[#b6b3ff] text-[#242031] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black uppercase text-[#b6b3ff] tracking-wider">PDF Report Downloaded</div>
            <div className="text-xs text-slate-200 mt-0.5">{pdfSuccessToast}</div>
          </div>
        </div>
      )}
    </div>
  );
};
