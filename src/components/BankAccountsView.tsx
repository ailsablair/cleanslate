import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Lock
} from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { BankAccount, Transaction } from '../types';
import { formatCurrency } from '../lib/formatters';
import {
  parseCsvStatement,
  parseOfxStatement,
  ParsedStatementResult
} from '../lib/statementParser';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';

interface BankAccountsViewProps {
  userId: string;
  bankAccounts: BankAccount[];
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
  onUpdateAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onSyncAll: () => void;
  isSyncing: boolean;
  onPlaidConnected: (accounts: BankAccount[], transactions: Transaction[]) => void;
  onStatementImported: (payload: {
    account: BankAccount | Omit<BankAccount, 'id'>;
    isUpdate: boolean;
    transactions: Array<Omit<Transaction, 'id'>>;
  }) => void;
  onNavigateToCategorize?: () => void;
}

const SUPPORTED_INSTITUTIONS = [
  'RBC Royal Bank',
  'TD Canada Trust',
  'BMO Bank of Montreal',
  'Scotiabank',
  'CIBC',
  'Tangerine',
  'Simplii Financial',
  'Neo Financial',
  'Desjardins',
  'EQ Bank'
];

type LinkModalMode = 'recommended' | 'fallback-statement' | 'fallback-manual';

interface PlaidStatusInfo {
  configured: boolean;
  env: string;
  connectedItemsCount: number;
}

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({
  userId,
  bankAccounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onSyncAll,
  isSyncing,
  onPlaidConnected,
  onStatementImported,
  onNavigateToCategorize
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [linkMode, setLinkMode] = useState<LinkModalMode>('recommended');
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Plaid Link state
  const [plaidStatus, setPlaidStatus] = useState<PlaidStatusInfo | null>(null);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [oauthRedirectUri, setOauthRedirectUri] = useState<string | undefined>(undefined);
  const [shouldAutoOpenPlaid, setShouldAutoOpenPlaid] = useState(false);
  const [isCreatingLinkToken, setIsCreatingLinkToken] = useState(false);
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);

  // Fallback Option: User-Initiated Statement Export state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statementTargetMode, setStatementTargetMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingId, setSelectedExistingId] = useState<string>(bankAccounts[0]?.id || '');
  const [statementInstitution, setStatementInstitution] = useState(SUPPORTED_INSTITUTIONS[0]);
  const [statementAccountName, setStatementAccountName] = useState('RBC Everyday Chequing');
  const [statementAccountType, setStatementAccountType] =
    useState<BankAccount['accountType']>('Chequing');
  const [statementMask, setStatementMask] = useState('•••• 1234');
  const [statementBalance, setStatementBalance] = useState<string>('');
  const [statementFileName, setStatementFileName] = useState<string>('');
  const [isParsingStatement, setIsParsingStatement] = useState(false);
  const [statementError, setStatementError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedStatementResult | null>(null);

  // Fallback Manual Entry state
  const [institution, setInstitution] = useState(SUPPORTED_INSTITUTIONS[0]);
  const [name, setName] = useState('RBC Main Chequing');
  const [accountType, setAccountType] = useState<BankAccount['accountType']>('Chequing');
  const [accountMask, setAccountMask] = useState('•••• 5678');
  const [balance, setBalance] = useState<number>(2450.0);

  const fetchPlaidStatus = async () => {
    try {
      const res = await fetch(`/api/bank/plaid/status?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data: PlaidStatusInfo = await res.json();
        setPlaidStatus(data);
      }
    } catch {
      // Ignore network hiccup
    }
  };

  useEffect(() => {
    fetchPlaidStatus();

    // Resume Plaid OAuth redirect if bank redirected back with oauth_state_id
    if (typeof window !== 'undefined' && window.location.search.includes('oauth_state_id=')) {
      const savedToken = localStorage.getItem('cleanslate_plaid_link_token');
      if (savedToken) {
        setOauthRedirectUri(window.location.href);
        setPlaidLinkToken(savedToken);
        setShouldAutoOpenPlaid(true);
      }
    }
  }, [userId]);

  const { open: openPlaidLink, ready: isPlaidReady } = usePlaidLink({
    token: plaidLinkToken,
    ...(oauthRedirectUri ? { receivedRedirectUri: oauthRedirectUri } : {}),
    onSuccess: async (publicToken, metadata) => {
      setIsExchangingToken(true);
      setPlaidError(null);
      try {
        const res = await fetch('/api/bank/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicToken,
            userId,
            institutionName: metadata.institution?.name
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not link bank account via Plaid.');
        }

        onPlaidConnected(data.accounts || [], data.transactions || []);
        localStorage.removeItem('cleanslate_plaid_link_token');
        if (window.location.search.includes('oauth_state_id=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setIsAddModalOpen(false);
        setPlaidLinkToken(null);
        setOauthRedirectUri(undefined);
        setStatusBanner({
          type: 'success',
          message: `Connected ${data.accounts?.length || 1} account(s) and imported ${data.transactions?.length || 0} transactions from ${data.institutionName || 'your bank'} via Plaid.`
        });
        fetchPlaidStatus();
      } catch (err: any) {
        setPlaidError(err.message || 'Failed to finalize Plaid bank link.');
      } finally {
        setIsExchangingToken(false);
      }
    },
    onExit: (err) => {
      setShouldAutoOpenPlaid(false);
      if (window.location.search.includes('oauth_state_id=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (err) {
        setPlaidError(err.display_message || err.error_message || 'Bank login was cancelled.');
      }
    }
  });

  useEffect(() => {
    if (shouldAutoOpenPlaid && isPlaidReady && plaidLinkToken) {
      setShouldAutoOpenPlaid(false);
      openPlaidLink();
    }
  }, [shouldAutoOpenPlaid, isPlaidReady, plaidLinkToken, openPlaidLink]);

  const handleLaunchPlaid = async () => {
    setPlaidError(null);
    setIsCreatingLinkToken(true);
    try {
      const currentUrl =
        typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
      const res = await fetch('/api/bank/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          redirectUri: currentUrl
        })
      });
      const data = await res.json();
      if (!res.ok || !data.configured || !data.link_token) {
        setPlaidStatus({
          configured: Boolean(data.configured),
          env: data.env || 'sandbox',
          connectedItemsCount: plaidStatus?.connectedItemsCount || 0
        });
        setPlaidError(
          data.error ||
            'Plaid credentials are not configured on the server yet. Add PLAID_CLIENT_ID and PLAID_SECRET in your environment Secrets, or use the fallback statement export below.'
        );
        return;
      }

      localStorage.setItem('cleanslate_plaid_link_token', data.link_token);
      setOauthRedirectUri(undefined);
      setPlaidLinkToken(data.link_token);
      setShouldAutoOpenPlaid(true);
    } catch (err: any) {
      setPlaidError(err.message || 'Unable to reach CleanSlate Plaid endpoint.');
    } finally {
      setIsCreatingLinkToken(false);
    }
  };

  const openLinkAccountModal = (initialMode: LinkModalMode = 'recommended', targetExistingId?: string) => {
    setPlaidError(null);
    setStatementError(null);
    setParsedPreview(null);
    setStatementFileName('');
    if (targetExistingId) {
      setStatementTargetMode('existing');
      setSelectedExistingId(targetExistingId);
      const targetAcc = bankAccounts.find((a) => a.id === targetExistingId);
      if (targetAcc) {
        setStatementBalance(String(targetAcc.balance));
      }
    } else {
      setStatementTargetMode(bankAccounts.length > 0 ? 'new' : 'new');
      if (!selectedExistingId && bankAccounts[0]) {
        setSelectedExistingId(bankAccounts[0].id);
      }
    }
    setLinkMode(initialMode);
    setIsAddModalOpen(true);
    fetchPlaidStatus();
  };

  const handleStatementFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatementError(null);
    setParsedPreview(null);
    setStatementFileName(file.name);
    setIsParsingStatement(true);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const targetAccId =
      statementTargetMode === 'existing' ? selectedExistingId : undefined;

    try {
      if (ext === 'csv') {
        const text = await file.text();
        const parsed = parseCsvStatement(text, userId, targetAccId);
        setParsedPreview(parsed);
        if (parsed.endingBalance !== undefined) {
          setStatementBalance(String(parsed.endingBalance));
        }
        if (parsed.transactions.length === 0) {
          setStatementError(
            parsed.warnings[0] || 'No valid transactions found in this CSV export.'
          );
        }
      } else if (ext === 'ofx' || ext === 'qfx') {
        const text = await file.text();
        const parsed = parseOfxStatement(text, ext as 'ofx' | 'qfx', userId, targetAccId);
        setParsedPreview(parsed);
        if (parsed.institution) setStatementInstitution(parsed.institution);
        if (parsed.accountType) setStatementAccountType(parsed.accountType);
        if (parsed.accountMask) setStatementMask(parsed.accountMask);
        if (parsed.endingBalance !== undefined) {
          setStatementBalance(String(parsed.endingBalance));
        }
        if (parsed.transactions.length === 0) {
          setStatementError(
            parsed.warnings[0] || `No transactions found in this ${ext.toUpperCase()} export.`
          );
        }
      } else if (ext === 'pdf' || file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Could not read file.'));
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/bank/parse-statement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            mimeType: file.type || 'application/pdf',
            userId
          })
        });
        const data = await res.json();
        if (!data.success) {
          setStatementError(
            data.error ||
              'Could not extract PDF statement. Try exporting CSV, OFX, or QFX from your online banking portal instead.'
          );
        } else {
          const parsed: ParsedStatementResult = {
            format: 'pdf',
            institution: data.institution,
            accountName: data.accountName,
            accountType: data.accountType,
            accountMask: data.accountMask,
            endingBalance: data.endingBalance,
            transactions: (data.transactions || []).map((tx: Omit<Transaction, 'id'>) => ({
              ...tx,
              accountId: targetAccId
            })),
            warnings: []
          };
          setParsedPreview(parsed);
          if (data.institution) setStatementInstitution(data.institution);
          if (data.accountName) setStatementAccountName(data.accountName);
          if (data.accountType) setStatementAccountType(data.accountType);
          if (data.accountMask) setStatementMask(data.accountMask);
          if (data.endingBalance !== undefined) setStatementBalance(String(data.endingBalance));
        }
      } else {
        setStatementError(
          'Unsupported file type. Please download a CSV, OFX, QFX, or PDF statement from your online banking website.'
        );
      }
    } catch (err: any) {
      setStatementError(err.message || 'Failed to read the uploaded bank statement.');
    } finally {
      setIsParsingStatement(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmStatementImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedPreview) return;

    const numericBalance = parseFloat(statementBalance);
    const nowLabel = `Statement upload (${new Date().toLocaleDateString('en-CA')})`;

    if (statementTargetMode === 'existing') {
      const existing = bankAccounts.find((a) => a.id === selectedExistingId);
      if (!existing) return;

      const updatedAccount: BankAccount = {
        ...existing,
        balance: Number.isFinite(numericBalance)
          ? Number(numericBalance.toFixed(2))
          : existing.balance,
        lastSyncedAt: nowLabel,
        status: 'connected',
        connectionType: existing.connectionType === 'plaid' ? 'plaid' : 'statement-export'
      };

      onStatementImported({
        account: updatedAccount,
        isUpdate: true,
        transactions: parsedPreview.transactions.map((t) => ({
          ...t,
          accountId: existing.id
        }))
      });

      setStatusBanner({
        type: 'success',
        message: `Imported ${parsedPreview.transactions.length} transactions into ${existing.name} from your statement export.`
      });
    } else {
      const safeBalance = Number.isFinite(numericBalance) ? Number(numericBalance.toFixed(2)) : 0;
      const newAcc: Omit<BankAccount, 'id'> = {
        userId,
        institution: statementInstitution,
        name: (statementAccountName || `${statementInstitution} Chequing`).toUpperCase(),
        accountMask: statementMask.startsWith('••••')
          ? statementMask
          : `•••• ${statementMask.slice(-4) || '0000'}`,
        accountType: statementAccountType,
        balance: safeBalance,
        currency: 'CAD',
        lastSyncedAt: nowLabel,
        status: 'connected',
        trendDirection: safeBalance >= 0 ? 'up' : 'down',
        connectionType: 'statement-export'
      };

      onStatementImported({
        account: newAcc,
        isUpdate: false,
        transactions: parsedPreview.transactions
      });

      setStatusBanner({
        type: 'success',
        message: `Linked ${newAcc.name} and imported ${parsedPreview.transactions.length} transactions via fallback statement export.`
      });
    }

    setIsAddModalOpen(false);
    setParsedPreview(null);
    setStatementFileName('');
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      userId,
      institution,
      name,
      accountMask: accountMask.startsWith('••••') ? accountMask : `•••• ${accountMask.slice(-4)}`,
      accountType,
      balance: Number(balance.toFixed(2)),
      currency: 'CAD',
      lastSyncedAt: 'Manual entry',
      status: 'connected',
      trendDirection: balance >= 0 ? 'up' : 'down',
      connectionType: 'manual'
    });
    setIsAddModalOpen(false);
    resetManualForm();
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

  const resetManualForm = () => {
    setInstitution(SUPPORTED_INSTITUTIONS[0]);
    setName('New Everyday Chequing');
    setAccountMask('•••• ' + Math.floor(1000 + Math.random() * 9000));
    setBalance(1500.0);
  };

  const totalBalance = bankAccounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const plaidCount = bankAccounts.filter((a) => a.connectionType === 'plaid').length;

  return (
    <div className="px-4 sm:px-8 py-4 space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* Status Banner */}
      {statusBanner && (
        <div
          className={`rounded-2xl px-5 py-3.5 border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] flex items-center justify-between gap-4 text-xs font-semibold ${
            statusBanner.type === 'success'
              ? 'bg-[#46e3a5] text-[#102a1f]'
              : statusBanner.type === 'error'
              ? 'bg-rose-100 text-rose-900'
              : 'bg-[#fbf9f5] text-[#101010]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusBanner.message}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToCategorize && statusBanner.type === 'success' && (
              <button
                type="button"
                onClick={onNavigateToCategorize}
                className="underline font-bold hover:opacity-80 cursor-pointer whitespace-nowrap"
              >
                Review in Categorize &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="font-bold hover:opacity-70 cursor-pointer"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
              Connect your Canadian bank directly through Plaid&apos;s encrypted login redirect so balances and transactions sync automatically into your Form 65 reports. CleanSlate only receives read-only access—funds can never be moved or withdrawn.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onSyncAll}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-[#2d2a37] hover:bg-[#3a3646] text-white text-xs font-semibold border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer whitespace-nowrap"
              title="Refresh balances and transactions from connected accounts"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#b4b1fc]' : 'text-white'}`}
              />
              <span>{isSyncing ? 'Syncing Feeds...' : 'Sync All Feeds'}</span>
            </button>

            <button
              type="button"
              onClick={() => openLinkAccountModal('recommended')}
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
                  <span>{plaidCount > 0 ? 'Plaid Live Sync' : 'Active Ledger'}</span>
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
                Encrypted bank OAuth via Plaid
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
                <span className="text-xs font-semibold text-[#4b4856] truncate">
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
              <div className="text-xs font-mono text-[#6e6b7b]">{account.accountMask}</div>
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

              {/* Footer status & connection source */}
              <div className="text-[11px] text-[#6e6b7b] flex items-center justify-between gap-2 pt-1">
                <span className="truncate">Updated: {account.lastSyncedAt}</span>
                {account.connectionType === 'plaid' ? (
                  <span className="text-emerald-700 font-semibold whitespace-nowrap">
                    Plaid Auto-Sync
                  </span>
                ) : account.connectionType === 'statement-export' ? (
                  <button
                    type="button"
                    onClick={() => openLinkAccountModal('fallback-statement', account.id)}
                    className="text-[#4b4856] hover:text-[#101010] underline font-semibold whitespace-nowrap cursor-pointer"
                    title="Upload an updated CSV/OFX/QFX/PDF export from your bank"
                  >
                    Update Statement
                  </button>
                ) : (
                  <span className="text-[#6e6b7b] whitespace-nowrap">Ledger Feed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Link Account Modal — Recommended Plaid + Fallback Statement Export */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white text-[#101010] border-[1.5px] border-[#101010] rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-[6px_8px_0px_#000000] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#b4b1fc]/35">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#101010]">
                  LINK CANADIAN BANK ACCOUNT
                </h3>
                <p className="text-xs text-[#6e6b7b] mt-0.5">
                  Keep balances and Form 65 transactions up to date for your trustee.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-[#4b4856] hover:text-[#101010] hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
                aria-label="Close link account modal"
              >
                ✕
              </button>
            </div>

            {/* MODE 1: RECOMMENDED (PLAID ONLINE BANKING REDIRECT) */}
            {linkMode === 'recommended' && (
              <div className="space-y-5">
                {/* Primary Recommended Option */}
                <div className="bg-[#fbf9f5] border-[1.5px] border-[#101010] shadow-[4px_5px_0px_#a5a7fb] rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Recommended · Automatic Sync</span>
                      </div>
                      <h4 className="text-base font-extrabold text-[#101010]">
                        Log In via Online Banking (Plaid)
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-[#4b4856] leading-relaxed">
                    Connect securely through <strong>Plaid</strong>—you&apos;ll sign in directly on your bank&apos;s official login page (RBC, TD, BMO, Scotiabank, CIBC, Tangerine, Simplii, and more) with read-only permission. CleanSlate never sees your password.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#4b4856]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Automatic balance updates</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Auto-pulls monthly transactions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#8c93fc] shrink-0" />
                      <span>Bank-level read-only OAuth</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Free Sandbox / 10-Account Trial</span>
                    </div>
                  </div>

                  {plaidStatus && !plaidStatus.configured && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[11px] leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Plaid Server Credentials Required</span>
                      </div>
                      <p>
                        To open live Plaid bank login, add <code className="font-mono font-bold">PLAID_CLIENT_ID</code> and <code className="font-mono font-bold">PLAID_SECRET</code> to your environment Secrets (Sandbox and 10-Item Production Trial are free from Plaid). Meanwhile, you can use the fallback export below.
                      </p>
                    </div>
                  )}

                  {plaidError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">
                      {plaidError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLaunchPlaid}
                    disabled={isCreatingLinkToken || isExchangingToken}
                    className="w-full py-3 px-4 rounded-xl bg-[#F9F45D] hover:brightness-105 text-[#1d1a27] font-extrabold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isCreatingLinkToken || isExchangingToken ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {isExchangingToken
                            ? 'Importing Accounts & Transactions...'
                            : 'Opening Secure Bank Login...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 stroke-[2.25]" />
                        <span>Continue to Bank Login (Plaid)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Fallback Option — Explicitly Not Recommended */}
                <div className="pt-2 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#6e6b7b] font-semibold uppercase tracking-wider">
                    <span>Fallback Option · Not Recommended</span>
                    <span>Manual Updates Only</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLinkMode('fallback-statement')}
                    className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-300 transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-bold text-[#101010] flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#6e6b7b] shrink-0" />
                        <span>User-Initiated Statement Export (100% Free Forever)</span>
                      </div>
                      <p className="text-[11px] text-[#6e6b7b] leading-snug">
                        Only use if your institution isn&apos;t on Plaid or you prefer manual file exports. Download CSV, OFX, QFX, or PDF from your bank&apos;s site and upload it here.
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6e6b7b] shrink-0" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setLinkMode('fallback-manual')}
                      className="text-[11px] text-[#6e6b7b] hover:text-[#101010] underline cursor-pointer"
                    >
                      Or add an account balance manually without transactions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: FALLBACK STATEMENT EXPORT (100% FREE FOREVER) */}
            {linkMode === 'fallback-statement' && (
              <form onSubmit={handleConfirmStatementImport} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkMode('recommended')}
                    className="text-xs font-bold text-[#4b4856] hover:text-[#101010] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Recommended (Plaid)</span>
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Fallback · Not Recommended
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-[11px] text-[#4b4856] space-y-1.5">
                  <div className="font-bold text-[#101010]">
                    User-Initiated Statement Export (100% Free Forever)
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 leading-relaxed">
                    <li>Log in to your Canadian bank&apos;s website in another tab.</li>
                    <li>
                      Download your recent activity as <strong>CSV, OFX, or QFX</strong> (parses 100% locally in your browser) or <strong>PDF</strong>.
                    </li>
                    <li>Upload the exported file below to import transactions and update your balance.</li>
                  </ol>
                </div>

                {/* Destination Account Toggle */}
                {bankAccounts.length > 0 && (
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStatementTargetMode('new')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                        statementTargetMode === 'new'
                          ? 'bg-white text-[#101010] shadow-xs border border-slate-300'
                          : 'text-[#6e6b7b] hover:text-[#101010]'
                      }`}
                    >
                      New Linked Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatementTargetMode('existing')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                        statementTargetMode === 'existing'
                          ? 'bg-white text-[#101010] shadow-xs border border-slate-300'
                          : 'text-[#6e6b7b] hover:text-[#101010]'
                      }`}
                    >
                      Update Existing Account
                    </button>
                  </div>
                )}

                {statementTargetMode === 'existing' && bankAccounts.length > 0 ? (
                  <FloatingSelect
                    label="Select Existing Account to Refresh"
                    value={selectedExistingId}
                    onChange={(e) => setSelectedExistingId(e.target.value)}
                    options={bankAccounts.map((acc) => ({
                      value: acc.id,
                      label: `${acc.name} (${acc.institution} · ${acc.accountMask})`
                    }))}
                  />
                ) : (
                  <div className="space-y-3">
                    <FloatingSelect
                      label="Financial Institution"
                      value={statementInstitution}
                      onChange={(e) => {
                        setStatementInstitution(e.target.value);
                        setStatementAccountName(`${e.target.value.split(' ')[0]} Chequing`);
                      }}
                      options={SUPPORTED_INSTITUTIONS.map((inst) => ({
                        value: inst,
                        label: inst
                      }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FloatingInput
                        label="Account Nickname"
                        value={statementAccountName}
                        onChange={(e) => setStatementAccountName(e.target.value)}
                        required
                      />
                      <FloatingSelect
                        label="Account Type"
                        value={statementAccountType}
                        onChange={(e) => setStatementAccountType(e.target.value as any)}
                        options={[
                          { value: 'Chequing', label: 'Chequing' },
                          { value: 'Savings', label: 'Savings' },
                          { value: 'Credit Card', label: 'Credit Card' },
                          { value: 'Rent Savings', label: 'Rent Savings' }
                        ]}
                      />
                    </div>
                  </div>
                )}

                {/* File Dropzone */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.ofx,.qfx,.pdf,text/csv,application/pdf"
                    onChange={handleStatementFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingStatement}
                    className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-[#8c93fc] bg-[#fbf9f5] hover:bg-[#f4f1ff] transition flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    {isParsingStatement ? (
                      <>
                        <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin" />
                        <span className="text-xs font-bold text-[#101010]">
                          Parsing {statementFileName}...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-[#6366f1]" />
                        <span className="text-xs font-bold text-[#101010]">
                          {statementFileName
                            ? `Selected: ${statementFileName} (Click to replace)`
                            : 'Choose Statement File (.CSV, .OFX, .QFX, or .PDF)'}
                        </span>
                        <span className="text-[11px] text-[#6e6b7b]">
                          CSV / OFX / QFX files parse 100% locally in your browser
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {statementError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">
                    {statementError}
                  </div>
                )}

                {parsedPreview && parsedPreview.transactions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-[#2d2a37] space-y-3">
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#101010]">
                      <span>Ready to Import ({parsedPreview.format.toUpperCase()})</span>
                      <span className="text-emerald-700 tabular-nums">
                        {parsedPreview.transactions.length} transactions found
                      </span>
                    </div>

                    {parsedPreview.warnings.length > 0 && (
                      <p className="text-[11px] text-amber-800">
                        {parsedPreview.warnings[0]}
                      </p>
                    )}

                    <FloatingInput
                      type="number"
                      step="0.01"
                      prefix="$"
                      label="Ending Statement Balance (CAD)"
                      value={statementBalance}
                      onChange={(e) => setStatementBalance(e.target.value)}
                    />
                  </div>
                )}

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
                    disabled={!parsedPreview || parsedPreview.transactions.length === 0}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-white font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    Import Statement &amp; Link Account
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: MANUAL BALANCE ENTRY FALLBACK */}
            {linkMode === 'fallback-manual' && (
              <form onSubmit={handleCreateManual} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkMode('recommended')}
                    className="text-xs font-bold text-[#4b4856] hover:text-[#101010] flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Recommended (Plaid)</span>
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6b7b]">
                    Manual Entry
                  </span>
                </div>

                <FloatingSelect
                  label="Financial Institution"
                  value={institution}
                  onChange={(e) => {
                    setInstitution(e.target.value);
                    setName(`${e.target.value.split(' ')[0]} Everyday Chequing`);
                  }}
                  options={SUPPORTED_INSTITUTIONS.map((inst) => ({ value: inst, label: inst }))}
                />

                <FloatingInput
                  label="Account Nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <FloatingSelect
                    label="Account Type"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    options={[
                      { value: 'Chequing', label: 'Chequing' },
                      { value: 'Savings', label: 'Savings' },
                      { value: 'Credit Card', label: 'Credit Card' },
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
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
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
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#242031] hover:bg-[#2f2a40] text-white font-bold text-xs border-[1.5px] border-[#101010] shadow-[3px_4px_0px_#000000] active:translate-x-[1px] active:translate-y-[2px] active:shadow-[1px_2px_0px_#000000] transition-all cursor-pointer"
                  >
                    Save Manual Account
                  </button>
                </div>
              </form>
            )}
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
            onClick={(e) => e.stopPropagation()}
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
                onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                required
              />

              <FloatingInput
                type="number"
                step="0.01"
                prefix="$"
                label="Balance (CAD)"
                value={editingAccount.balance}
                onChange={(e) =>
                  setEditingAccount({
                    ...editingAccount,
                    balance: parseFloat(e.target.value) || 0
                  })
                }
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
