export type KnowledgeSourceType = 'article' | 'study' | 'directive' | 'faq';

export interface LitBotKnowledgeArticle {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  citation?: string;
  content: string;
  isActive: boolean;
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const KNOWLEDGE_STORAGE_KEY = 'cleanslate_litbot_knowledge';

export const DEFAULT_KNOWLEDGE_ARTICLES: LitBotKnowledgeArticle[] = [
  {
    id: 'builtin-cash-gifts',
    title: 'Cash Gifts, Birthday Money, Holiday E-Transfers & Windfalls (Form 65)',
    sourceType: 'directive',
    citation: 'OSB Directive No. 11R2 & BIA Section 67/68 Guidelines',
    content: `How to handle birthday, holiday, or family cash gifts during Canadian personal bankruptcy:
1. Small, occasional modest gifts (like $20-$100 in a birthday card or holiday gift): Usually treated as minor personal gifts, though you should always keep a quick note so your trustee sees where any bank deposit came from if you deposit it.
2. Larger cash gifts, recurring family e-transfers, or lump sums (e.g., several hundred dollars or regular monthly help): Under Form 65 rules, cash funds deposited into your account or given regularly to help cover bills are reported under Section 1: Family Income (Net) -> "Other Net Income" for that month.
3. Why you should disclose honestly: If an unexpected e-transfer or cash deposit shows up on your bank statement and isn't explained, your Licensed Insolvency Trustee (LIT) will ask about it during audit. Reporting it under "Other Net Income" (or telling your trustee it was a one-time modest holiday gift) keeps your file 100% transparent so nothing delays your discharge.
4. Note on major windfalls (inheritances, lottery winnings): Large windfalls received before discharge can vest in the bankruptcy estate under BIA Section 67—always notify your LIT right away before spending them.`,
    isActive: true,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'builtin-medical-vs-rx',
    title: 'Medical Condition Expenses vs. Prescriptions on Form 65',
    sourceType: 'faq',
    citation: 'CleanSlate Plain-English Form 65 Guide',
    content: `Official Form 65 lists medical expenses in two places:
- Medical Condition Expenses (Section 2: Family Non-Discretionary Expenses): Ongoing or chronic medical costs tied to a documented medical condition not covered by provincial health insurance or benefits (insulin, CPAP supplies, doctor-authorized medical cannabis, physio, ongoing condition meds). These REDUCE your surplus income calculation dollar-for-dollar as long as you attach receipts/prescriptions.
- Prescriptions (Section 8: Non-Recoverable Medical Expenses): Routine or one-off pharmacy costs (short-term antibiotics, allergy meds, minor co-pays) tracked inside your normal household budget.
Never enter the same receipt in both categories.`,
    isActive: true,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'builtin-multiple-accounts',
    title: 'Reporting Multiple Bank Accounts, Secured Cards & Internal Transfers',
    sourceType: 'article',
    citation: 'CleanSlate Trustee Reconciliation Best Practices',
    content: `When you have several bank accounts (such as Neo Chequing, Neo Savings for paycheck deposits, a separate Rent Savings account, Secured Credit Cards, and Scotiabank chequing):
- Always combine and total each Form 65 category across ALL accounts combined (Step 2). Never submit separate Form 65 spreadsheets per bank account.
- Count income ONCE when your paycheck or benefit first lands.
- Ignore internal transfers between your own accounts (e.g., moving rent money from Savings to Rent Savings, or paying off your Secured Credit Card balance from Chequing). Paying a credit card bill is a transfer—count the actual purchases (groceries, gas) once when you swipe the card, not twice.`,
    isActive: true,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'builtin-ei-vs-sa',
    title: 'Employment Insurance (EI) Benefits vs. Social Assistance',
    sourceType: 'faq',
    citation: 'OSB Form 65 Section 1 Income Definitions',
    content: `Both are government programs, so people often mix them up:
- Employment Insurance Benefits (EI / Employment Income Benefits): Federal insurance paid through Service Canada that you contributed to via payroll deductions while working (layoff EI, sickness EI, maternity/parental EI).
- Social Assistance: Provincial/territorial needs-based financial support when you have little or no income (e.g., Ontario Works / OW, ODSP, BC Income Assistance / PWD, Alberta Works).
Both go into Section 1: Family Income (Net) — choose the one matching the program paying you.`,
    isActive: true,
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

export function loadKnowledgeArticlesFromStorage(): LitBotKnowledgeArticle[] {
  if (typeof window === 'undefined') return DEFAULT_KNOWLEDGE_ARTICLES;
  try {
    const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(DEFAULT_KNOWLEDGE_ARTICLES));
      return DEFAULT_KNOWLEDGE_ARTICLES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_KNOWLEDGE_ARTICLES;
  } catch {
    return DEFAULT_KNOWLEDGE_ARTICLES;
  }
}

export function saveKnowledgeArticlesToStorage(articles: LitBotKnowledgeArticle[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(articles));
  } catch (err) {
    console.warn('Could not persist LITbot knowledge base locally:', err);
  }
}

export async function syncKnowledgeArticlesToServer(articles: LitBotKnowledgeArticle[]): Promise<void> {
  try {
    await fetch('/api/litbot/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    });
  } catch {
    // Non-fatal if offline; localStorage still persists and chat requests pass articles directly
  }
}

export function findRelevantKnowledge(
  query: string,
  articles: LitBotKnowledgeArticle[],
  maxItems: number = 4
): LitBotKnowledgeArticle[] {
  const active = (articles || []).filter((a) => a && a.isActive && a.content?.trim());
  if (active.length === 0) return [];

  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'how', 'why', 'the', 'and', 'for', 'from',
    'with', 'this', 'that', 'does', 'have', 'your', 'about', 'into', 'they',
    'are', 'can', 'should', 'would', 'could', 'there', 'my', 'me', 'do', 'is', 'in', 'on', 'to', 'of', 'a', 'an'
  ]);

  const tokens = (query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const scored = active.map((article) => {
    const haystack = `${article.title} ${article.citation || ''} ${article.content}`.toLowerCase();
    let score = article.isBuiltIn ? 0 : 2; // slightly prioritize user-uploaded custom articles/studies
    for (const token of tokens) {
      if (article.title.toLowerCase().includes(token)) score += 4;
      if (haystack.includes(token)) score += 2;
    }
    return { article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxItems).map((s) => s.article);
}
