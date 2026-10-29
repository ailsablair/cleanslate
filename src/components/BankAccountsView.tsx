import React, { useState } from 'react';
import { 
  Building2, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Pencil, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { BankAccount } from '../types';

interface BankAccountsViewProps {
  bankAccounts: BankAccount[];
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
  onUpdateAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onSyncAll: () => void;
  isSyncing: boolean;
}

const SUPPORTED_INSTITUTIONS = [
  'Neo Financial',
  'RBC Royal Bank',
  'TD Canada Trust',
  'Scotiabank',
  'BMO Bank of Montreal',
  'CIBC',
  'Tangerine',
  'Desjardins',
  'Simplii Financial'
];

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({
  bankAccounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onSyncAll,
  isSyncing
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form states for new connection
  const [institution, setInstitution] = useState(SUPPORTED_INSTITUTIONS[0]);
  const [name, setName] = useState('RBC MAIN CHEQUING');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('Chequing');
  const [accountMask, setAccountMask] = useState('******5678');
  const [balance, setBalance] = useState<number>(2450.00);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      userId: 'demo-user-chad-001',
      institution,
      name,
      accountMask,
      accountType,
      balance,
      currency: 'CAD',
      lastSyncedAt: 'Just now',
      status: 'connected',
      trendDirection: 'up'
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      onUpdateAccount(editingAccount);
      setEditingAccount(null);
    }
  };

  const resetForm = () => {
    setInstitution(SUPPORTED_INSTITUTIONS[0]);
    setName('NEW ACCOUNT');
    setAccountMask('******' + Math.floor(1000 + Math.random() * 9000));
    setBalance(1500);
  };

  const totalBalance = bankAccounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Header card with API Status */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#242031]" />
              <h2 className="text-lg font-black tracking-wider uppercase text-slate-900">
                BANK AGGREGATOR & LIVE API INTEGRATION
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Connected via read-only financial aggregator API with Canadian institutions. Balances automatically populate your CleanSlate Dashboard and statutory Form 65 reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="px-5 py-3 rounded-2xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#b4b1fc]' : ''}`} />
              <span>{isSyncing ? 'Synchronizing API...' : 'Sync Bank Accounts Now'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-[#fbf050] hover:bg-[#eade41] text-[#1d1a27] text-xs font-black transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Bank API</span>
            </button>
          </div>
        </div>

        {/* Aggregator Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Liquid Estate Funds
            </span>
            <div className="text-2xl font-black text-slate-900">
              $ {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Connected Institutions
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>{bankAccounts.length} Accounts</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sync Frequency
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>Weekly Auto-Sync</span>
              <Clock className="w-5 h-5 text-[#b4b1fc]" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {bankAccounts.map((account) => (
          <div 
            key={account.id} 
            className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                  {account.institution}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingAccount(account)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition"
                    title="Edit Name & Balance"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteAccount(account.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Disconnect Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-base font-black text-slate-900 mb-1">
                {account.name}
              </div>
              <div className="text-xs font-mono text-slate-400">
                {account.accountMask} · {account.accountType}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  $ {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div>
                  {account.trendDirection === 'up' ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-rose-500 stroke-[2.5]" />
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-200/80 pt-2.5">
                <span>Last updated: {account.lastSyncedAt}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Feed
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connect Bank Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#b6b3ff]">
                Connect Financial Institution (API)
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">
                  Select Financial Institution
                </label>
                <select
                  value={institution}
                  onChange={e => {
                    setInstitution(e.target.value);
                    setName(`${e.target.value.split(' ')[0].toUpperCase()} CHEQUING`);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                >
                  {SUPPORTED_INSTITUTIONS.map(inst => (
                    <option key={inst} value={inst} className="bg-[#2e293f] text-white">
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">
                  Account Nickname (Display on Dashboard)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. RBC CHEQUING"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                  >
                    <option value="Chequing" className="bg-[#2e293f]">Chequing</option>
                    <option value="Savings" className="bg-[#2e293f]">Savings</option>
                    <option value="Rent Savings" className="bg-[#2e293f]">Rent Savings</option>
                    <option value="Tax Buffer" className="bg-[#2e293f]">Tax Buffer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1.5">
                    Starting Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={e => setBalance(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#fbf050] text-[#1d1a27] font-black text-xs hover:bg-[#eade41] transition"
                >
                  Authorize & Sync API Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setEditingAccount(null)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#b6b3ff]">
                Edit Account Nickname & Balance
              </h3>
              <button 
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">
                  Account Nickname
                </label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1.5">
                  Balance ($ CAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingAccount.balance}
                  onChange={e => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#b6b3ff] text-[#242031] font-black text-xs hover:bg-white transition"
                >
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
