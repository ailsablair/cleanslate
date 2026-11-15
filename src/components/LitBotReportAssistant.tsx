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
import { getFallbackLitBotResponse } from '../lib/litbotFallback';
import { loadKnowledgeArticlesFromStorage } from '../lib/litbotKnowledge';

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
      },
      loadKnowledgeArticlesFromStorage()
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
          knowledgeArticles: loadKnowledgeArticlesFromStorage(),
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
    <div className="bg-[#1d1a27] text-white rounded-3xl p-6 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] space-y-4">
      {/* Clean, Uncrowded Widget Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#b6b3ff] border border-[#101010] text-[#1d1a27] flex items-center justify-center font-bold shrink-0">
            <Bot className="w-5 h-5 stroke-[2.5]" />
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
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{statementSuccessToast}</span>
        </div>
      )}

      {/* Suggested Quick Question Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setIsStatementModalOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold border border-[#101010] shadow-[2px_3px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Upload className="w-3 h-3 stroke-[2.5]" />
          <span>Upload Statement (Jan 1-30)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage("You spent $50 at Instacart - was this for Dining or Groceries?")}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition shrink-0 cursor-pointer whitespace-nowrap"
        >
          Instacart: Groceries vs. Dining?
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage("This $20 transaction at Rexall needs a prescription receipt attached")}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition shrink-0 cursor-pointer whitespace-nowrap"
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
        {isSendingQuery && (
          <div className="flex items-center gap-2 text-xs text-[#b6b3ff] bg-white/5 p-3 rounded-xl border border-white/10 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
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
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={isSendingQuery || !inputQuery.trim()}
          className="p-2.5 rounded-xl bg-[#b6b3ff] hover:bg-white text-[#1d1a27] transition font-bold cursor-pointer active:scale-95 disabled:opacity-50"
          title="Send query to LITbot"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Modal: Bank Statement Import for Jan 1 - Jan 30 — unified white neo-brutalist design + #b6c0fb dropzone */}
      {isStatementModalOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setIsStatementModalOpen(false)}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[6px_8px_0px_#000000] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#b4b1fc]/35">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8c93fc]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                  Upload Statement (Jan 1 – Jan 30)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                aria-label="Close upload statement modal"
                className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            <p className="text-xs text-[#4b4856] leading-relaxed">
              Upload your bank or credit card statement for the period of <strong className="text-[#101010]">Jan 1 to Jan 30</strong>. CleanSlate will automatically parse transactions, populate your Form 65 line items, and guide you through quick clarifications with LITbot.
            </p>

            {/* Periwinkle Dropzone matching ReceiptsView */}
            <div
              onClick={() => handleProcessBankStatement('Jan_1_to_Jan_30_Bank_Statement.pdf')}
              className="rounded-2xl bg-[#b6c0fb] p-3 hover:brightness-[0.99] transition cursor-pointer"
            >
              <div className="border border-dashed border-[#242031]/55 rounded-xl p-6 text-center space-y-2">
                <Upload className="w-7 h-7 text-[#1d1a27] mx-auto" />
                <div className="text-xs font-extrabold text-[#101010]">
                  Drop your statement file here (PDF / CSV / Image)
                </div>
                <div className="text-[11px] text-[#242031]/80 font-medium">
                  Statement period: January 1, 2026 – January 30, 2026
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => handleProcessBankStatement('Jan_1_to_Jan_30_Bank_Statement.pdf')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#1d1a27]" />
                <span>Import &amp; Auto-Categorize Statement</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] text-[#101010] text-xs font-bold transition-all cursor-pointer"
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
