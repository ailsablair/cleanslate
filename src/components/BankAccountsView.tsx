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
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';

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
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* Overview Card: Purpose, Reassurance & Key Actions */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-[#8c93fc]/25">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                BANK ACCOUNTS &amp; STATEMENT FEEDS
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] max-w-2xl leading-relaxed">
              Your connected accounts automatically import balances and transactions into your monthly Form 65 reports for your Licensed Insolvency Trustee. CleanSlate uses bank-level, read-only connections—funds cannot be moved or withdrawn.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onSyncAll}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-semibold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer whitespace-nowrap"
              title="Refresh balances now from Canadian financial institutions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#b4b1fc]' : 'text-white'}`} />
              <span>{isSyncing ? 'Syncing Feeds...' : 'Sync All Feeds'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Link Account</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[124px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Total Available Balance
            </span>
            <div className="mt-auto pt-3 space-y-1">
              <div className="text-xl sm:text-2xl font-extrabold text-[#101010] tabular-nums">
                {formatCurrency(totalBalance)}{' '}
                <span className="text-xs font-semibold text-[#6e6b7b]">CAD</span>
              </div>
              <span className="text-[11px] text-[#4b4856] block">
                Across {bankAccounts.length} connected accounts
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[124px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Form 65 Integration
            </span>
            <div className="mt-auto pt-3 space-y-1.5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#46e3a5] text-[#102a1f] text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.25]" />
                  <span>Active Sync</span>
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-[#101010] tabular-nums">
                {bankAccounts.length} Accounts Linked
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#2d2a37] shadow-[3px_4px_0px_#a5a7fb] flex flex-col justify-between min-h-[124px]">
            <span className="text-xs text-[#6e6b7b] font-normal">
              Trustee Privacy &amp; Security
            </span>
            <div className="mt-auto pt-3 space-y-1.5">
              <div className="text-lg sm:text-xl font-extrabold text-[#101010] flex items-center gap-2">
                <span>256-Bit Read-Only</span>
                <ShieldCheck className="w-4 h-4 text-[#46e3a5] fill-[#46e3a5]/20 shrink-0" />
              </div>
              <span className="text-[11px] text-[#4b4856] block">
                Encrypted statement feed for LIT audit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000] flex flex-col justify-between space-y-5"
          >
            <div>
              {/* Card Header: Institution & Type with actions */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#e9e8ec] text-[#4b4856] text-[11px] font-semibold truncate">
                  {account.institution} · {account.accountType}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(account)}
                    className="p-1.5 rounded-lg text-[#4b4856] hover:text-[#101010] hover:bg-white border border-transparent hover:border-[#d8d9f8] transition cursor-pointer"
                    title="Edit Name & Balance"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAccount(account.id)}
                    className="p-1.5 rounded-lg text-[#4b4856] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Disconnect Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Account Nickname */}
              <div className="text-base font-extrabold text-[#101010] mb-0.5 truncate">
                {account.name}
              </div>
              <div className="text-xs font-mono text-[#6e6b7b]">
                {account.accountMask}
              </div>
            </div>

            <div>
              {/* Balance & Trend inside crisp white inset */}
              <div className="bg-white rounded-2xl p-4 border border-[#d8d9f8] flex items-baseline justify-between mb-3">
                <div className="text-2xl font-extrabold text-[#101010] tracking-tight tabular-nums">
                  {formatCurrency(account.balance)}
                </div>
                <div className="w-7 h-7 rounded-full bg-[#fbf9f5] border border-[#d8d9f8] flex items-center justify-center shrink-0">
                  {account.trendDirection === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-rose-600 stroke-[2.2]" />
                  )}
                </div>
              </div>

              {/* Footer status */}
              <div className="text-[11px] text-[#6e6b7b] flex items-center justify-between pt-1">
                <span>Updated: {account.lastSyncedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Link Account Modal — Light Neo-Brutalist */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[6px_8px_0px_#000000] space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#b4b1fc]/35">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#101010]">
                  LINK CANADIAN BANK ACCOUNT
                </h3>
                <p className="text-xs text-[#6e6b7b] mt-0.5">
                  Read-only feed for automatic Form 65 transaction syncing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <FloatingSelect
                label="Financial Institution"
                value={institution}
                onChange={e => {
                  setInstitution(e.target.value);
                  setName(`${e.target.value.split(' ')[0]} Everyday Chequing`);
                }}
                options={SUPPORTED_INSTITUTIONS.map(inst => ({ value: inst, label: inst }))}
              />

              <FloatingInput
                label="Account Nickname"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <FloatingSelect
                  label="Account Type"
                  value={accountType}
                  onChange={e => setAccountType(e.target.value as any)}
                  options={[
                    { value: 'Chequing', label: 'Chequing' },
                    { value: 'Savings', label: 'Savings' },
                    { value: 'Rent Savings', label: 'Rent Savings' },
                    { value: 'Tax Buffer', label: 'Tax Buffer' }
                  ]}
                />
                <FloatingInput
                  type="number"
                  step="0.01"
                  prefix="$"
                  label="Current Balance"
                  value={balance}
                  onChange={e => setBalance(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#101010] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
                >
                  Confirm &amp; Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal — Light Neo-Brutalist */}
      {editingAccount && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setEditingAccount(null)}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[6px_8px_0px_#000000] space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-[#b4b1fc]/35">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#101010]">
                EDIT ACCOUNT DETAILS
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <FloatingInput
                label="Account Nickname"
                value={editingAccount.name}
                onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                required
              />

              <FloatingInput
                type="number"
                step="0.01"
                prefix="$"
                label="Balance (CAD)"
                value={editingAccount.balance}
                onChange={e => setEditingAccount({ ...editingAccount, balance: parseFloat(e.target.value) || 0 })}
                required
              />

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#101010] text-xs font-bold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-white font-bold text-xs border-[1.5px] border-[#F9F45D] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
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
