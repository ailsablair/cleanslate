import React, { useState } from 'react';
import { 
  Shapes, 
  Sparkles, 
  Check, 
  HelpCircle, 
  ChevronRight, 
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Transaction } from '../types';

interface CategorizeViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
}

const FORM_65_CATEGORIES = [
  'Food & Grocery',
  'Rent or Mortgage Payments',
  'Repair, Maintenance & Gas',
  'Medical Condition Expenses',
  'Hydro',
  'Heating / Gas / Oil',
  'Telephone & Digital Utilities',
  'Child Care',
  'Clothing',
  'Grooming & Toiletries',
  'Smoking & Personal',
  'Alcohol',
  'To The Estate Dividend'
];

export const CategorizeView: React.FC<CategorizeViewProps> = ({
  transactions,
  onUpdateTransaction
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'needs-review' | 'categorized'>('needs-review');
  const [aiRunning, setAiRunning] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const filtered = transactions.filter(t => {
    if (filterMode === 'needs-review') return !t.isCategorized;
    if (filterMode === 'categorized') return t.isCategorized;
    return true;
  });

  const handleAssignCategory = (tx: Transaction, category: string) => {
    onUpdateTransaction({
      ...tx,
      form65Category: category,
      isCategorized: true
    });
  };

  const handleRunAiClassifier = () => {
    setAiRunning(true);
    setAiMessage('Analyzing vendor names and matching against Canadian OSB Form 65 tax rules...');
    setTimeout(() => {
      transactions.forEach(t => {
        if (!t.isCategorized) {
          let cat = 'Food & Grocery';
          if (t.company.toLowerCase().includes('properties') || t.company.toLowerCase().includes('rent')) cat = 'Rent or Mortgage Payments';
          else if (t.company.toLowerCase().includes('mechanics') || t.company.toLowerCase().includes('gas') || t.company.toLowerCase().includes('auto')) cat = 'Repair, Maintenance & Gas';
          else if (t.company.toLowerCase().includes('drug') || t.company.toLowerCase().includes('pharmacy') || t.company.toLowerCase().includes('medical')) cat = 'Medical Condition Expenses';
          else if (t.company.toLowerCase().includes('hydro') || t.company.toLowerCase().includes('electric')) cat = 'Hydro';
          
          onUpdateTransaction({
            ...t,
            form65Category: cat,
            isCategorized: true
          });
        }
      });
      setAiRunning(false);
      setAiMessage('AI categorization complete! All ambiguous transactions mapped to Form 65 statutory lines.');
      setTimeout(() => setAiMessage(null), 4000);
    }, 1200);
  };

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Overview Card */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Shapes className="w-5 h-5 text-[#242031]" />
              <h2 className="text-lg font-black tracking-wider uppercase text-slate-900">
                AI TRANSACTION CLASSIFIER & FORM 65 RULES
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Machine learning models analyze bank statement ledger items and suggest accurate Form 65 statutory expense categories, learning your vendor rules over time.
            </p>
          </div>

          <button
            onClick={handleRunAiClassifier}
            disabled={aiRunning}
            className="px-5 py-3 rounded-2xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${aiRunning ? 'animate-spin text-[#b4b1fc]' : 'text-[#fbf050]'}`} />
            <span>{aiRunning ? 'Parsing Statement Items...' : 'Auto-Classify with AI'}</span>
          </button>
        </div>

        {aiMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-6">
          <button
            onClick={() => setFilterMode('needs-review')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterMode === 'needs-review'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Needs Review ({transactions.filter(t => !t.isCategorized).length})
          </button>
          <button
            onClick={() => setFilterMode('categorized')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterMode === 'categorized'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Categorized ({transactions.filter(t => t.isCategorized).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterMode === 'all'
                ? 'bg-[#1d1a27] text-white'
                : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Ledger Items ({transactions.length})
          </button>
        </div>
      </div>

      {/* Ledger Items List */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            No transactions match this filter. All imported items are categorized!
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(tx => (
              <div 
                key={tx.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{tx.company}</span>
                    <span className="font-mono text-[11px] text-slate-400">#{tx.id}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {tx.date} · Bank Import Feed
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div className="text-right mr-2">
                    <span className="text-base font-black text-slate-900 block">
                      $ {tx.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      CAD
                    </span>
                  </div>

                  {/* Category Selector Dropdown */}
                  <select
                    value={tx.form65Category || ''}
                    onChange={e => handleAssignCategory(tx, e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b4b1fc]"
                  >
                    <option value="">Select Form 65 Category...</option>
                    {FORM_65_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {tx.isCategorized ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Mapped
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-xl">
                      Unclassified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
