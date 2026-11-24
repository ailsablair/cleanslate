import React, { useState, useEffect, useRef } from 'react';
import {
  BankIcon,
  SyncIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  TrendUpIcon,
  TrendDownIcon,
  ShieldCheckeredIcon,
  ExternalLinkIcon,
  UploadIcon,
  ClipboardIcon,
  WarningTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  CloseIcon,
  CancelIcon,
  SaveIcon,
  ArrowRightIcon
} from './ui/CleanSlateIcons';
import { CleanSlateButton } from './ui/CleanSlateButton';
import { usePlaidLink } from 'react-plaid-link';
import { BankAccount, Transaction } from '../types';
import { formatCurrency } from '../lib/formatters';
import {
  parseCsvStatement,
  parseOfxStatement,
  ParsedStatementResult
} from '../lib/statementParser';
import { parsePdfStatementInBrowser } from '../lib/pdfStatementParser';
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
      } else if (ext === 'pdf' || file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const isPdf = ext === 'pdf' || file.type === 'application/pdf';
        let parsedResult: ParsedStatementResult | null = null;
        let shouldTryBrowserPdf = false;

        try {
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

          if (res.status === 404 || res.status === 405 || res.status === 503) {
            if (isPdf) {
              shouldTryBrowserPdf = true;
            } else {
              setStatementError(
                'Image statement OCR requires the live CleanSlate backend server. Please upload a PDF statement instead.'
              );
            }
          } else if (!res.ok) {
            const errPayload = await res.json().catch(() => null);
            setStatementError(
              errPayload?.error ||
                `AI PDF statement parsing failed (HTTP ${res.status}). Please try again.`
            );
          } else {
            const data = await res.json();
            if (!data.success) {
              if (isPdf) {
                shouldTryBrowserPdf = true;
              } else {
                setStatementError(
                  data.error ||
                    'Could not extract transactions from this statement. Please ensure it is a readable bank or credit card statement PDF.'
                );
              }
            } else {
              parsedResult = {
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
            }
          }
        } catch {
          if (isPdf) {
            shouldTryBrowserPdf = true;
          } else {
            setStatementError('Could not reach the statement parsing service.');
          }
        }

        if (shouldTryBrowserPdf && isPdf) {
          const localPdf = await parsePdfStatementInBrowser(file, userId, targetAccId);
          if (localPdf.transactions.length === 0) {
            setStatementError(
              localPdf.warnings[0] ||
                'Could not extract transactions from this PDF statement. Ensure it is a digital bank or credit card PDF.'
            );
          } else {
            parsedResult = localPdf;
          }
        }

        if (parsedResult) {
          setParsedPreview(parsedResult);
          if (parsedResult.institution) setStatementInstitution(parsedResult.institution);
          if (parsedResult.accountName) setStatementAccountName(parsedResult.accountName);
          if (parsedResult.accountType) setStatementAccountType(parsedResult.accountType);
          if (parsedResult.accountMask) setStatementMask(parsedResult.accountMask);
          if (parsedResult.endingBalance !== undefined) setStatementBalance(String(parsedResult.endingBalance));
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
            <CheckIcon className="w-4 h-4 shrink-0" />
            <span>{statusBanner.message}</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateToCategorize && statusBanner.type === 'success' && (
              <CleanSlateButton
                variant="white"
                size="xs"
                rightIcon={ArrowRightIcon}
                onClick={onNavigateToCategorize}
              >
                Review in Categorize
              </CleanSlateButton>
            )}
            <CleanSlateButton
              variant="white"
              size="icon"
              onClick={() => setStatusBanner(null)}
              aria-label="Dismiss notification"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </CleanSlateButton>
          </div>
        </div>
      )}

      {/* Overview Card: Purpose, Reassurance & Key Actions */}
      <div className="bg-[#fbf9f5] text-[#101010] rounded-3xl p-6 sm:p-8 border-[1.5px] border-[#101010] shadow-[5px_6px_0px_#000000]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-[#8c93fc]/25">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <BankIcon className="w-5 h-5 text-[#8c93fc] shrink-0" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#101010] tracking-wide uppercase">
                BANK ACCOUNTS &amp; STATEMENT FEEDS
              </h2>
            </div>
            <p className="text-xs text-[#4b4856] max-w-2xl leading-relaxed">
              Connect your Canadian bank directly through Plaid&apos;s encrypted login redirect so balances and transactions sync automatically into your Form 65 reports. CleanSlate only receives read-only access—funds can never be moved or withdrawn.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <CleanSlateButton
              variant="dark-periwinkle"
              size="md"
              leftIcon={SyncIcon}
              onClick={onSyncAll}
              disabled={isSyncing}
              title="Refresh balances and transactions from connected accounts"
            >
              {isSyncing ? 'Syncing Feeds...' : 'Sync All Feeds'}
            </CleanSlateButton>

            <CleanSlateButton
              variant="yellow"
              size="md"
              leftIcon={PlusIcon}
              onClick={() => openLinkAccountModal('recommended')}
            >
              Link Account
            </CleanSlateButton>
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
                  <CheckIcon className="w-3 h-3" />
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
                <ShieldCheckeredIcon className="w-4 h-4 text-[#46e3a5] shrink-0" />
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <CleanSlateButton
                    variant="white"
                    size="icon"
                    onClick={() => setEditingAccount(account)}
                    title="Edit Name & Balance"
                    aria-label={`Edit ${account.name}`}
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </CleanSlateButton>
                  <CleanSlateButton
                    variant="status-error"
                    size="icon"
                    onClick={() => onDeleteAccount(account.id)}
                    title="Disconnect Account"
                    aria-label={`Disconnect ${account.name}`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </CleanSlateButton>
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
                    <TrendUpIcon className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <TrendDownIcon className="w-4 h-4 text-rose-600" />
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
                  <CleanSlateButton
                    variant="white"
                    size="xs"
                    leftIcon={UploadIcon}
                    onClick={() => openLinkAccountModal('fallback-statement', account.id)}
                    title="Upload an updated CSV/OFX/QFX/PDF export from your bank"
                  >
                    Update Statement
                  </CleanSlateButton>
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
              <CleanSlateButton
                variant="white"
                size="icon"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close link account modal"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </CleanSlateButton>
            </div>

            {/* MODE 1: RECOMMENDED (PLAID ONLINE BANKING REDIRECT) */}
            {linkMode === 'recommended' && (
              <div className="space-y-5">
                {/* Primary Recommended Option */}
                <div className="bg-[#fbf9f5] border-[1.5px] border-[#101010] shadow-[4px_5px_0px_#a5a7fb] rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        <ShieldCheckeredIcon className="w-4 h-4 shrink-0" />
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
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Automatic balance updates</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Auto-pulls monthly transactions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <LockIcon className="w-3.5 h-3.5 text-[#8c93fc] shrink-0" />
                      <span>Bank-level read-only OAuth</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Free Sandbox / 10-Account Trial</span>
                    </div>
                  </div>

                  {plaidStatus && !plaidStatus.configured && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[11px] leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <WarningTriangleIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
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

                  <CleanSlateButton
                    variant="yellow"
                    size="lg"
                    fullWidth
                    leftIcon={isCreatingLinkToken || isExchangingToken ? SyncIcon : ExternalLinkIcon}
                    onClick={handleLaunchPlaid}
                    disabled={isCreatingLinkToken || isExchangingToken}
                  >
                    {isExchangingToken
                      ? 'Importing Accounts & Transactions...'
                      : isCreatingLinkToken
                      ? 'Opening Secure Bank Login...'
                      : 'Continue to Bank Login (Plaid)'}
                  </CleanSlateButton>
                </div>

                {/* Secondary Fallback Option — Explicitly Not Recommended */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#6e6b7b] font-semibold uppercase tracking-wider">
                    <span>Fallback Option · Not Recommended</span>
                    <span>Manual Updates Only</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-3">
                    <p className="text-[11px] text-[#6e6b7b] leading-snug">
                      Only use if your institution isn&apos;t on Plaid or you prefer manual file exports. Download CSV, OFX, QFX, or PDF from your bank&apos;s site and upload it here.
                    </p>
                    <CleanSlateButton
                      variant="white"
                      size="md"
                      fullWidth
                      leftIcon={ClipboardIcon}
                      rightIcon={ChevronRightIcon}
                      onClick={() => setLinkMode('fallback-statement')}
                    >
                      User-Initiated Statement Export (100% Free)
                    </CleanSlateButton>
                  </div>

                  <CleanSlateButton
                    variant="white"
                    size="xs"
                    fullWidth
                    onClick={() => setLinkMode('fallback-manual')}
                  >
                    Or Add Account Balance Manually
                  </CleanSlateButton>
                </div>
              </div>
            )}

            {/* MODE 2: FALLBACK STATEMENT EXPORT (100% FREE FOREVER) */}
            {linkMode === 'fallback-statement' && (
              <form onSubmit={handleConfirmStatementImport} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <CleanSlateButton
                    variant="white"
                    size="xs"
                    leftIcon={ChevronLeftIcon}
                    onClick={() => setLinkMode('recommended')}
                  >
                    Back to Recommended (Plaid)
                  </CleanSlateButton>
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
                      Download your monthly bank or credit card statement as a <strong>PDF</strong> (AI extracts &amp; auto-categorizes transactions) or CSV / OFX / QFX.
                    </li>
                    <li>Upload the exported file below to import transactions and update your balance.</li>
                  </ol>
                </div>

                {/* Destination Account Toggle */}
                {bankAccounts.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <CleanSlateButton
                      variant={statementTargetMode === 'new' ? 'dark' : 'white'}
                      size="xs"
                      fullWidth
                      onClick={() => setStatementTargetMode('new')}
                    >
                      New Linked Account
                    </CleanSlateButton>
                    <CleanSlateButton
                      variant={statementTargetMode === 'existing' ? 'dark' : 'white'}
                      size="xs"
                      fullWidth
                      onClick={() => setStatementTargetMode('existing')}
                    >
                      Update Existing Account
                    </CleanSlateButton>
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
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !isParsingStatement && fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isParsingStatement) {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-[#8c93fc] bg-[#fbf9f5] hover:bg-[#f4f1ff] transition flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    {isParsingStatement ? (
                      <>
                        <SyncIcon className="w-5 h-5 text-[#6366f1] animate-spin" />
                        <span className="text-xs font-bold text-[#101010]">
                          Parsing {statementFileName}...
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-5 h-5 text-[#6366f1]" />
                        <span className="text-xs font-bold text-[#101010]">
                          {statementFileName
                            ? `Selected: ${statementFileName} (Click to replace)`
                            : 'Choose PDF Statement (or CSV / OFX / QFX)'}
                        </span>
                        <span className="text-[11px] text-[#6e6b7b]">
                          PDF statements are extracted &amp; auto-categorized by AI
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {statementError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">
                    {statementError}
                  </div>
                )}

                {parsedPreview && parsedPreview.transactions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#fbf9f5] border border-[#2d2a37] space-y-3">
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#101010] gap-2">
                      <span>Ready to Import ({parsedPreview.format.toUpperCase()})</span>
                      <span className="text-emerald-700 tabular-nums">
                        {parsedPreview.transactions.length} transactions found
                      </span>
                    </div>

                    {(() => {
                      const uncertainCount = parsedPreview.transactions.filter(
                        (t) => !t.isCategorized || t.needsConfirmation
                      ).length;
                      if (uncertainCount === 0) return null;
                      return (
                        <p className="text-[11px] font-semibold text-[#34314C] bg-[#AEBBFD]/35 border border-[#101010]/15 rounded-xl px-3 py-2">
                          {uncertainCount} item{uncertainCount === 1 ? '' : 's'} with uncertain categories will open in your 1-by-1 Confirm Queue after import so deductions are accurate.
                        </p>
                      );
                    })()}

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
                  <CleanSlateButton
                    variant="white"
                    size="md"
                    leftIcon={CancelIcon}
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </CleanSlateButton>
                  <CleanSlateButton
                    type="submit"
                    variant="dark-yellow"
                    size="md"
                    leftIcon={UploadIcon}
                    disabled={!parsedPreview || parsedPreview.transactions.length === 0}
                    className="flex-1"
                  >
                    Import Statement &amp; Link Account
                  </CleanSlateButton>
                </div>
              </form>
            )}

            {/* MODE 3: MANUAL BALANCE ENTRY FALLBACK */}
            {linkMode === 'fallback-manual' && (
              <form onSubmit={handleCreateManual} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <CleanSlateButton
                    variant="white"
                    size="xs"
                    leftIcon={ChevronLeftIcon}
                    onClick={() => setLinkMode('recommended')}
                  >
                    Back to Recommended (Plaid)
                  </CleanSlateButton>
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
                  <CleanSlateButton
                    variant="white"
                    size="md"
                    leftIcon={CancelIcon}
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </CleanSlateButton>
                  <CleanSlateButton
                    type="submit"
                    variant="dark-yellow"
                    size="md"
                    leftIcon={SaveIcon}
                    className="flex-1"
                  >
                    Save Manual Account
                  </CleanSlateButton>
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
              <CleanSlateButton
                variant="white"
                size="icon"
                onClick={() => setEditingAccount(null)}
                aria-label="Close edit account modal"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </CleanSlateButton>
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
                <CleanSlateButton
                  variant="white"
                  size="md"
                  leftIcon={CancelIcon}
                  onClick={() => setEditingAccount(null)}
                >
                  Cancel
                </CleanSlateButton>
                <CleanSlateButton
                  type="submit"
                  variant="dark-yellow"
                  size="md"
                  leftIcon={SaveIcon}
                  className="flex-1"
                >
                  Save Changes
                </CleanSlateButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
