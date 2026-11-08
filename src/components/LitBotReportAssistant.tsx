import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  X, 
  ChevronRight, 
  Paperclip,
  Flame,
  Award,
  ArrowRight
} from 'lucide-react';
import { MonthlyReport, UserProfile, Receipt } from '../types';
import { formatCurrency } from '../lib/formatters';

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

  // Statutory answers database for instant help
  const getBotResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('rx') || q.includes('pharmacy') || q.includes('rexall') || q.includes('medical') || q.includes('prescription')) {
      return "Prescription medicines and physician-authorized medical devices belong under Non-Discretionary Deductions (or Medical Expenses). Remember: statutory rules require attaching a prescription receipt or clinic invoice for trustee deduction approval!";
    }
    if (q.includes('instacart') || q.includes('grocery') || q.includes('dining') || q.includes('food')) {
      return "Supermarket food and pantry groceries go under 'Day-to-Day: Food & Grocery'. Prepared meals or restaurant delivery belong under 'Personal: Alcohol / Dining Out'. Keeping them separate ensures your surplus income basis is calculated fairly.";
    }
    if (q.includes('overtime') || q.includes('bonus') || q.includes('salary') || q.includes('pay')) {
      return "All net wages after mandatory tax, CPP, and EI deductions must be reported under 'Debtor Employment Income'. Overtime shifts are included in net monthly earnings.";
    }
    if (q.includes('childcare') || q.includes('daycare')) {
      return "Verified child care expenses required for you to maintain employment are eligible as Non-Discretionary Deductions. Be sure to upload daycare receipts to your CleanSlate Vault!";
    }
    if (q.includes('surplus') || q.includes('threshold') || q.includes('limit')) {
      return `Under OSB standards for a household size of ${profile.householdSize}, your threshold is ${profile.householdSize === 1 ? '$2,400.00' : profile.householdSize === 2 ? '$2,980.00' : '$3,600.00'}. Half of any net income above this threshold is remitted to your bankruptcy estate.`;
    }
    return "I'm trained on Canadian Bankruptcy and Insolvency Act (BIA) Form 65 rules. You can enter any expense in the respective input, or upload your bank statement for auto-categorization!";
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const botResponse = getBotResponse(text);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: botResponse,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    if (!textToSend) setInputQuery('');
  };

  // Automated Bank Statement Processing & Interactive Reconciliation Flow
  const handleProcessBankStatement = (statementName: string = 'Bank_Statement_Jan1_Jan30.pdf') => {
    setIsUploadingStatement(true);
    setIsStatementModalOpen(false);

    setTimeout(() => {
      // 1. Auto-populate Form 65 line items in the active report
      const updatedReport: MonthlyReport = {
        ...activeReport,
        lastEditDate: `Edited on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        discretionary: {
          ...activeReport.discretionary,
          dayToDay: {
            ...activeReport.discretionary.dayToDay,
            foodGrocery: (activeReport.discretionary.dayToDay.foodGrocery || 0) + 430.00,
          },
          transportation: {
            ...activeReport.discretionary.transportation,
            repairMaintenanceGas: (activeReport.discretionary.transportation.repairMaintenanceGas || 0) + 145.00,
          },
          personal: {
            ...activeReport.discretionary.personal,
            alcohol: (activeReport.discretionary.personal.alcohol || 0) + 50.00
          }
        },
        nonDiscretionary: {
          ...activeReport.nonDiscretionary,
          medicalConditionExpenses: (activeReport.nonDiscretionary.medicalConditionExpenses || 0) + 20.00
        }
      };

      onUpdateReport(updatedReport);
      setIsUploadingStatement(false);

      setStatementSuccessToast(`Statement "${statementName}" (Jan 1 - Jan 30) auto-categorized into ${activeReport.month} Form 65!`);
      setTimeout(() => setStatementSuccessToast(null), 5000);

      // 2. Insert Interactive Clarification & Encouragement Messages into LITbot
      const clarificationMsg1: ChatMessage = {
        id: `clarify-1-${Date.now()}`,
        sender: 'bot',
        text: `I've analyzed your statement for Jan 1 to Jan 30! Most items were mapped automatically. I have a quick clarification for you:`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clarificationData: {
          id: 'clarify-instacart',
          type: 'choice',
          merchant: 'Instacart',
          amount: 50.00,
          options: [
            {
              label: 'Groceries ($50.00)',
              action: () => handleResolveClarification('clarify-instacart', 'Groceries', 'Categorized $50.00 Instacart transaction as Day-to-Day Groceries.')
            },
            {
              label: 'Dining Out ($50.00)',
              action: () => handleResolveClarification('clarify-instacart', 'Dining Out', 'Categorized $50.00 Instacart transaction as Personal Dining Out.')
            }
          ]
        }
      };

      const clarificationMsg2: ChatMessage = {
        id: `clarify-2-${Date.now()}`,
        sender: 'bot',
        text: `Here's one more compliance check to protect your statutory deductions:`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clarificationData: {
          id: 'clarify-rexall',
          type: 'proof',
          merchant: 'Rexall Pharmacy',
          amount: 20.00,
          options: [
            {
              label: 'Attach Prescription Receipt',
              action: () => {
                if (onAttachReceiptToCategory) {
                  onAttachReceiptToCategory('medicalConditionExpenses', receipts[0]?.id || 'mock-rec-1');
                }
                handleResolveClarification('clarify-rexall', 'Prescription Attached', 'Prescription receipt tightly linked to Rexall $20.00 transaction for trustee audit!');
              }
            },
            {
              label: 'General Non-Prescription',
              action: () => handleResolveClarification('clarify-rexall', 'General', 'Logged as general personal expense.')
            }
          ]
        }
      };

      const motivationalMsg: ChatMessage = {
        id: `motive-${Date.now()}`,
        sender: 'bot',
        text: `🔥 Awesome work! You've auto-mapped 14 statement transactions and saved 45 minutes of manual filing. Your ${activeReport.month} Form 65 is 100% audit-ready for your Licensed Insolvency Trustee, Sarah Jenkins, LIT. Keep crushing your monthly reports — you are 1 step closer to your absolute discharge certificate!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, clarificationMsg1, clarificationMsg2, motivationalMsg]);
    }, 1200);
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
    <div className="bg-[#1d1a27] text-white rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
      {/* Clean, Uncrowded Widget Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#b6b3ff] text-[#1d1a27] flex items-center justify-center font-bold shadow-sm shrink-0">
            <Bot className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                LITbot AI Assistant
              </h3>
              <span className="status-tag-compact bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{statementSuccessToast}</span>
        </div>
      )}

      {/* Suggested Quick Question Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setIsStatementModalOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[#fbf050] hover:bg-[#fffa78] text-[#1d1a27] font-bold transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
        >
          <Upload className="w-3 h-3 stroke-[2.5]" />
          <span>Upload Statement (Jan 1-30)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage("You spent $50 at Instacart - was this for Dining or Groceries?")}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition shrink-0 cursor-pointer"
        >
          Instacart: Groceries vs. Dining?
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage("This $20 transaction at Rexall needs a prescription receipt attached")}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition shrink-0 cursor-pointer"
        >
          Rexall $20 Prescription Proof
        </button>
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
                  : 'bg-white/10 text-slate-100 border border-white/10 rounded-tl-xs space-y-2'
              }`}
            >
              <p>{msg.text}</p>

              {/* Interactive Clarification Card inside Chat */}
              {msg.clarificationData && (
                <div className="mt-2 pt-2 border-t border-white/15 space-y-2">
                  {msg.clarificationData.resolved ? (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                          <button
                            key={idx}
                            type="button"
                            onClick={opt.action}
                            className="px-3 py-1.5 rounded-lg bg-[#b6b3ff] hover:bg-white text-[#1d1a27] font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs"
                          >
                            {opt.label}
                          </button>
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
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Scanning bank statement (Jan 1 - Jan 30) and populating Form 65 inputs...</span>
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
          placeholder="Ask LITbot: e.g. 'You spent $50 at Instacart - was this Dining or Groceries?'"
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          className="p-2.5 rounded-xl bg-[#b6b3ff] hover:bg-white text-[#1d1a27] transition font-bold cursor-pointer active:scale-95"
          title="Send query to LITbot"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Modal: Bank Statement Import for Jan 1 - Jan 30 */}
      {isStatementModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsStatementModalOpen(false)}
        >
          <div
            className="bg-[#2e293f] text-white border border-white/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#b6b3ff]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Upload Statement (Jan 1 – Jan 30)
                </h3>
              </div>
              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload your bank or credit card statement for the period of <strong>Jan 1 to Jan 30</strong>. Cleanslate will automatically parse transactions, populate your Form 65 line items, and guide you through quick clarifications with LITbot.
            </p>

            {/* Dropzone mockup */}
            <div 
              onClick={() => handleProcessBankStatement('Jan_1_to_Jan_30_Bank_Statement.pdf')}
              className="border-2 border-dashed border-white/20 hover:border-[#b6b3ff] rounded-2xl p-6 text-center space-y-2 bg-white/5 transition cursor-pointer"
            >
              <Upload className="w-8 h-8 text-[#b6b3ff] mx-auto" />
              <div className="text-xs font-bold text-white">
                Drop your statement file here (PDF / CSV / Image)
              </div>
              <div className="text-[11px] text-slate-400">
                Statement period: January 1, 2026 – January 30, 2026
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleProcessBankStatement('Jan_1_to_Jan_30_Bank_Statement.pdf')}
                className="w-full py-3 rounded-xl bg-[#fbf050] hover:bg-[#fffa78] text-[#1d1a27] font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-[#1d1a27]" />
                <span>Import & Auto-Categorize Statement</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
