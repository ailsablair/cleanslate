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
  ShieldCheck, 
  Lock,
  Clock
} from 'lucide-react';
import { BankAccount } from '../types';
import { formatCurrency } from '../lib/formatters';

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
  const [name, setName] = useState('RBC Main Chequing');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('Chequing');
  const [accountMask, setAccountMask] = useState('•••• 5678');
  const [balance, setBalance] = useState<number>(2450.00);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      userId: 'demo-user-chad-001',
      institution,
      name,
      accountMask: accountMask.startsWith('••••') ? accountMask : `•••• ${accountMask.slice(-4)}`,
      accountType,
      balance: Number(balance.toFixed(2)),
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
      onUpdateAccount({
        ...editingAccount,
        balance: Number(editingAccount.balance.toFixed(2))
      });
      setEditingAccount(null);
    }
  };

  const resetForm = () => {
    setInstitution(SUPPORTED_INSTITUTIONS[0]);
    setName('New Everyday Chequing');
    setAccountMask('•••• ' + Math.floor(1000 + Math.random() * 9000));
    setBalance(1500.00);
  };

  const totalBalance = bankAccounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  return (
    <div className="px-8 py-4 space-y-6 max-w-[1440px] mx-auto">
      {/* Overview Card: Purpose, Reassurance & Key Actions */}
      <div className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                Bank Accounts & Statement Feeds
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed font-light">
              Your connected accounts automatically import balances and transactions into your monthly Form 65 reports for your Licensed Insolvency Trustee. CleanSlate uses bank-level, read-only connections—funds cannot be moved or withdrawn.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl bg-[#1d1a27] hover:bg-[#2d283c] text-white text-xs font-medium transition flex items-center gap-2 shadow-xs disabled:opacity-70 active:scale-95"
              title="Refresh balances now from Canadian financial institutions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#b4b1fc]' : 'text-slate-300'}`} />
              <span className="font-normal">{isSyncing ? 'Syncing Feeds...' : 'Sync All Feeds'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#fbf050] hover:bg-[#f3e73b] text-[#1d1a27] text-xs font-semibold transition flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Link Account</span>
            </button>
          </div>
        </div>

        {/* Clean Typographic Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              Total Available Balance
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatCurrency(totalBalance)} <span className="text-xs font-normal text-slate-500">CAD</span>
            </div>
            <span className="text-[11px] text-slate-500 font-light mt-0.5 block">
              Across {bankAccounts.length} connected accounts
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              Form 65 Integration
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>{bankAccounts.length} Accounts Linked</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-light mt-0.5 block">
              Feeds monthly income & expense ledger
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              Trustee Privacy & Security
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-800 flex items-center gap-2">
              <span>256-Bit Read-Only</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[11px] text-slate-500 font-light mt-0.5 block">
              Encrypted statement feed for LIT audit
            </span>
          </div>
        </div>
      </div>

      {/* Account Cards Grid: Clean, Calm Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {bankAccounts.map((account) => (
          <div 
            key={account.id} 
            className="bg-[#fbf9f5] text-[#242031] rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-5 hover:border-slate-300 transition"
          >
            <div>
              {/* Card Header: Institution & Type with discrete actions */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">
                  {account.institution} · {account.accountType}
                </span>
                <div className="flex items-center gap-1">
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

              {/* Account Nickname */}
              <div className="text-sm font-semibold text-slate-900 mb-0.5 truncate">
                {account.name}
              </div>
              <div className="text-xs font-mono text-slate-400 font-light">
                {account.accountMask}
              </div>
            </div>

            <div>
              {/* Balance & Trend */}
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formatCurrency(account.balance)}
                </div>
                <div>
                  {account.trendDirection === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 stroke-[2]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-500 stroke-[2]" />
                  )}
                </div>
              </div>

              {/* Footer status */}
              <div className="text-[11px] text-slate-500 font-light flex items-center justify-between border-t border-slate-200/80 pt-2.5">
                <span>Last updated: {account.lastSyncedAt}</span>
                <span className="text-emerald-700 font-normal flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Form 65 Linked
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Link Account Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-semibold tracking-wide text-white">
                Link Canadian Bank Account
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Financial Institution
                </label>
                <select
                  value={institution}
                  onChange={e => {
                    setInstitution(e.target.value);
                    setName(`${e.target.value.split(' ')[0]} Everyday Chequing`);
                  }}
                  className="w-full bg-white text-[#101010] border border-slate-300 rounded-xl px-3.5 py-3.5 min-h-[44px] text-xs font-light focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                >
                  {SUPPORTED_INSTITUTIONS.map(inst => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Account Nickname
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. RBC Everyday Chequing"
                  className="w-full bg-white text-[#101010] border border-slate-300 rounded-xl px-3.5 py-3.5 min-h-[44px] text-xs font-light placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                >
                </input>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as any)}
                    className="w-full bg-white text-[#101010] border border-slate-300 rounded-xl px-3 py-3.5 min-h-[44px] text-xs font-light focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                    style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                  >
                    <option value="Chequing">Chequing</option>
                    <option value="Savings">Savings</option>
                    <option value="Rent Savings">Rent Savings</option>
                    <option value="Tax Buffer">Tax Buffer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1.5">
                    Current Balance ($ CAD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={e => setBalance(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-white text-[#101010] border border-slate-300 rounded-xl px-3.5 py-3.5 min-h-[44px] text-xs font-light placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                    style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#fbf050] text-[#1d1a27] font-semibold text-xs hover:bg-[#f3e73b] transition"
                >
                  Confirm & Link Account
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
            className="bg-[#2e293f] text-white border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-semibold tracking-wide text-white">
                Edit Account Details
              </h3>
              <button 
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Account Nickname
                </label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  required
                  className="w-full bg-white text-[#101010] border border-slate-300 rounded-xl px-3.5 py-3.5 min-h-[44px] text-xs font-light placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">
                  Balance ($ CAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingAccount.balance}
                  onChange={e => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full bg-white text-[#101010] border border-slate-300 rounded-xl px-3.5 py-3.5 min-h-[44px] text-xs font-light placeholder:text-[#767676] placeholder:italic focus:placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[#b6b3ff]"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#b6b3ff] text-[#242031] font-semibold text-xs hover:bg-white transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
