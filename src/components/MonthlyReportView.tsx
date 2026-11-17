import React, { useState } from 'react';
import {
  HistoryIcon,
  LinkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckIcon,
  UploadIcon,
  SendIcon,
  ShieldCheckeredIcon,
  DownloadIcon,
  ClipboardIcon,
  SparklesIcon,
  BarChartBoxIcon,
  UserCircleIcon,
  CloseIcon,
  CancelIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { MonthlyReport, UserProfile, Receipt, Transaction } from '../types';
import { generateMonthlyReportPDF } from '../lib/pdfReportGenerator';
import { generateLITAuditPacketPDF } from '../lib/pdfAuditPacketGenerator';
import { FloatingInput } from './FloatingInput';
import { DropdownMenu, DropdownMenuItem } from './DropdownMenu';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState<boolean>(false);

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
    'selfEmploymentIncome': 'Net business income (gross revenues minus direct verified expenses ledger).',
    'childSupportPayments': 'Legally mandated child support paid pursuant to a court order or written agreement.',
    'spousalSupportPayments': 'Mandatory spousal support paid to a former spouse.',
    'medicalConditionExpenses': 'Prescription medicines, physician-authorized medical cannabis, medical devices, dental therapy not covered by MSP/insurance.',
    'expensesConditionEmployment': 'Mandatory safety equipment, union dues, or tools required to maintain position.',
    'debtsStayLifted': 'Statutory obligations where the bankruptcy stay has been lifted by court order.',
    'propertyTaxesCondo': 'Requires copy of property tax assessment or condo fee statement for trustee verification.'
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
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: HISTORY Card & LITbot AI Assistant (4 cols when open) */}
        {isHistoryOpen && (
          <div className="lg:col-span-4 space-y-6 animate-in fade-in duration-200">
            <div className="bg-white text-[#101010] rounded-3xl p-6 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#b4b1fc]/35">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-[#8c93fc]" />
                  <h3 className="text-sm font-extrabold tracking-wide uppercase text-[#101010]">
                    MONTHLY HISTORY
                  </h3>
                </div>
                <CleanSlateButton
                  variant="white"
                  size="icon"
                  onClick={() => setIsHistoryOpen(false)}
                  title="Collapse Monthly History to expand form area"
                  aria-label="Collapse Monthly History"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </CleanSlateButton>
              </div>

              {/* Monthly History List matching PAST UPLOADS in Receipts */}
              <div className="divide-y divide-[#d8d9f8]/70">
                {reports.map((rep) => {
                  const isCurrent = rep.id === activeReport.id;
                  const isOverdue = rep.status === 'Overdue';
                  const isSubmitted = rep.status === 'Submitted';

                  return (
                    <div
                      key={rep.id}
                      onClick={() => onSelectReport(rep.id)}
                      className={`py-3.5 px-3.5 transition cursor-pointer flex items-center justify-between relative ${
                        isCurrent
                          ? 'bg-[#f7f4eb] rounded-xl'
                          : 'hover:bg-[#fbf9f5] rounded-xl'
                      }`}
                    >
                      {/* Active highlight bar on left */}
                      {isCurrent && (
                        <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r bg-[#4b4856]" />
                      )}

                      <div className="pl-2.5 min-w-0">
                        <div className="text-xs font-extrabold uppercase tracking-wide text-[#101010]">
                          {rep.month}
                        </div>
                        <div className="text-[11px] text-[#6e6b7b] truncate mt-0.5 tabular-nums">
                          {isSubmitted
                            ? `Sent to ${rep.sentToLitName?.split(',')[0] || profile.litName?.split(',')[0] || 'LIT'} on ${new Date(rep.submittedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : rep.lastEditDate}
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSubmitted
                              ? 'bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isCurrent
                              ? 'bg-[#fbf050] text-[#101010] border border-[#101010]/30'
                              : 'bg-slate-100 text-[#6e6b7b]'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-[#b4b1fc]/35">
                <CleanSlateButton
                  variant="white"
                  size="md"
                  fullWidth
                  rightIcon={ChevronRightIcon}
                  onClick={() => {}}
                >
                  See All (12 Months)
                </CleanSlateButton>
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
        )}

        {/* Right Column: Multi-Step Form 65 Wizard (8 cols when open, 12 cols when collapsed) */}
        <div className={`${isHistoryOpen ? 'lg:col-span-8' : 'lg:col-span-12'} bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-6 transition-all duration-300`}>
          
          {/* Top Bar: Calendar + Month/Year + Re-open History + More Actions Dropdown */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#8c93fc]/25">
            <div className="flex items-center gap-2.5 flex-wrap">
              {!isHistoryOpen && (
                <CleanSlateButton
                  variant="white"
                  size="xs"
                  leftIcon={ChevronRightIcon}
                  onClick={() => setIsHistoryOpen(true)}
                  title="Show Monthly History"
                  className="mr-1"
                >
                  Monthly History
                </CleanSlateButton>
              )}
              <h2 className="text-base sm:text-lg font-extrabold tracking-wide uppercase text-[#101010]">
                {activeReport.month} {activeReport.year}
              </h2>
              {activeReport.status === 'Submitted' && (
                <span className="ml-2 inline-flex items-center gap-1 bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <CheckIcon className="w-3 h-3" />
                  Filed to LIT
                </span>
              )}
            </div>

            {/* Sleek "More Actions" Dropdown Button */}
            <DropdownMenu
              trigger={
                <CleanSlateButton
                  variant="periwinkle"
                  size="icon"
                  title="More actions"
                  aria-label="More actions"
                >
                  <BarChartBoxIcon className="w-4 h-4" />
                </CleanSlateButton>
              }
              items={[
                {
                  id: 'download-report',
                  label: isGeneratingPdf ? 'Generating PDF...' : 'Download Report',
                  icon: DownloadIcon,
                  onClick: handleDownloadReport
                },
                {
                  id: 'export-audit',
                  label: isExportingAuditPacket ? 'Exporting Dossier...' : 'Export Audit Packet',
                  icon: ClipboardIcon,
                  onClick: handleExportAuditPacket
                },
                {
                  id: 'update-profile',
                  label: 'Update Profile',
                  icon: UserCircleIcon,
                  hasDividerAbove: true,
                  onClick: onNavigateToProfile
                }
              ]}
              align="right"
            />
          </div>

          {pdfSuccessToast && (
            <div className="p-3 bg-[#46e3a5]/20 border border-[#46e3a5] text-[#102a1f] text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckIcon className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{pdfSuccessToast}</span>
            </div>
          )}

          {/* Statement Auto-Categorization Hero Banner */}
          <div className="bg-[#1d1a27] text-white rounded-2xl p-5 sm:p-6 border-[1.5px] border-[#101010] space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F9F45D] text-[#1d1a27] border border-[#101010] flex items-center justify-center font-extrabold shrink-0 mt-0.5">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Auto-Fill Form 65 from Bank Statement
                  </h3>
                  <span className="status-tag-compact bg-[#F9F45D] text-[#1d1a27] font-bold border border-[#101010]">
                    Jan 1 – Jan 30
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed w-full">
                  Upload your monthly bank or credit card statement to automatically populate earnings and expenses directly into these inputs, then refine with LITbot.
                </p>
              </div>
            </div>

            <CleanSlateButton
              variant="yellow"
              size="md"
              fullWidth
              leftIcon={UploadIcon}
              onClick={() => setIsStatementModalOpen(true)}
            >
              Upload Statement (Jan 1-30)
            </CleanSlateButton>
          </div>

          {/* Debtor Overview Strip */}
          <div className="bg-white border border-[#d8d9f8] rounded-2xl p-4 text-xs text-[#4b4856] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="font-extrabold text-[#101010] text-sm">{profile.firstName} {profile.lastName}</div>
              <div>{profile.addressLine1}, {profile.province} {profile.postalCode}</div>
              <div className="tabular-nums">{profile.phone}</div>
            </div>
            <div className="sm:text-right">
              <div className="font-bold text-[#101010]">{profile.currentTitle}, {profile.company}</div>
              <div>{profile.maritalStatus}, {profile.spouseName}</div>
              <div className="font-medium text-[#6e6b7b]">{profile.householdSize} in household · LIT: {profile.litName?.split(',')[0]}</div>
            </div>
          </div>

          {/* Wizard Step Navigation */}
          <div className="flex items-center justify-between overflow-x-auto pb-1.5 text-xs gap-2.5 select-none">
            {[
              { num: 1, label: '1. Household Income' },
              { num: 2, label: '2. Non-Discretionary' },
              { num: 3, label: '3. Housing & Personal' },
              { num: 4, label: '4. Living & Transit' },
              { num: 5, label: '5. Summary & Filing' }
            ].map(step => (
              <CleanSlateButton
                key={step.num}
                variant={currentStep === step.num ? 'dark' : 'white'}
                size="xs"
                onClick={() => setCurrentStep(step.num)}
              >
                {step.label}
              </CleanSlateButton>
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
                        helpText={statutoryExplanations[row.key]}
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
              <div className="p-4 bg-white rounded-2xl border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex items-center justify-between text-xs font-bold text-[#101010]">
                <span className="font-bold uppercase tracking-wide">Combined Monthly Household Gross:</span>
                <span className="text-base font-extrabold text-[#101010] tabular-nums">
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
                            helpText={statutoryExplanations[row.key]}
                            value={
                              typeof activeReport.nonDiscretionary[row.key as keyof typeof activeReport.nonDiscretionary] === 'number'
                                ? (activeReport.nonDiscretionary[row.key as keyof typeof activeReport.nonDiscretionary] as number)
                                : ''
                            }
                            onChange={(e) => handleNonDiscChange(row.key as any, parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <CleanSlateButton
                          variant={hasAttachment ? 'status-success' : 'white'}
                          size="sm"
                          leftIcon={hasAttachment ? CheckIcon : LinkIcon}
                          onClick={() => setAttachingCategory(row.key)}
                          className="min-h-[48px] shrink-0"
                        >
                          {hasAttachment ? 'Attached' : 'Attach'}
                        </CleanSlateButton>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-sm font-extrabold text-[#101010] tabular-nums">
                Total: {formatCurrency(totalNonDiscretionary)}
              </div>

              {/* Did you know? callout */}
              <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-5 text-xs text-[#4b4856] space-y-1">
                <div className="font-extrabold text-[#101010] text-sm">Did you know?</div>
                <p>
                  <span className="font-bold text-[#101010]">Medical Condition Expenses</span> include medical marijuana prescriptions and can be submitted with other medicines.
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
                        helpText={statutoryExplanations[row.key]}
                        value={activeReport.discretionary.housing[row.key as keyof typeof activeReport.discretionary.housing] || ''}
                        onChange={(e) => handleDiscretionaryChange('housing', row.key, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                  <div className="pt-2 text-xs font-bold text-slate-900">
                    Total: {formatCurrency(housingTotal)}
                  </div>
                </div>

                {/* Personal (Cleaned up - unique personal categories, no duplicates from Housing!) */}
                <div className="space-y-3">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                    Personal
                  </div>
                  {[
                    { key: 'smoking', label: 'Smoking & Tobacco' },
                    { key: 'alcohol', label: 'Alcohol & Beverages' },
                    { key: 'diningOut', label: 'Dining Out & Takeout' },
                    { key: 'clothing', label: 'Clothing & Apparel' },
                    { key: 'grooming', label: 'Grooming & Personal Care' },
                    { key: 'hobbies', label: 'Hobbies & Recreation' },
                    { key: 'other', label: 'Other Personal' }
                  ].map(row => (
                    <div key={row.key} className="relative">
                      <FloatingInput
                        type="number"
                        prefix="$"
                        label={row.label}
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
              <div className="bg-white border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-2xl p-5 text-xs text-[#4b4856] space-y-1">
                <div className="font-extrabold text-[#101010] text-sm">Did you know?</div>
                <p>
                  All discretionary expenses should have a receipt or prescription attached. Any transactions without attachments will be moved into <span className="font-bold text-[#101010]">Non-Discretionary</span> section.
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
              <div className="bg-[#1d1a27] text-white p-6 rounded-2xl border-[1.5px] border-[#101010] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="text-sm font-bold uppercase tracking-wider text-[#b6b3ff]">
                    Superintendent of Bankruptcy Surplus Calculation
                  </div>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Statutory Household Size: {profile.householdSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Gross Household:</span>
                    <span className="text-base font-bold text-white tabular-nums">{formatCurrency(totalGrossIncome)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Non-Discretionary:</span>
                    <span className="text-base font-bold text-white tabular-nums">{formatCurrency(totalNonDiscretionary)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">OSB Threshold:</span>
                    <span className="text-base font-bold text-slate-300 tabular-nums">{formatCurrency(householdThreshold)}</span>
                  </div>
                  <div>
                    <span className="text-[#F9F45D] font-bold block mb-1">Surplus Owed (50%):</span>
                    <span className="text-xl font-extrabold text-[#F9F45D] tabular-nums">{formatCurrency(calculatedSurplus)}</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldCheckeredIcon className="w-4 h-4 text-[#b6b3ff] shrink-0 mt-0.5" />
                  <span>
                    When submitted, this Form 65 report and all linked receipt proofs will be automatically transmitted to <strong className="text-white">{profile.litName} (<a href={getMailtoUrl(profile.litEmail, `Form 65 Filing - ${activeReport.month} ${activeReport.year}`)} className="text-[#b6b3ff] underline hover:text-white transition" title="Email LIT">{profile.litEmail}</a>)</strong> at {profile.litFirm} for official filing in your bankruptcy estate.
                  </span>
                </div>
              </div>

              {/* Action Buttons: Download PDF & Submit Monthly Report */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <CleanSlateButton
                  variant="dark"
                  size="lg"
                  leftIcon={DownloadIcon}
                  onClick={handleDownloadReport}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto shrink-0"
                >
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download Form 65 PDF'}
                </CleanSlateButton>

                <CleanSlateButton
                  variant="yellow"
                  size="lg"
                  leftIcon={SendIcon}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 w-full"
                >
                  {isSubmitting
                    ? 'Generating Form 65 & Dispatching to LIT...'
                    : `Submit ${activeReport.month} Report & Email to Trustee (${profile.litName?.split(',')[0] || 'LIT'})`}
                </CleanSlateButton>
              </div>
            </div>
          )}

          {/* Navigation Buttons at Bottom */}
          <div className="flex items-center justify-between pt-4 border-t border-[#8c93fc]/25">
            {currentStep > 1 ? (
              <CleanSlateButton
                variant="white"
                size="md"
                leftIcon={ChevronLeftIcon}
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Prev. Section
              </CleanSlateButton>
            ) : <div />}

            {currentStep < 5 && (
              <CleanSlateButton
                variant="yellow"
                size="md"
                rightIcon={ChevronRightIcon}
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Next Section
              </CleanSlateButton>
            )}
          </div>
        </div>
      </div>

      {/* Attach Receipt Modal — unified crisp white neo-brutalist design */}
      {attachingCategory && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setAttachingCategory(null)}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-[6px_8px_0px_#000000] space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#b4b1fc]/35">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                  Attach Statutory Proof
                </div>
                <div className="text-xs text-[#6e6b7b] mt-0.5">
                  Category: <span className="font-semibold text-[#101010]">{attachingCategory}</span>
                </div>
              </div>
              <CleanSlateButton
                variant="white"
                size="icon"
                onClick={() => setAttachingCategory(null)}
                aria-label="Close attach proof modal"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </CleanSlateButton>
            </div>

            <p className="text-xs text-[#4b4856] leading-relaxed">
              The Superintendent of Bankruptcy requires verified receipts or medical prescriptions for non-discretionary statutory deductions. Select from your receipt vault below.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {receipts.map(r => (
                <label
                  key={r.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer text-xs ${
                    selectedReceiptId === r.id
                      ? 'border-[#101010] bg-[#f7f4eb] shadow-[2px_3px_0px_#a5a7fb]'
                      : 'border-[#d8d9f8] bg-white hover:border-[#8c93fc]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="receiptAttachment"
                      checked={selectedReceiptId === r.id}
                      onChange={() => setSelectedReceiptId(r.id)}
                      className="accent-[#101010]"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[#101010] truncate">{r.title}</div>
                      <div className="text-[11px] text-[#6e6b7b] font-mono truncate tabular-nums">
                        {r.fileName || 'Document.pdf'} · {r.date}
                      </div>
                    </div>
                  </div>
                  <span className="font-extrabold text-[#101010] tabular-nums ml-2 shrink-0">{formatCurrency(r.amount)}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#b4b1fc]/35">
              <CleanSlateButton
                variant="white"
                size="md"
                leftIcon={CancelIcon}
                onClick={() => setAttachingCategory(null)}
              >
                Cancel
              </CleanSlateButton>
              <CleanSlateButton
                variant="dark-yellow"
                size="md"
                leftIcon={LinkIcon}
                className="flex-1"
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
              >
                Link Selected Proof to Form 65
              </CleanSlateButton>
            </div>
          </div>
        </div>
      )}

      {/* PDF Download Toast Notification */}
      {pdfSuccessToast && (
        <div className="fixed bottom-6 left-6 max-w-sm bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-2xl p-4 shadow-[5px_6px_0px_#000000] z-50 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-xl bg-[#46e3a5] border border-[#101010] text-[#101010] flex items-center justify-center shrink-0">
            <CheckIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold uppercase text-[#101010] tracking-wider">PDF Report Downloaded</div>
            <div className="text-xs text-[#4b4856] mt-0.5">{pdfSuccessToast}</div>
          </div>
        </div>
      )}
    </div>
  );
};
