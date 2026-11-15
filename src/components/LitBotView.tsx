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
  FileCheck,
  X
} from 'lucide-react';
import { UserProfile, MonthlyReport, Receipt } from '../types';
import { getFallbackLitBotResponse } from '../lib/litbotFallback';

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
  onNavigateToReports
}) => {
  const [chatSessionId, setChatSessionId] = useState<string>(() => `litbot-main-${Date.now()}`);
  const [agentIceBreakers, setAgentIceBreakers] = useState<string[]>([
    'Which categories are not counted towards my bankruptcy payment calculation?',
    'What is the difference between Employment Insurance Benefits vs. Social Assistance?',
    'Do I include a breakdown for each bank account or total each category across all accounts?',
    'How do I count cash gifts from family and friends for the holidays and my birthday?'
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/litbot/agent-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((cfg) => {
        if (cancelled || !cfg) return;
        if (Array.isArray(cfg.iceBreakers) && cfg.iceBreakers.length > 0) {
          const combined = [
            ...cfg.iceBreakers,
            'How do I count cash gifts from family and friends for the holidays and my birthday?'
          ];
          setAgentIceBreakers(Array.from(new Set(combined)));
        }
      })
      .catch(() => {
        // Offline / local fallback keeps default starter prompts
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello ${profile.firstName || 'there'}! I'm **LITbot**, your personal CleanSlate bankruptcy assistant.

Bankruptcy paperwork and Form 65 terms can feel confusing or overwhelming—**you don't have to figure this out alone.** Ask me anything in plain English, even if it feels basic!

**How I can help you right now:**
- Explain confusing Form 65 categories (like *Medical Condition Expenses vs. Prescriptions*, or *EI vs. Social Assistance*).
- Clarify everyday situations like **cash gifts for holidays/birthdays**, tax refunds, or **internal transfers across multiple bank accounts**.
- Review uploaded bank statements, paystubs, or receipts to help you categorize accurately.`
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

    const requestBody = JSON.stringify({
      prompt: textToSubmit,
      messages: messages.map((m) => ({ role: m.role, text: m.text })),
      attachments: currentAttachments.map((a) => ({
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
      },
      sessionId: chatSessionId
    });

    try {
      let response = await fetch('/api/litbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      if (response.status >= 502 && response.status <= 504) {
        await new Promise((r) => setTimeout(r, 800));
        response = await fetch('/api/litbot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const resolvedText =
        data?.text && data.text.trim().length > 0
          ? data.text
          : getFallbackLitBotResponse(textToSubmit, {
              firstName: profile.firstName,
              province: profile.province,
              householdSize: profile.householdSize,
              litName: profile.litName,
              surplusPayment: 159
            }).text;

      const botMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: resolvedText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Error sending message to LITbot:', err);
      const fallback = getFallbackLitBotResponse(textToSubmit, {
        firstName: profile.firstName,
        province: profile.province,
        householdSize: profile.householdSize,
        litName: profile.litName,
        surplusPayment: 159
      });
      const fallbackBotMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: fallback.text,
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
    setChatSessionId(`litbot-main-${Date.now()}`);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Chat history cleared. Ask me anything in plain English—or upload a statement or receipt for Form 65 guidance!`
      }
    ]);
  };

  // Helper to render simple markdown formatting (headers, bold, lists, code)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm sm:text-base font-extrabold text-[#101010] mt-3 mb-1 tracking-wide">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-base sm:text-lg font-extrabold text-[#101010] mt-4 mb-2 tracking-wide">
            {line.replace('## ', '')}
          </h3>
        );
      }

      const formatInline = (raw: string) => {
        const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-bold text-[#101010]">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            return <em key={pIdx} className="italic text-[#2d2a37]">{part.slice(1, -1)}</em>;
          }
          if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return <code key={pIdx} className="px-1.5 py-0.5 rounded bg-[#f1f0f7] text-[#101010] font-mono text-[11px]">{part.slice(1, -1)}</code>;
          }
          return part;
        });
      };

      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-[#4b4856] text-xs sm:text-sm leading-relaxed my-0.5">
            {formatInline(trimmed.slice(2))}
          </li>
        );
      }

      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} className="ml-2 font-medium text-[#101010] text-xs sm:text-sm leading-relaxed my-1">
            {formatInline(trimmed)}
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs sm:text-sm text-[#4b4856] leading-relaxed my-1">
          {formatInline(line)}
        </p>
      );
    });
  };

  return (
    <div className="px-4 sm:px-8 py-4 max-w-[1440px] mx-auto min-h-[calc(100vh-2rem)] flex flex-col space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-7 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#b6b3ff] border border-[#101010] text-[#101010] flex items-center justify-center font-bold shrink-0">
              <Bot className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-[#101010]">
                  LITBOT
                </h2>
                <span className="status-tag-compact bg-[#46e3a5] text-[#102a1f] border border-[#101010]/20 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#102a1f] animate-pulse" />
                  Live Trustee Assistant
                </span>
              </div>
              <p className="text-xs text-[#4b4856] mt-1 leading-relaxed">
                Ask plain-English questions about Canadian bankruptcy, Form 65 categories, and everyday finances—or upload documents for guidance.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center flex-wrap">
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#101010] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Clear current chat log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Chat</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToReports}
              className="px-4 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Form 65 Wizard</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHAT WORKSPACE */}
      <div className="flex-1 bg-[#fbf9f5] text-[#101010] rounded-3xl border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] p-5 sm:p-6 flex flex-col justify-between min-h-[560px]">
        {/* Quick Statutory Prompt Chips */}
        <div className="pb-4 border-b border-[#8c93fc]/25 flex items-center gap-2 overflow-x-auto select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6e6b7b] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#8c93fc]" />
            Try Asking:
          </span>
          {agentIceBreakers.map((promptText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(promptText)}
              disabled={isSending}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-[#101010] text-xs font-medium whitespace-nowrap transition border border-[#d8d9f8] hover:border-[#101010] cursor-pointer shrink-0 disabled:opacity-50"
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
                  className={`w-9 h-9 rounded-2xl border border-[#101010] flex items-center justify-center font-bold shrink-0 shadow-[2px_2px_0px_#000000] ${
                    isUser ? 'bg-[#b6b3ff] text-[#101010]' : 'bg-[#F9F45D] text-[#101010]'
                  }`}
                >
                  {isUser ? (
                    <span className="text-xs font-extrabold">{profile.firstName ? profile.firstName[0] : 'U'}</span>
                  ) : (
                    <Bot className="w-5 h-5 stroke-[2.3]" />
                  )}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`rounded-3xl p-5 space-y-3 ${
                    isUser
                      ? 'bg-[#2d2a37] text-white border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] rounded-tr-xs'
                      : 'bg-white text-[#101010] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-tl-xs'
                  }`}
                >
                  {/* Sender Header */}
                  <div
                    className={`flex items-center justify-between gap-4 text-[10px] font-bold tracking-wider uppercase pb-1.5 border-b ${
                      isUser ? 'border-white/15 text-slate-300' : 'border-[#d8d9f8]/70 text-[#6e6b7b]'
                    }`}
                  >
                    <span>{isUser ? `${profile.firstName || 'You'} (Debtor)` : 'LITbot Statutory Engine'}</span>
                    <span className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  {/* Attachment Previews in User Bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white"
                        >
                          {att.fileType === 'image' ? (
                            <ImageIcon className="w-4 h-4 shrink-0 text-[#F9F45D]" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0 text-[#b6b3ff]" />
                          )}
                          <span className="truncate max-w-[150px]">{att.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="space-y-1">
                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap text-white">
                        {msg.text}
                      </p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  {/* Statutory Trust Disclaimer for Bot Messages */}
                  {!isUser && (
                    <div className="pt-2 border-t border-[#d8d9f8]/70 flex items-center gap-1.5 text-[10.5px] text-[#6e6b7b]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Transmitted under Canadian BIA &amp; OSB Trustee Audit Standards</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex gap-3 max-w-xl mr-auto animate-in fade-in">
              <div className="w-9 h-9 rounded-2xl bg-[#F9F45D] border border-[#101010] text-[#101010] flex items-center justify-center font-bold shrink-0">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white text-[#101010] border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] rounded-3xl rounded-tl-xs p-4 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#8c93fc] animate-pulse" />
                <span className="text-xs font-semibold text-[#4b4856]">
                  LITbot is checking BIA statutory guidance for your answer...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Upload File Attachment Bar */}
        {attachments.length > 0 && (
          <div className="pt-3 px-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-[#101010] shrink-0">Attached:</span>
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-[#101010] text-xs border border-[#101010] shrink-0"
              >
                {att.fileType === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-[#8c93fc]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#8c93fc]" />
                )}
                <span className="truncate max-w-[140px] font-mono text-[11px]">{att.fileName}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input & Send Form Bar */}
        <div className="pt-4 border-t border-[#8c93fc]/25">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-xl bg-white hover:bg-slate-50 text-[#101010] transition-all border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] shrink-0 cursor-pointer"
              title="Attach document, receipt, paystub, or image for LITbot analysis"
            >
              <Paperclip className="w-5 h-5 text-[#101010]" />
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask LITbot anything in plain English (cash gifts, Form 65 lines, transfers, or attach a document)..."
                disabled={isSending}
                className="w-full bg-white border-[1.5px] border-[#101010] rounded-xl px-4 py-3 text-sm text-[#101010] placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#a5a7fb] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && attachments.length === 0)}
              className="px-5 py-3 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
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
