import fs from 'fs';
import path from 'path';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  AccountBase,
  Transaction as PlaidTransaction,
  RemovedTransaction,
} from 'plaid/legacy';
import type { BankAccount, Transaction } from '../types';
import { inferForm65FromDescription } from '../lib/statementParser';

interface StoredPlaidItem {
  itemId: string;
  userId: string;
  accessToken: string;
  institutionName: string;
  cursor?: string;
  createdAt: string;
  lastSyncedAt?: string;
  cachedAccounts?: BankAccount[];
  cachedTransactions?: Transaction[];
}

const ITEMS_STORE_PATH = path.resolve(process.cwd(), '.plaid-items.json');

function loadStoredItems(): Record<string, StoredPlaidItem> {
  try {
    if (!fs.existsSync(ITEMS_STORE_PATH)) return {};
    const raw = fs.readFileSync(ITEMS_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('Could not read .plaid-items.json:', err);
    return {};
  }
}

function saveStoredItems(items: Record<string, StoredPlaidItem>): void {
  try {
    fs.writeFileSync(ITEMS_STORE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist .plaid-items.json:', err);
  }
}

function getPlaidEnvKey(): 'sandbox' | 'production' {
  const raw = (process.env.PLAID_ENV || 'sandbox').toLowerCase().trim();
  if (raw === 'production' || raw === 'development') return 'production';
  return 'sandbox';
}

function getPlaidClient(): PlaidApi | null {
  const clientId = process.env.PLAID_CLIENT_ID?.trim();
  const secret = process.env.PLAID_SECRET?.trim();
  if (!clientId || !secret) return null;

  const envKey = getPlaidEnvKey();
  const configuration = new Configuration({
    basePath: PlaidEnvironments[envKey],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });
  return new PlaidApi(configuration);
}

export function getPlaidStatus(userId?: string): {
  configured: boolean;
  env: string;
  connectedItemsCount: number;
} {
  const clientId = Boolean(process.env.PLAID_CLIENT_ID?.trim());
  const secret = Boolean(process.env.PLAID_SECRET?.trim());
  const items = Object.values(loadStoredItems());
  const userItems = userId ? items.filter((i) => i.userId === userId) : items;

  return {
    configured: clientId && secret,
    env: getPlaidEnvKey(),
    connectedItemsCount: userItems.length,
  };
}

function resolveHttpsRedirectUri(clientRedirectUri?: string): string | undefined {
  const candidates = [
    process.env.PLAID_REDIRECT_URI?.trim(),
    clientRedirectUri?.trim(),
    process.env.APP_URL?.trim(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:') {
        // Strip transient query/hash params while preserving base path (e.g. / or /cleanslate/)
        return `${url.origin}${url.pathname}`;
      }
    } catch {
      // Ignore invalid URL strings
    }
  }
  return undefined;
}

export async function createPlaidLinkToken(
  userId: string,
  clientRedirectUri?: string
): Promise<{
  configured: boolean;
  link_token?: string;
  expiration?: string;
  env: string;
  error?: string;
}> {
  const client = getPlaidClient();
  const env = getPlaidEnvKey();

  if (!client) {
    return {
      configured: false,
      env,
      error:
        'Plaid credentials (PLAID_CLIENT_ID and PLAID_SECRET) are not configured on the server yet.',
    };
  }

  const redirectUri = resolveHttpsRedirectUri(clientRedirectUri);

  const response = await client.linkTokenCreate({
    user: {
      client_user_id: userId || 'demo-user-chad-001',
    },
    client_name: 'CleanSlate',
    products: [Products.Transactions],
    transactions: {
      days_requested: env === 'sandbox' ? 365 : 90,
    },
    country_codes:
      env === 'sandbox' ? [CountryCode.Ca, CountryCode.Us] : [CountryCode.Ca],
    language: 'en',
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
  });

  return {
    configured: true,
    env,
    link_token: response.data.link_token,
    expiration: response.data.expiration,
  };
}

function mapPlaidAccountType(account: AccountBase): BankAccount['accountType'] {
  const subtype = String(account.subtype || '').toLowerCase();
  const type = String(account.type || '').toLowerCase();
  const name = String(account.name || '').toLowerCase();

  if (type === 'credit' || subtype.includes('credit')) return 'Credit Card';
  if (subtype.includes('savings') || subtype.includes('tfsa') || subtype.includes('gic')) {
    if (name.includes('rent')) return 'Rent Savings';
    if (name.includes('tax')) return 'Tax Buffer';
    return 'Savings';
  }
  return 'Chequing';
}

function mapPlaidAccounts(
  accounts: AccountBase[],
  userId: string,
  itemId: string,
  institutionName: string
): BankAccount[] {
  const nowLabel = `Just now (${new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })})`;

  return accounts.map((acc) => {
    const balanceVal =
      acc.balances.current ?? acc.balances.available ?? 0;
    const accountType = mapPlaidAccountType(acc);

    return {
      id: `plaid-${acc.account_id}`,
      userId,
      institution: institutionName || 'Canadian Financial Institution',
      name: (acc.name || acc.official_name || `${institutionName} ${accountType}`).toUpperCase(),
      accountMask: acc.mask ? `•••• ${acc.mask}` : '•••• ----',
      accountType,
      balance: Number(balanceVal.toFixed(2)),
      currency: acc.balances.iso_currency_code || 'CAD',
      lastSyncedAt: nowLabel,
      status: 'connected',
      trendDirection: balanceVal >= 0 ? 'up' : 'down',
      connectionType: 'plaid',
      plaidItemId: itemId,
      plaidAccountId: acc.account_id,
    };
  });
}

function formatPlaidDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    }
  }
  return isoDate;
}

function mapPlaidTransactions(
  plaidTxs: PlaidTransaction[],
  userId: string
): Transaction[] {
  return plaidTxs.map((tx) => {
    // In Plaid: positive amount = money leaving account (expense); negative = deposit/refund (income)
    const isIncome = tx.amount < 0;
    const signedForForm65 = isIncome ? Math.abs(tx.amount) : -Math.abs(tx.amount);
    const description = tx.merchant_name || tx.name || 'Bank Transaction';
    const inferred = inferForm65FromDescription(description, signedForForm65);

    return {
      id: `plaid-${tx.transaction_id}`,
      userId,
      accountId: `plaid-${tx.account_id}`,
      company: description.slice(0, 90),
      date: formatPlaidDate(tx.date),
      amount: Number(Math.abs(tx.amount).toFixed(2)),
      category: inferred.category,
      form65Category: inferred.form65Category || undefined,
      isCategorized: inferred.isCategorized,
      needsConfirmation: inferred.needsConfirmation,
      confidenceScore: inferred.confidenceScore,
      confirmationReason: inferred.confirmationReason,
      requiresProof: inferred.requiresProof,
      status: tx.pending ? 'pending' : 'cleared',
    };
  });
}

async function pullTransactionsSync(
  client: PlaidApi,
  item: StoredPlaidItem
): Promise<{
  addedTransactions: Transaction[];
  removedTransactionIds: string[];
  nextCursor: string | undefined;
}> {
  let cursor = item.cursor;
  let hasMore = true;
  const addedRaw: PlaidTransaction[] = [];
  const removedIds: string[] = [];
  let guard = 0;

  const maxPages = getPlaidEnvKey() === 'sandbox' ? 12 : 5;
  while (hasMore && guard < maxPages) {
    guard++;
    const syncRes = await client.transactionsSync({
      access_token: item.accessToken,
      ...(cursor ? { cursor } : {}),
      count: 100,
    });
    addedRaw.push(...syncRes.data.added, ...syncRes.data.modified);
    removedIds.push(
      ...syncRes.data.removed
        .map((r: RemovedTransaction) => r.transaction_id)
        .filter(Boolean)
        .map((id) => `plaid-${id}`)
    );
    cursor = syncRes.data.next_cursor;
    hasMore = syncRes.data.has_more;
  }

  return {
    addedTransactions: mapPlaidTransactions(addedRaw, item.userId),
    removedTransactionIds: removedIds,
    nextCursor: cursor,
  };
}

async function hydrateAndStoreAccessToken(
  client: PlaidApi,
  accessToken: string,
  knownItemId: string | undefined,
  userId: string,
  institutionName?: string
): Promise<{
  itemId: string;
  institutionName: string;
  accounts: BankAccount[];
  transactions: Transaction[];
}> {
  const accountsRes = await client.accountsGet({
    access_token: accessToken,
  });

  const itemId = knownItemId || accountsRes.data.item?.item_id || `sandbox-${Date.now()}`;
  let resolvedInstitution = institutionName?.trim() || '';

  if (!resolvedInstitution && accountsRes.data.item?.institution_id) {
    const countryOrder: CountryCode[][] =
      getPlaidEnvKey() === 'sandbox'
        ? [[CountryCode.Ca], [CountryCode.Us]]
        : [[CountryCode.Ca]];
    for (const codes of countryOrder) {
      try {
        const instRes = await client.institutionsGetById({
          institution_id: accountsRes.data.item.institution_id,
          country_codes: codes,
        });
        if (instRes.data.institution.name) {
          resolvedInstitution = instRes.data.institution.name;
          break;
        }
      } catch {
        // Try next country code fallback
      }
    }
  }
  if (!resolvedInstitution) {
    resolvedInstitution =
      getPlaidEnvKey() === 'sandbox' ? 'First Platypus Bank (Sandbox)' : 'Canadian Bank';
  }

  const storedItem: StoredPlaidItem = {
    itemId,
    userId: userId || 'demo-user-chad-001',
    accessToken,
    institutionName: resolvedInstitution,
    createdAt: new Date().toISOString(),
  };

  let transactions: Transaction[] = [];
  try {
    const syncResult = await pullTransactionsSync(client, storedItem);
    transactions = syncResult.addedTransactions;
    storedItem.cursor = syncResult.nextCursor;
    storedItem.lastSyncedAt = new Date().toISOString();
  } catch (err) {
    console.warn('Initial Plaid transactionsSync note:', err);
  }

  const mappedAccounts = mapPlaidAccounts(
    accountsRes.data.accounts,
    storedItem.userId,
    itemId,
    resolvedInstitution
  );

  storedItem.cachedAccounts = mappedAccounts;
  storedItem.cachedTransactions = transactions;

  const allItems = loadStoredItems();
  allItems[itemId] = storedItem;
  saveStoredItems(allItems);

  return {
    itemId,
    institutionName: resolvedInstitution,
    accounts: mappedAccounts,
    transactions,
  };
}

export async function exchangePlaidPublicToken(
  publicToken: string,
  userId: string,
  institutionName?: string
): Promise<{
  itemId: string;
  institutionName: string;
  accounts: BankAccount[];
  transactions: Transaction[];
}> {
  const client = getPlaidClient();
  if (!client) {
    throw new Error('Plaid credentials are not configured on the server.');
  }

  const exchangeRes = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });

  return hydrateAndStoreAccessToken(
    client,
    exchangeRes.data.access_token,
    exchangeRes.data.item_id,
    userId,
    institutionName
  );
}

export async function connectSandboxAccessToken(
  accessToken: string,
  userId: string,
  institutionName?: string
): Promise<{
  itemId: string;
  institutionName: string;
  accounts: BankAccount[];
  transactions: Transaction[];
}> {
  if (getPlaidEnvKey() !== 'sandbox') {
    throw new Error('Direct Sandbox token linking is disabled outside the Sandbox environment.');
  }

  const trimmed = accessToken.trim();
  if (!trimmed.startsWith('access-sandbox-')) {
    throw new Error('Only Plaid Sandbox access tokens (access-sandbox-...) are accepted.');
  }

  const client = getPlaidClient();
  if (!client) {
    throw new Error('Plaid credentials are not configured on the server.');
  }

  return hydrateAndStoreAccessToken(client, trimmed, undefined, userId, institutionName);
}

export function getCachedPlaidDataForUser(userId?: string): {
  configured: boolean;
  env: string;
  itemCount: number;
  accounts: BankAccount[];
  transactions: Transaction[];
} {
  const clientId = Boolean(process.env.PLAID_CLIENT_ID?.trim());
  const secret = Boolean(process.env.PLAID_SECRET?.trim());
  const allItems = loadStoredItems();
  const targetItems = Object.values(allItems).filter(
    (item) => !userId || item.userId === userId
  );

  const accounts: BankAccount[] = [];
  const transactions: Transaction[] = [];
  for (const item of targetItems) {
    if (Array.isArray(item.cachedAccounts)) accounts.push(...item.cachedAccounts);
    if (Array.isArray(item.cachedTransactions)) transactions.push(...item.cachedTransactions);
  }

  return {
    configured: clientId && secret,
    env: getPlaidEnvKey(),
    itemCount: targetItems.length,
    accounts,
    transactions,
  };
}

export async function syncPlaidItemsForUser(userId?: string): Promise<{
  configured: boolean;
  itemCount: number;
  accounts: BankAccount[];
  addedTransactions: Transaction[];
  removedTransactionIds: string[];
  syncedAt: string;
}> {
  const client = getPlaidClient();
  const syncedAt = new Date().toISOString();

  if (!client) {
    return {
      configured: false,
      itemCount: 0,
      accounts: [],
      addedTransactions: [],
      removedTransactionIds: [],
      syncedAt,
    };
  }

  const allItems = loadStoredItems();
  const targetItems = Object.values(allItems).filter(
    (item) => !userId || item.userId === userId
  );

  const accounts: BankAccount[] = [];
  const addedTransactions: Transaction[] = [];
  const removedTransactionIds: string[] = [];

  const SYNC_COOLDOWN_MS = 60_000;
  const nowMs = Date.now();

  for (const item of targetItems) {
    const lastSyncMs = item.lastSyncedAt ? Date.parse(item.lastSyncedAt) : NaN;
    if (!Number.isNaN(lastSyncMs) && nowMs - lastSyncMs < SYNC_COOLDOWN_MS) {
      // Skip redundant Plaid API calls within 60 seconds; return cached account balances at 0 cost
      if (Array.isArray(item.cachedAccounts)) {
        accounts.push(...item.cachedAccounts);
      }
      continue;
    }

    try {
      const accountsRes = await client.accountsGet({
        access_token: item.accessToken,
      });
      const mappedItemAccounts = mapPlaidAccounts(
        accountsRes.data.accounts,
        item.userId,
        item.itemId,
        item.institutionName
      );
      accounts.push(...mappedItemAccounts);

      const txSync = await pullTransactionsSync(client, item);
      addedTransactions.push(...txSync.addedTransactions);
      removedTransactionIds.push(...txSync.removedTransactionIds);

      const removedSet = new Set(txSync.removedTransactionIds);
      const txById = new Map<string, Transaction>(
        (item.cachedTransactions || [])
          .filter((t) => !removedSet.has(t.id))
          .map((t) => [t.id, t])
      );
      for (const tx of txSync.addedTransactions) {
        txById.set(tx.id, tx);
      }

      allItems[item.itemId] = {
        ...item,
        cursor: txSync.nextCursor,
        lastSyncedAt: syncedAt,
        cachedAccounts: mappedItemAccounts,
        cachedTransactions: Array.from(txById.values()),
      };
    } catch (err) {
      console.warn(`Failed syncing Plaid item ${item.itemId}:`, err);
    }
  }

  saveStoredItems(allItems);

  return {
    configured: true,
    itemCount: targetItems.length,
    accounts,
    addedTransactions,
    removedTransactionIds,
    syncedAt,
  };
}

export async function removePlaidItem(itemId: string): Promise<boolean> {
  const allItems = loadStoredItems();
  const existing = allItems[itemId];
  if (!existing) return false;

  const client = getPlaidClient();
  if (client) {
    try {
      await client.itemRemove({ access_token: existing.accessToken });
    } catch {
      // Ignore if token already revoked/expired
    }
  }

  delete allItems[itemId];
  saveStoredItems(allItems);
  return true;
}
