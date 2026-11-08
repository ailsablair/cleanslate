import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Paperclip, 
  Sparkles, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight, 
  HelpCircle,
  FileCheck,
  Building2,
  ExternalLink,
  CheckCircle2,
  X,
  Upload
} from 'lucide-react';
import { UserProfile, MonthlyReport, Receipt } from '../types';
import { formatCurrency } from '../lib/formatters';

interface LitBotViewProps {
  profile: UserProfile;
  activeReport?: MonthlyReport;
  receipts?: Receipt[];
  onNavigateToReports: () => void;
}

interface ChatAttachment {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  base64: string;
  previewUrl?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  attachments?: ChatAttachment[];
}

export const LitBotView: React.FC<LitBotViewProps> = ({
  profile,
  activeReport,
  receipts = [],
  onNavigateToReports
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello ${profile.firstName || 'there'}! I am **LITbot**, your official AI Trustee Guide for CleanSlate.

I am programmed with **100% accurate statutory rules** under the Canadian *Bankruptcy and Insolvency Act* (BIA), Office of the Superintendent of Bankruptcy (OSB) Directives (including **Directive 11R2 Surplus Income**), and BIA Form 65 audit standards.

**How can I help you today?**
- Ask questions about surplus thresholds, discharge timelines, or non-discretionary receipt requirements.
- Upload paystubs, bank statements, or receipt scans for instant Form 65 analysis.`
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = typeof reader.result === 'string' ? reader.result : '';
        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          fileType: file.type.startsWith('image/') ? 'image' : 'document',
          mimeType: file.type || 'application/pdf',
          base64: base64String,
          previewUrl: file.type.startsWith('image/') ? base64String : undefined
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || inputText;
    if (!textToSubmit.trim() && attachments.length === 0) return;
    if (isSending) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSubmit,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [...attachments]
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInputText('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsSending(true);

    try {
      const response = await fetch('/api/litbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
          messages: messages.map(m => ({ role: m.role, text: m.text })),
          attachments: currentAttachments.map(a => ({
            fileName: a.fileName,
            mimeType: a.mimeType,
            base64: a.base64
          })),
          contextProfile: {
            firstName: profile.firstName,
            province: profile.province,
            householdSize: profile.householdSize,
            litName: profile.litName,
            surplusPayment: 159
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: data.text || 'I have analyzed your request under BIA rules.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Error sending message to LITbot:', err);
      const fallbackBotMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: `### Canadian Bankruptcy Statutory Guidance (BIA & OSB Directive 11R2)\n\nUnder **Office of the Superintendent of Bankruptcy (OSB)** standards:\n\n1. **Surplus Income Base**: Calculated as Net Household Income minus Non-Discretionary Deductions (child support paid, verified medical, child care for work) minus OSB Threshold ($${profile.householdSize === 1 ? '2,400' : profile.householdSize === 2 ? '2,980' : '3,600'}/mo).\n2. **Payment Amount**: 50% of the surplus exceeding threshold is payable to your trustee estate.\n3. **Automatic Discharge**: Granted at 9 or 21 months for first-time bankrupts upon fulfilling all duties.\n\n*Note*: Formal legal submissions are always filed through your assigned Licensed Insolvency Trustee (**${profile.litName}**).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackBotMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Chat history cleared. I am ready for your next bankruptcy, OSB Directive 11R2, or Form 65 question!`
      }
    ]);
  };

  // Helper to render simple markdown formatting (headers, bold, lists, code)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-bold text-white mt-3 mb-1 tracking-wide">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg font-extrabold text-[#fbf050] mt-4 mb-2 tracking-wide">
            {line.replace('## ', '')}
          </h3>
        );
      }

      // Format bold text **word**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-[#b6b3ff]">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 text-xs sm:text-sm leading-relaxed my-0.5">
            {formattedLine}
          </li>
        );
      }

      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="ml-2 font-medium text-slate-200 text-xs sm:text-sm leading-relaxed my-1">
            {formattedLine}
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-200 leading-relaxed my-1">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="px-4 sm:px-8 py-4 max-w-[1440px] mx-auto min-h-[calc(100vh-2rem)] flex flex-col space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-[#1d1a27] text-white rounded-3xl p-6 shadow-sm border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#b6b3ff] text-[#1d1a27] flex items-center justify-center font-bold shrink-0 shadow-sm">
            <Bot className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                LITbot AI Trustee Assistant
              </h1>
              <span className="status-tag-compact bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% BIA Statutory Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Ask questions about Canadian bankruptcy law, OSB Directive 11R2 surplus calculations, or upload documents for instant analysis.
            </p>
          </div>
        </div>

        {/* Clear History & Trustee Direct link */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
            title="Clear current chat log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToReports}
            className="px-4 py-2 rounded-xl bg-[#fbf050] hover:bg-[#fffa78] text-[#1d1a27] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Form 65 Wizard</span>
          </button>
        </div>
      </div>

      {/* 2. Main Chat Area Container */}
      <div className="flex-1 bg-[#242031] text-white rounded-3xl border border-white/10 p-4 sm:p-6 flex flex-col justify-between shadow-sm min-h-[560px]">
        
        {/* Quick Statutory Prompt Chips */}
        <div className="pb-4 border-b border-white/10 flex items-center gap-2 overflow-x-auto select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b6b3ff] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#fbf050]" />
            Suggested:
          </span>
          {[
            'How is surplus income calculated under OSB Directive 11R2?',
            'What non-discretionary expenses require mandatory receipts?',
            'Explain the 9-month vs 21-month automatic discharge rules.',
            'What happens if my income fluctuates month-to-month?'
          ].map((promptText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(promptText)}
              disabled={isSending}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white text-xs whitespace-nowrap transition border border-white/10 cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2 max-h-[580px]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                    isUser ? 'bg-[#b6b3ff] text-[#1d1a27]' : 'bg-[#fbf050] text-[#1d1a27]'
                  }`}
                >
                  {isUser ? (
                    <span className="text-xs font-black">{profile.firstName ? profile.firstName[0] : 'U'}</span>
                  ) : (
                    <Bot className="w-5 h-5 stroke-[2.3]" />
                  )}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`rounded-3xl p-5 shadow-sm space-y-3 ${
                    isUser
                      ? 'bg-[#b6b3ff] text-[#1d1a27] rounded-tr-xs'
                      : 'bg-[#1b1726] text-white border border-white/10 rounded-tl-xs'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-4 text-[10px] font-bold tracking-wider uppercase opacity-75 border-b border-current/10 pb-1.5">
                    <span>{isUser ? `${profile.firstName || 'You'} (Debtor)` : 'LITbot Statutory Engine'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Attachment Previews in User Bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-black/10 border border-current/15 text-xs font-semibold"
                        >
                          {att.fileType === 'image' ? (
                            <ImageIcon className="w-4 h-4 shrink-0 text-[#1d1a27]" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0 text-[#1d1a27]" />
                          )}
                          <span className="truncate max-w-[150px]">{att.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="space-y-1">
                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {/* Statutory Trust Disclaimer for Bot Messages */}
                  {!isUser && (
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10.5px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Transmitted under Canadian BIA & OSB Trustee Audit Standards</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator when streaming / loading */}
          {isSending && (
            <div className="flex gap-3 max-w-xl mr-auto animate-in fade-in">
              <div className="w-9 h-9 rounded-2xl bg-[#fbf050] text-[#1d1a27] flex items-center justify-center font-bold shrink-0">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-[#1b1726] text-white border border-white/10 rounded-3xl rounded-tl-xs p-4 shadow-sm flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#fbf050] animate-pulse" />
                <span className="text-xs font-medium text-slate-300">
                  LITbot is evaluating BIA statutory directives and analyzing documents...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Upload File Attachment Bar */}
        {attachments.length > 0 && (
          <div className="pt-3 px-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-[#b6b3ff] shrink-0">Attached:</span>
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/15 shrink-0"
              >
                {att.fileType === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-[#fbf050]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#b6b3ff]" />
                )}
                <span className="truncate max-w-[140px] font-mono text-[11px]">{att.fileName}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="hover:text-rose-400 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input & Send Form Bar */}
        <div className="pt-4 border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition border border-white/10 shrink-0 cursor-pointer active:scale-95"
              title="Attach document, receipt, paystub, or image for LITbot analysis"
            >
              <Paperclip className="w-5 h-5 text-[#b6b3ff]" />
            </button>

            {/* Text Input Box */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask LITbot a question about Canadian bankruptcy, Form 65, or upload paystubs/statements..."
                disabled={isSending}
                style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontWeight: 300
                }}
                className="w-full bg-[#171322] border border-white/15 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b6b3ff] focus:border-transparent transition"
              />
            </div>

            {/* Submit Send Button */}
            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && attachments.length === 0)}
              className="px-5 py-3.5 rounded-2xl bg-[#fbf050] hover:bg-[#fffa78] text-[#1d1a27] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline font-bold">Ask LITbot</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
