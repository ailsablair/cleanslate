import React from 'react';
import { MailCheck, CheckCircle2, Clock, X, ExternalLink, Copy, Check } from 'lucide-react';
import { EmailDispatch } from '../types';

interface EmailDispatchModalProps {
  dispatches: EmailDispatch[];
  isOpen: boolean;
  onClose: () => void;
  activeDispatch?: EmailDispatch | null;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  dispatches,
  isOpen,
  onClose,
  activeDispatch: initialActive
}) => {
  const [selected, setSelected] = React.useState<EmailDispatch | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (initialActive) {
      setSelected(initialActive);
    } else if (dispatches.length > 0 && !selected) {
      setSelected(dispatches[0]);
    }
  }, [initialActive, dispatches]);

  if (!isOpen) return null;

  const current = selected || dispatches[0];

  const handleCopyBody = () => {
    if (current) {
      navigator.clipboard.writeText(current.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#242031] text-white border border-white/10 rounded-3xl max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1d1a27]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b6b3ff] flex items-center justify-center text-[#242031]">
              <MailCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Licensed Insolvency Trustee (LIT) Automated Email Outbox
              </h3>
              <p className="text-[11px] text-slate-400">
                Audited transmission records automatically dispatched upon profile update or Form 65 submission.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Content: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
          {/* Left Column: List of Dispatches */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-2 bg-[#1f1b2b]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Transmission History ({dispatches.length})
            </div>
            {dispatches.map(item => {
              const isSel = current?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`p-3 rounded-2xl transition cursor-pointer text-xs space-y-1 ${
                    isSel 
                      ? 'bg-[#b6b3ff] text-[#242031] font-bold shadow-sm' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-mono text-[10px] ${isSel ? 'text-[#242031]/80' : 'text-slate-400'}`}>
                      {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isSel ? 'bg-[#242031] text-[#b6b3ff]' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="truncate font-extrabold">
                    {item.subject}
                  </div>
                  <div className={`text-[11px] truncate ${isSel ? 'text-[#242031]/90' : 'text-slate-400'}`}>
                    To: {item.recipientName || item.recipientEmail}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Email Content Preview */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-4 bg-[#242031]">
            {current ? (
              <>
                <div className="space-y-2 pb-4 border-b border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject:</span>
                    <span className="font-extrabold text-white text-sm">{current.subject}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Recipient LIT:</span>
                      <span className="font-semibold text-[#b6b3ff]">{current.recipientEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp:</span>
                      <span className="text-slate-300">{new Date(current.sentAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Dispatched Statutory Body
                    </span>
                    <button
                      onClick={handleCopyBody}
                      className="text-[11px] font-bold text-[#b6b3ff] hover:text-white flex items-center gap-1 transition"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy Email Text'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-[#171420] text-slate-200 text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text border border-white/5 max-h-80 overflow-y-auto">
                    {current.body}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified delivery to {current.recipientEmail}. Audit trail logged in Firestore.</span>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No dispatch selected.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1d1a27] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            Close Outbox
          </button>
        </div>
      </div>
    </div>
  );
};
