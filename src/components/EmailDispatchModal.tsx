import React from 'react';
import { MailCheck, CheckCircle2, Clock, X, ExternalLink, Copy, Check } from 'lucide-react';
import { EmailDispatch } from '../types';
import { getMailtoUrl } from '../lib/formatters';

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
      className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl max-w-3xl w-full max-h-[85vh] shadow-[6px_8px_0px_#000000] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#b4b1fc]/35 flex items-center justify-between bg-[#fbf9f5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#b6b3ff] border border-[#101010] flex items-center justify-center text-[#101010] shrink-0">
              <MailCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#101010]">
                Licensed Insolvency Trustee (LIT) Automated Email Outbox
              </h3>
              <p className="text-[11px] text-[#6e6b7b]">
                Audited transmission records automatically dispatched upon profile update or Form 65 submission.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close email outbox modal"
            className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Modal Content: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#d8d9f8] overflow-hidden">
          {/* Left Column: List of Dispatches */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-2 bg-[#fbf9f5]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6e6b7b] px-2 mb-2 tabular-nums">
              Transmission History ({dispatches.length})
            </div>
            {dispatches.map(item => {
              const isSel = current?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`p-3 rounded-2xl transition cursor-pointer text-xs space-y-1 relative ${
                    isSel
                      ? 'bg-[#f7f4eb] border-[1.5px] border-[#101010] shadow-[2px_3px_0px_#a5a7fb]'
                      : 'bg-white border border-[#d8d9f8] hover:border-[#8c93fc]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[10px] text-[#6e6b7b] tabular-nums">
                      {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f]">
                      {item.status}
                    </span>
                  </div>
                  <div className="truncate font-extrabold text-[#101010]">
                    {item.subject}
                  </div>
                  <div className="text-[11px] truncate text-[#4b4856]">
                    To: {item.recipientName || item.recipientEmail}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Email Content Preview */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-4 bg-white">
            {current ? (
              <>
                <div className="space-y-2 pb-4 border-b border-[#d8d9f8] text-xs">
                  <div>
                    <span className="text-[#6e6b7b] block text-[10px] uppercase font-bold">Subject:</span>
                    <span className="font-extrabold text-[#101010] text-sm">{current.subject}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#6e6b7b] block text-[10px] uppercase font-bold">Recipient LIT:</span>
                      <a
                        href={getMailtoUrl(current.recipientEmail, current.subject)}
                        className="font-semibold text-[#5b52d6] underline hover:text-[#101010] transition"
                        title="Send email to LIT"
                      >
                        {current.recipientEmail}
                      </a>
                    </div>
                    <div>
                      <span className="text-[#6e6b7b] block text-[10px] uppercase font-bold">Timestamp:</span>
                      <span className="text-[#4b4856] tabular-nums">{new Date(current.sentAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6b7b]">
                      Dispatched Statutory Body
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBody}
                      className="text-[11px] font-bold text-[#101010] hover:text-[#5b52d6] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy Email Text'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-[#1d1a27] text-slate-200 text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text border-[1.5px] border-[#101010] max-h-80 overflow-y-auto">
                    {current.body}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-[#46e3a5]/20 border border-[#46e3a5] text-[#102a1f] text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Verified delivery to {current.recipientEmail}. Audit trail logged in Firestore.</span>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-[#6e6b7b]">
                No dispatch selected.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#fbf9f5] border-t border-[#b4b1fc]/35 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#101010] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
          >
            Close Outbox
          </button>
        </div>
      </div>
    </div>
  );
};
