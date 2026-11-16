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
    country_codes: [CountryCode.Ca],
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

  while (hasMore && guard < 10) {
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

  const accessToken = exchangeRes.data.access_token;
  const itemId = exchangeRes.data.item_id;

  const accountsRes = await client.accountsGet({
    access_token: accessToken,
  });

  let resolvedInstitution = institutionName?.trim() || 'Canadian Bank';
  if (!institutionName && accountsRes.data.item?.institution_id) {
    try {
      const instRes = await client.institutionsGetById({
        institution_id: accountsRes.data.item.institution_id,
        country_codes: [CountryCode.Ca],
      });
      resolvedInstitution = instRes.data.institution.name || resolvedInstitution;
    } catch {
      // Non-fatal fallback
    }
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

  const allItems = loadStoredItems();
  allItems[itemId] = storedItem;
  saveStoredItems(allItems);

  const mappedAccounts = mapPlaidAccounts(
    accountsRes.data.accounts,
    storedItem.userId,
    itemId,
    resolvedInstitution
  );

  return {
    itemId,
    institutionName: resolvedInstitution,
    accounts: mappedAccounts,
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

  for (const item of targetItems) {
    try {
      const accountsRes = await client.accountsGet({
        access_token: item.accessToken,
      });
      accounts.push(
        ...mapPlaidAccounts(
          accountsRes.data.accounts,
          item.userId,
          item.itemId,
          item.institutionName
        )
      );

      const txSync = await pullTransactionsSync(client, item);
      addedTransactions.push(...txSync.addedTransactions);
      removedTransactionIds.push(...txSync.removedTransactionIds);

      allItems[item.itemId] = {
        ...item,
        cursor: txSync.nextCursor,
        lastSyncedAt: syncedAt,
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
