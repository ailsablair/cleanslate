import React, { useState, useRef } from 'react';
import {
  MagicWandIcon,
  SendIcon,
  SparklesIcon,
  UploadIcon,
  ClipboardIcon,
  CheckIcon,
  CloseIcon,
  CancelIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { MonthlyReport, UserProfile, Receipt, Transaction } from '../types';
import { formatCurrency } from '../lib/formatters';
import { getFallbackLitBotResponse } from '../lib/litbotFallback';
import { parseCsvStatement, parseOfxStatement } from '../lib/statementParser';

interface LitBotReportAssistantProps {
  activeReport: MonthlyReport;
  profile: UserProfile;
  receipts: Receipt[];
  onUpdateReport: (updatedReport: MonthlyReport) => void;
  onAttachReceiptToCategory?: (category: string, receiptId: string) => void;
  isStatementModalOpen?: boolean;
  setIsStatementModalOpen?: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  clarificationData?: {
    id: string;
    type: 'choice' | 'proof';
    merchant: string;
    amount: number;
    options?: { label: string; action: () => void }[];
    resolved?: boolean;
    resolvedMessage?: string;
  };
}

export const LitBotReportAssistant: React.FC<LitBotReportAssistantProps> = ({
  activeReport,
  profile,
  receipts,
  onUpdateReport,
  onAttachReceiptToCategory,
  isStatementModalOpen: externalModalOpen,
  setIsStatementModalOpen: setExternalModalOpen
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState<boolean>(false);
  const isStatementModalOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setIsStatementModalOpen = setExternalModalOpen || setInternalModalOpen;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: `Hello ${profile.firstName || 'there'}! I'm LITbot, your Virtual Licensed Insolvency Trustee Assistant. I'm here to help you complete your ${activeReport.month} ${activeReport.year} Form 65 monthly report accurately. Ask me any questions about line items, or upload your monthly bank statement to auto-fill your numbers!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isUploadingStatement, setIsUploadingStatement] = useState<boolean>(false);
  const [statementSuccessToast, setStatementSuccessToast] = useState<string | null>(null);
  const [selectedStatementFile, setSelectedStatementFile] = useState<File | null>(null);
  const [isDraggingStatement, setIsDraggingStatement] = useState<boolean>(false);
  const [statementError, setStatementError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSendingQuery, setIsSendingQuery] = useState<boolean>(false);
  const [chatSessionId] = useState<string>(() => `litbot-report-${Date.now()}`);

  // Resilient local fallback only if API is unreachable
  const getOfflineFallbackResponse = (query: string): string => {
    return getFallbackLitBotResponse(
      query,
      {
        firstName: profile.firstName,
        province: profile.province,
        householdSize: profile.householdSize,
        litName: profile.litName,
        activeReportMonth: `${activeReport.month} ${activeReport.year}`
      }
    ).text;
  };

  const renderAssistantText = (content: string) => {
    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      const formatBold = (txt: string) =>
        txt.split(/(\*\*[^*]+\*\*)/g).map((part, pIdx) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>
          ) : (
            part
          )
        );

      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        return (
          <div key={idx} className="font-bold text-[#fbf050] mt-1.5 mb-0.5">
            {trimmed.replace(/^#{2,3}\s+/, '')}
          </div>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={idx} className="pl-3 flex items-start gap-1.5">
            <span className="text-[#b6b3ff]">•</span>
            <span>{formatBold(trimmed.slice(2))}</span>
          </div>
        );
      }
      return <p key={idx}>{formatBold(line)}</p>;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || isSendingQuery) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const historyForApi = messages.map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsSendingQuery(true);

    try {
      const response = await fetch('/api/litbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          messages: historyForApi,
          contextProfile: {
            firstName: profile.firstName,
            province: profile.province,
            householdSize: profile.householdSize,
            litName: profile.litName,
            activeReportMonth: `${activeReport.month} ${activeReport.year}`
          },
          sessionId: chatSessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text || getOfflineFallbackResponse(text),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: getOfflineFallbackResponse(text),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSendingQuery(false);
    }
  };

  const applyParsedTransactionsToReport = (
    report: MonthlyReport,
    parsedTransactions: Array<Omit<Transaction, 'id'>>
  ): MonthlyReport => {
    const next: MonthlyReport = {
      ...report,
      lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      income: {
        ...report.income,
        debtor: { ...report.income.debtor },
        spouse: { ...report.income.spouse }
      },
      nonDiscretionary: { ...report.nonDiscretionary },
      discretionary: {
        ...report.discretionary,
        housing: { ...report.discretionary.housing },
        personal: { ...report.discretionary.personal },
        medical: { ...report.discretionary.medical },
        dayToDay: { ...report.discretionary.dayToDay },
        transportation: { ...report.discretionary.transportation },
        insurance: { ...report.discretionary.insurance },
        payments: { ...report.discretionary.payments }
      }
    };

    const round2 = (n: number) => Number(n.toFixed(2));

    for (const tx of parsedTransactions) {
      const amt = Math.abs(Number(tx.amount) || 0);
      if (amt <= 0) continue;

      switch (tx.form65Category) {
        case 'Employment Income':
          next.income.debtor.employmentIncome = round2((next.income.debtor.employmentIncome || 0) + amt);
          break;
        case 'Pension/Annuities':
          next.income.debtor.pensionAnnuities = round2((next.income.debtor.pensionAnnuities || 0) + amt);
          break;
        case 'Child Support':
          next.income.debtor.childSupport = round2((next.income.debtor.childSupport || 0) + amt);
          break;
        case 'Spousal Support':
          next.income.debtor.spousalSupport = round2((next.income.debtor.spousalSupport || 0) + amt);
          break;
        case 'Employment Insurance Benefits':
          next.income.debtor.employmentIncomeBenefits = round2((next.income.debtor.employmentIncomeBenefits || 0) + amt);
          break;
        case 'Social Assistance':
          next.income.debtor.socialAssistance = round2((next.income.debtor.socialAssistance || 0) + amt);
          break;
        case 'Self-Employment Income':
          next.income.debtor.selfEmploymentIncome = round2((next.income.debtor.selfEmploymentIncome || 0) + amt);
          break;
        case 'Child Tax Benefit':
          next.income.debtor.childTaxBenefit = round2((next.income.debtor.childTaxBenefit || 0) + amt);
          break;
        case 'Other Net Income':
          next.income.debtor.otherNetIncome = round2((next.income.debtor.otherNetIncome || 0) + amt);
          break;
        case 'Child Support Payments':
          next.nonDiscretionary.childSupportPayments = round2((next.nonDiscretionary.childSupportPayments || 0) + amt);
          break;
        case 'Spousal Support Payments':
          next.nonDiscretionary.spousalSupportPayments = round2((next.nonDiscretionary.spousalSupportPayments || 0) + amt);
          break;
        case 'Child Care':
          next.nonDiscretionary.childCare = round2((next.nonDiscretionary.childCare || 0) + amt);
          break;
        case 'Medical Condition Expenses':
          next.nonDiscretionary.medicalConditionExpenses = round2((next.nonDiscretionary.medicalConditionExpenses || 0) + amt);
          break;
        case 'Fines/Penalties Imposed by Court':
          next.nonDiscretionary.finesPenaltiesCourt = round2((next.nonDiscretionary.finesPenaltiesCourt || 0) + amt);
          break;
        case 'Expenses as Condition of Employment':
          next.nonDiscretionary.expensesConditionEmployment = round2((next.nonDiscretionary.expensesConditionEmployment || 0) + amt);
          break;
        case 'Debts Stay Lifted':
          next.nonDiscretionary.debtsStayLifted = round2((next.nonDiscretionary.debtsStayLifted || 0) + amt);
          break;
        case 'Rent/Mortgage':
          next.discretionary.housing.rentOrMortgage = round2((next.discretionary.housing.rentOrMortgage || 0) + amt);
          break;
        case 'Property Taxes & Condo Fees':
          next.discretionary.housing.propertyTaxesCondo = round2((next.discretionary.housing.propertyTaxesCondo || 0) + amt);
          break;
        case 'Heating/Gas/Oil':
          next.discretionary.housing.heatingGasOil = round2((next.discretionary.housing.heatingGasOil || 0) + amt);
          break;
        case 'Telephone':
          next.discretionary.housing.telephone = round2((next.discretionary.housing.telephone || 0) + amt);
          break;
        case 'Cable':
          next.discretionary.housing.cable = round2((next.discretionary.housing.cable || 0) + amt);
          break;
        case 'Hydro':
          next.discretionary.housing.hydro = round2((next.discretionary.housing.hydro || 0) + amt);
          break;
        case 'Water':
          next.discretionary.housing.water = round2((next.discretionary.housing.water || 0) + amt);
          break;
        case 'Furniture':
          next.discretionary.housing.furniture = round2((next.discretionary.housing.furniture || 0) + amt);
          break;
        case 'Other Housing':
          next.discretionary.housing.other = round2((next.discretionary.housing.other || 0) + amt);
          break;
        case 'Smoking & Tobacco':
          next.discretionary.personal.smoking = round2((next.discretionary.personal.smoking || 0) + amt);
          break;
        case 'Alcohol & Beverages':
          next.discretionary.personal.alcohol = round2((next.discretionary.personal.alcohol || 0) + amt);
          break;
        case 'Dining/Lunches/Restaurants':
          next.discretionary.personal.diningOut = round2((next.discretionary.personal.diningOut || 0) + amt);
          break;
        case 'Clothing & Apparel':
          next.discretionary.personal.clothing = round2((next.discretionary.personal.clothing || 0) + amt);
          break;
        case 'Grooming & Personal Care':
          next.discretionary.personal.grooming = round2((next.discretionary.personal.grooming || 0) + amt);
          break;
        case 'Hobbies & Recreation':
          next.discretionary.personal.hobbies = round2((next.discretionary.personal.hobbies || 0) + amt);
          break;
        case 'Other Personal':
          next.discretionary.personal.other = round2((next.discretionary.personal.other || 0) + amt);
          break;
        case 'Prescriptions':
          next.discretionary.medical.prescriptions = round2((next.discretionary.medical.prescriptions || 0) + amt);
          break;
        case 'Dental':
          next.discretionary.medical.dental = round2((next.discretionary.medical.dental || 0) + amt);
          break;
        case 'Food/Grocery':
          next.discretionary.dayToDay.foodGrocery = round2((next.discretionary.dayToDay.foodGrocery || 0) + amt);
          break;
        case 'Laundry & Dry Cleaning':
          next.discretionary.dayToDay.laundryDryCleaning = round2((next.discretionary.dayToDay.laundryDryCleaning || 0) + amt);
          break;
        case 'Grooming & Toiletries':
          next.discretionary.dayToDay.groomingToiletries = round2((next.discretionary.dayToDay.groomingToiletries || 0) + amt);
          break;
        case 'Clothing':
          next.discretionary.dayToDay.clothing = round2((next.discretionary.dayToDay.clothing || 0) + amt);
          break;
        case 'Repair/Maintenance/Gas':
          next.discretionary.transportation.repairMaintenanceGas = round2((next.discretionary.transportation.repairMaintenanceGas || 0) + amt);
          break;
        case 'Public Transportation':
          next.discretionary.transportation.publicTransportation = round2((next.discretionary.transportation.publicTransportation || 0) + amt);
          break;
        case 'Vehicle':
          next.discretionary.insurance.vehicle = round2((next.discretionary.insurance.vehicle || 0) + amt);
          break;
        case 'House Insurance':
          next.discretionary.insurance.house = round2((next.discretionary.insurance.house || 0) + amt);
          break;
        case 'Furniture & Contents Insurance':
          next.discretionary.insurance.furnitureContents = round2((next.discretionary.insurance.furnitureContents || 0) + amt);
          break;
        case 'Life Insurance':
          next.discretionary.insurance.lifeInsurance = round2((next.discretionary.insurance.lifeInsurance || 0) + amt);
          break;
        case 'To The Estate':
          next.discretionary.payments.toEstate = round2((next.discretionary.payments.toEstate || 0) + amt);
          break;
        case 'To Secured Creditor':
          next.discretionary.payments.toSecuredCreditor = round2((next.discretionary.payments.toSecuredCreditor || 0) + amt);
          break;
        case 'Other Payments':
          next.discretionary.payments.other = round2((next.discretionary.payments.other || 0) + amt);
          break;
        default:
          next.discretionary.dayToDay.other = round2((next.discretionary.dayToDay.other || 0) + amt);
          break;
      }
    }

    return next;
  };

  const handleSelectStatementFile = (file: File | null | undefined) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isSupported =
      ['pdf', 'csv', 'ofx', 'qfx'].includes(ext) || file.type.startsWith('image/') || file.type === 'application/pdf' || file.type === 'text/csv';

    if (!isSupported) {
      setStatementError('Unsupported file format. Please select a PDF bank statement (or statement image).');
      setSelectedStatementFile(null);
      return;
    }

    setStatementError(null);
    setSelectedStatementFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleSelectStatementFile(file);
    e.target.value = '';
  };

  const handleCloseStatementModal = () => {
    if (isUploadingStatement) return;
    setIsStatementModalOpen(false);
    setStatementError(null);
    setIsDraggingStatement(false);
  };

  // Automated Bank Statement Processing & Interactive Reconciliation Flow
  const handleProcessBankStatement = async (fileOverride?: File) => {
    const file = fileOverride || selectedStatementFile;
    if (!file) {
      fileInputRef.current?.click();
      return;
    }

    setStatementError(null);
    setIsUploadingStatement(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const userId = profile.uid || 'demo-user-chad-001';
      let parsedTransactions: Array<Omit<Transaction, 'id'>> = [];

      if (ext === 'csv' || file.type === 'text/csv') {
        const text = await file.text();
        const parsed = parseCsvStatement(text, userId);
        parsedTransactions = parsed.transactions;
        if (parsedTransactions.length === 0) {
          throw new Error(parsed.warnings[0] || 'No valid transactions were found in this CSV statement.');
        }
      } else if (ext === 'ofx' || ext === 'qfx') {
        const text = await file.text();
        const parsed = parseOfxStatement(text, ext as 'ofx' | 'qfx', userId);
        parsedTransactions = parsed.transactions;
        if (parsedTransactions.length === 0) {
          throw new Error(parsed.warnings[0] || `No transactions were found in this ${ext.toUpperCase()} file.`);
        }
      } else if (ext === 'pdf' || file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Could not read the selected file.'));
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/bank/parse-statement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            mimeType: file.type || 'application/pdf',
            userId
          })
        });

        if (!res.ok) {
          const errPayload = await res.json().catch(() => null);
          if (res.status === 404) {
            throw new Error(
              'AI PDF statement parsing requires the CleanSlate backend server (/api/bank/parse-statement is not available on static hosting).'
            );
          }
          throw new Error(
            errPayload?.error ||
              `AI PDF statement parsing failed (HTTP ${res.status}). Please verify GEMINI_API_KEY in Settings > Secrets and try again.`
          );
        }

        const data = await res.json();
        if (!data.success || !Array.isArray(data.transactions) || data.transactions.length === 0) {
          throw new Error(
            data.error || 'Could not extract transactions from this PDF statement. Please ensure it is a readable bank or credit card PDF.'
          );
        }
        parsedTransactions = data.transactions;
      } else {
        throw new Error('Unsupported file format. Please choose a PDF bank statement or image file.');
      }

      const updatedReport = applyParsedTransactionsToReport(activeReport, parsedTransactions);
      onUpdateReport(updatedReport);
      setIsStatementModalOpen(false);
      setSelectedStatementFile(null);

      setStatementSuccessToast(
        `Statement "${file.name}" (${parsedTransactions.length} transactions) auto-categorized into ${activeReport.month} Form 65!`
      );
      setTimeout(() => setStatementSuccessToast(null), 5000);

      const uncategorizedCount = parsedTransactions.filter((t) => !t.isCategorized).length;
      const summaryMsg: ChatMessage = {
        id: `stmt-summary-${Date.now()}`,
        sender: 'bot',
        text: `I processed **${file.name}** and extracted **${parsedTransactions.length} transactions** into your ${activeReport.month} ${activeReport.year} Form 65 report.${
          uncategorizedCount > 0
            ? ` ${uncategorizedCount} item(s) were placed in Day-to-Day Other for review — check your line items or ask me where any transaction belongs.`
            : ' Every line item was mapped to its corresponding statutory Form 65 category!'
        }`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, summaryMsg]);
    } catch (err: any) {
      setStatementError(err?.message || 'Unable to process the selected statement file.');
    } finally {
      setIsUploadingStatement(false);
    }
  };

  const handleResolveClarification = (msgId: string, choiceLabel: string, resultSummary: string) => {
    setMessages(prev => prev.map(m => {
      if (m.clarificationData?.id === msgId) {
        return {
          ...m,
          clarificationData: {
            ...m.clarificationData,
            resolved: true,
            resolvedMessage: `✓ Resolved: ${choiceLabel} — ${resultSummary}`
          }
        };
      }
      return m;
    }));
  };

  return (
    <div className="bg-[#1d1a27] text-white rounded-3xl p-6 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-4">
      {/* Clean, Uncrowded Widget Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#b6b3ff] border border-[#101010] text-[#1d1a27] flex items-center justify-center font-bold shrink-0">
            <MagicWandIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                LITbot AI Assistant
              </h3>
              <span className="status-tag-compact bg-[#46e3a5] text-[#102a1f] font-bold border border-[#101010]/20">
                Live trustee guide
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Form 65 statutory guidance & assistant
            </p>
          </div>
        </div>
      </div>

      {/* Statement Success Toast */}
      {statementSuccessToast && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{statementSuccessToast}</span>
        </div>
      )}

      {/* Suggested Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 text-xs no-scrollbar">
        <CleanSlateButton
          variant="yellow"
          size="xs"
          leftIcon={UploadIcon}
          onClick={() => setIsStatementModalOpen(true)}
          className="shrink-0"
        >
          Upload Statement (Jan 1-30)
        </CleanSlateButton>
        <CleanSlateButton
          variant="dark-periwinkle"
          size="xs"
          onClick={() => handleSendMessage("You spent $50 at Instacart - was this for Dining or Groceries?")}
          className="shrink-0"
        >
          Instacart: Groceries vs. Dining?
        </CleanSlateButton>
        <CleanSlateButton
          variant="dark-periwinkle"
          size="xs"
          onClick={() => handleSendMessage("This $20 transaction at Rexall needs a prescription receipt attached")}
          className="shrink-0"
        >
          Rexall $20 Prescription Proof
        </CleanSlateButton>
      </div>

      {/* Chat Messages Body */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1.5 ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="text-[10px] text-slate-400 font-mono px-1">
              {msg.sender === 'user' ? 'You' : 'LITbot (Virtual Trustee)'} · {msg.time}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-xl ${
                msg.sender === 'user'
                  ? 'bg-[#b6b3ff] text-[#1d1a27] font-semibold rounded-tr-xs'
                  : 'bg-white/10 text-slate-100 border border-white/10 rounded-tl-xs space-y-1.5'
              }`}
            >
              {msg.sender === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                renderAssistantText(msg.text)
              )}

              {/* Interactive Clarification Card inside Chat */}
              {msg.clarificationData && (
                <div className="mt-2 pt-2 border-t border-white/15 space-y-2">
                  {msg.clarificationData.resolved ? (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5">
                      <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{msg.clarificationData.resolvedMessage}</span>
                    </div>
                  ) : (
                    <div className="bg-[#2e293f] p-3 rounded-xl border border-white/20 space-y-2">
                      <div className="font-bold text-[#fbf050] flex items-center justify-between">
                        <span>{msg.clarificationData.merchant}</span>
                        <span>{formatCurrency(msg.clarificationData.amount)}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        {msg.clarificationData.type === 'choice'
                          ? `You spent ${formatCurrency(msg.clarificationData.amount)} at ${msg.clarificationData.merchant} — was this for Dining or Groceries?`
                          : `This ${formatCurrency(msg.clarificationData.amount)} transaction at ${msg.clarificationData.merchant} needs a prescription receipt attached for trustee deduction.`}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.clarificationData.options?.map((opt, idx) => (
                          <CleanSlateButton
                            key={idx}
                            variant="periwinkle"
                            size="xs"
                            onClick={opt.action}
                          >
                            {opt.label}
                          </CleanSlateButton>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isUploadingStatement && (
          <div className="flex items-center gap-2 text-xs text-[#b6b3ff] bg-white/5 p-3 rounded-xl border border-white/10 animate-pulse">
            <SparklesIcon className="w-4 h-4 animate-spin" />
            <span>Scanning bank statement (Jan 1 - Jan 30) and populating Form 65 inputs...</span>
          </div>
        )}
        {isSendingQuery && (
          <div className="flex items-center gap-2 text-xs text-[#b6b3ff] bg-white/5 p-3 rounded-xl border border-white/10 animate-pulse">
            <SparklesIcon className="w-4 h-4 animate-spin" />
            <span>LITbot is checking Form 65 rules to give you a clear answer...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isSendingQuery}
          placeholder="Ask anything in plain English (e.g. 'Why are categories repeated?' or 'Transfers?')"
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b6b3ff] disabled:opacity-60"
        />
        <CleanSlateButton
          variant="periwinkle"
          size="icon"
          onClick={() => handleSendMessage()}
          disabled={isSendingQuery || !inputQuery.trim()}
          title="Send query to LITbot"
          aria-label="Send query to LITbot"
        >
          <SendIcon className="w-4 h-4" />
        </CleanSlateButton>
      </div>

      {/* Modal: Bank Statement Import for Jan 1 - Jan 30 — unified white neo-brutalist design + #b6c0fb dropzone */}
      {isStatementModalOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={handleCloseStatementModal}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[6px_8px_0px_#000000] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,image/*,.csv,.ofx,.qfx"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="flex items-center justify-between pb-3 border-b border-[#b4b1fc]/35">
              <div className="flex items-center gap-2">
                <ClipboardIcon className="w-5 h-5 text-[#8c93fc]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                  Upload Statement (Jan 1 – Jan 30)
                </h3>
              </div>
              <CleanSlateButton
                variant="white"
                size="icon"
                onClick={handleCloseStatementModal}
                disabled={isUploadingStatement}
                aria-label="Close upload statement modal"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </CleanSlateButton>
            </div>

            <p className="text-xs text-[#4b4856] leading-relaxed">
              Upload your bank or credit card statement for the period of <strong className="text-[#101010]">Jan 1 to Jan 30</strong>. CleanSlate will automatically parse transactions, populate your Form 65 line items, and guide you through quick clarifications with LITbot.
            </p>

            {/* Periwinkle Dropzone matching ReceiptsView */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => !isUploadingStatement && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isUploadingStatement) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingStatement(true);
              }}
              onDragLeave={() => setIsDraggingStatement(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingStatement(false);
                if (!isUploadingStatement) {
                  handleSelectStatementFile(e.dataTransfer.files?.[0]);
                }
              }}
              className={`rounded-2xl bg-[#b6c0fb] p-3 transition cursor-pointer ${
                isDraggingStatement ? 'ring-2 ring-[#101010] brightness-95' : 'hover:brightness-[0.98]'
              }`}
            >
              <div className="border border-dashed border-[#242031]/55 rounded-xl p-6 text-center space-y-2">
                <UploadIcon className={`w-7 h-7 text-[#1d1a27] mx-auto ${isUploadingStatement ? 'animate-bounce' : ''}`} />
                <div className="text-xs font-extrabold text-[#101010] break-all">
                  {isUploadingStatement
                    ? `AI is reading ${selectedStatementFile?.name || 'your PDF'}...`
                    : selectedStatementFile
                      ? `Selected: ${selectedStatementFile.name} (Click to replace)`
                      : 'Click to browse or drop your PDF bank statement'}
                </div>
                <div className="text-[11px] text-[#242031]/80 font-medium">
                  {selectedStatementFile
                    ? `${Math.max(1, Math.round(selectedStatementFile.size / 1024))} KB · Ready for AI auto-categorization into ${activeReport.month} Form 65`
                    : 'AI extracts & auto-categorizes transactions from PDF statements (Jan 1 – Jan 30)'}
                </div>
              </div>
            </div>

            {statementError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">
                {statementError}
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <CleanSlateButton
                variant="yellow"
                size="md"
                fullWidth
                leftIcon={selectedStatementFile ? SparklesIcon : UploadIcon}
                disabled={isUploadingStatement}
                onClick={() => handleProcessBankStatement()}
              >
                {isUploadingStatement
                  ? 'Parsing & Categorizing Statement...'
                  : selectedStatementFile
                    ? 'Import & Auto-Categorize Statement'
                    : 'Choose Statement File...'}
              </CleanSlateButton>
              <CleanSlateButton
                variant="white"
                size="md"
                fullWidth
                leftIcon={CancelIcon}
                disabled={isUploadingStatement}
                onClick={handleCloseStatementModal}
              >
                Cancel
              </CleanSlateButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
