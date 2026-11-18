import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { BankAccount, Transaction } from '../types';
import { inferForm65FromDescription, ParsedStatementResult } from './statementParser';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface BrowserPdfParseResult extends ParsedStatementResult {
  isScannedImagePdf?: boolean;
  pageCount: number;
}

interface PositionedToken {
  x: number;
  y: number;
  text: string;
}

interface PdfRow {
  y: number;
  tokens: PositionedToken[];
  text: string;
}

interface ColumnLayout {
  debitX?: number;
  creditX?: number;
  balanceX?: number;
  amountX?: number;
}

const MONTH_NAME_RE =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

const DATE_AT_START_RE = new RegExp(
  `^(?:(${MONTH_NAME_RE})\\.?\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?|(\\d{1,2})\\s+(${MONTH_NAME_RE})\\.?(?:,?\\s+(\\d{4}))?|(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})|(\\d{1,2})[-/](\\d{1,2})(?:[-/](\\d{2,4}))?)\\b`,
  'i'
);

const MONEY_TOKEN_RE = /(?:\(\s*[-+]?\$?\d{1,3}(?:,\d{3})*\.\d{2}\s*\)|[-+]?\$?\d{1,3}(?:,\d{3})*\.\d{2}(?:\s*(?:CR|DR))?)/gi;

const SUMMARY_SKIP_RE =
  /\b(opening balance|previous balance|closing balance|ending balance|balance forward|carried forward|total deposits|total withdrawals|total debits|total credits|minimum payment|credit limit|available credit|interest rate|annual interest|page \d+ of \d+|continued on next|statement period|account summary)\b/i;

const KNOWN_INSTITUTIONS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\b(rbc|royal bank)\b/i, name: 'RBC Royal Bank' },
  { pattern: /\b(td canada trust|toronto-dominion|td bank)\b/i, name: 'TD Canada Trust' },
  { pattern: /\b(bmo|bank of montreal)\b/i, name: 'BMO Bank of Montreal' },
  { pattern: /\b(scotiabank|bank of nova scotia)\b/i, name: 'Scotiabank' },
  { pattern: /\bcibc\b/i, name: 'CIBC' },
  { pattern: /\btangerine\b/i, name: 'Tangerine' },
  { pattern: /\bsimplii\b/i, name: 'Simplii Financial' },
  { pattern: /\bneo financial\b/i, name: 'Neo Financial' },
  { pattern: /\beq bank\b/i, name: 'EQ Bank' },
  { pattern: /\bdesjardins\b/i, name: 'Desjardins' },
  { pattern: /\bnational bank\b/i, name: 'National Bank' },
  { pattern: /\bpc financial\b/i, name: 'PC Financial' },
  { pattern: /\b(amex|american express)\b/i, name: 'American Express' },
  { pattern: /\bcapital one\b/i, name: 'Capital One' },
  { pattern: /\brogers bank\b/i, name: 'Rogers Bank' },
];

function normalizeMonthIndex(monthStr: string): number {
  const m = monthStr.toLowerCase().slice(0, 3);
  const map: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  return map[m] ?? 0;
}

function formatDateFromMatch(match: RegExpMatchArray, fallbackYear: number): string {
  let d: Date | null = null;
  if (match[1] && match[2]) {
    const year = match[3] ? Number(match[3]) : fallbackYear;
    d = new Date(year, normalizeMonthIndex(match[1]), Number(match[2]));
  } else if (match[4] && match[5]) {
    const year = match[6] ? Number(match[6]) : fallbackYear;
    d = new Date(year, normalizeMonthIndex(match[5]), Number(match[4]));
  } else if (match[7] && match[8] && match[9]) {
    d = new Date(Number(match[7]), Number(match[8]) - 1, Number(match[9]));
  } else if (match[10] && match[11]) {
    let year = fallbackYear;
    if (match[12]) {
      const yNum = Number(match[12]);
      year = yNum < 100 ? 2000 + yNum : yNum;
    }
    const first = Number(match[10]);
    const second = Number(match[11]);
    // Support DD/MM or MM/DD safely
    const month = first > 12 ? second - 1 : first - 1;
    const day = first > 12 ? first : second;
    d = new Date(year, month, day);
  }

  if (d && !isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }
  return match[0].trim();
}

function parseMoneyValue(raw: string): { amount: number; explicitSign: -1 | 0 | 1 } | null {
  const trimmed = raw.trim();
  const isParen = /^\(.*\)$/.test(trimmed);
  const isCR = /\bCR\b/i.test(trimmed);
  const isDR = /\bDR\b/i.test(trimmed);
  const hasMinus = trimmed.includes('-');
  const hasPlus = trimmed.includes('+');

  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;

  let explicitSign: -1 | 0 | 1 = 0;
  if (isParen || isDR || hasMinus) explicitSign = -1;
  else if (isCR || hasPlus) explicitSign = 1;

  return { amount: Number(num.toFixed(2)), explicitSign };
}

function detectColumnHeaders(row: PdfRow): ColumnLayout | null {
  const lower = row.text.toLowerCase();
  const hasAmountHeader = /\b(withdrawal|debit|debits|deposit|credit|credits|amount|balance)\b/.test(lower);
  if (!hasAmountHeader) return null;

  const layout: ColumnLayout = {};
  for (const tok of row.tokens) {
    const t = tok.text.toLowerCase();
    if (/withdrawal|debit/.test(t) && layout.debitX === undefined) layout.debitX = tok.x;
    else if (/deposit|credit/.test(t) && !/card/.test(t) && layout.creditX === undefined) layout.creditX = tok.x;
    else if (/balance/.test(t) && layout.balanceX === undefined) layout.balanceX = tok.x;
    else if (/amount/.test(t) && layout.amountX === undefined) layout.amountX = tok.x;
  }

  if (
    layout.debitX !== undefined ||
    layout.creditX !== undefined ||
    layout.amountX !== undefined
  ) {
    return layout;
  }
  return null;
}

function groupPageItemsIntoRows(items: any[]): PdfRow[] {
  const tokens: PositionedToken[] = [];
  for (const item of items) {
    const text = String(item?.str || '').trim();
    if (!text) continue;
    const transform = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0];
    tokens.push({
      x: Number(transform[4]) || 0,
      y: Number(transform[5]) || 0,
      text,
    });
  }

  // Sort top-to-bottom (higher y first), then left-to-right
  tokens.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 3.5) return b.y - a.y;
    return a.x - b.x;
  });

  const rows: PdfRow[] = [];
  for (const tok of tokens) {
    const lastRow = rows[rows.length - 1];
    if (lastRow && Math.abs(lastRow.y - tok.y) <= 3.5) {
      lastRow.tokens.push(tok);
    } else {
      rows.push({ y: tok.y, tokens: [tok], text: '' });
    }
  }

  for (const row of rows) {
    row.tokens.sort((a, b) => a.x - b.x);
    row.text = row.tokens.map((t) => t.text).join(' ');
  }

  return rows;
}

function inferDirectionFromDescription(desc: string): boolean {
  return /\b(payroll|salary|direct deposit|deposit|payroll dep|refund|reimbursement|interest credit|cash back|cashback|gst|hst|ccb|child tax|employment insurance|ei benefit|e-transfer received|etransfer received|credit memo)\b/i.test(
    desc
  );
}

export async function parsePdfStatementInBrowser(
  file: File,
  userId: string = 'demo-user-chad-001',
  accountId?: string
): Promise<BrowserPdfParseResult> {
  const warnings: string[] = [];
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pageRowsList: PdfRow[][] = [];
  let allTextCombined = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const rows = groupPageItemsIntoRows(textContent.items as any[]);
    pageRowsList.push(rows);
    allTextCombined += rows.map((r) => r.text).join('\n') + '\n';
  }

  const alphaNumericCount = allTextCombined.replace(/[^a-zA-Z0-9]/g, '').length;
  if (alphaNumericCount < 20) {
    return {
      format: 'pdf',
      isScannedImagePdf: true,
      pageCount: pdf.numPages,
      transactions: [],
      warnings: [
        'This PDF appears to be a scanned image without selectable text. Upload a digital bank statement PDF or connect via the live AI server.',
      ],
    };
  }

  // Extract metadata
  let institution: string | undefined;
  for (const entry of KNOWN_INSTITUTIONS) {
    if (entry.pattern.test(allTextCombined)) {
      institution = entry.name;
      break;
    }
  }

  let accountType: BankAccount['accountType'] = 'Chequing';
  if (/\b(credit card|visa|mastercard|american express|amex|minimum payment|statement balance)\b/i.test(allTextCombined)) {
    accountType = 'Credit Card';
  } else if (/\b(savings|high interest|tfsa)\b/i.test(allTextCombined)) {
    accountType = 'Savings';
  }

  const maskMatch = allTextCombined.match(/(?:account|acct|card)\s*(?:number|no\.?|#)?[:\s]*(?:\*+|x+|•+|\d{4}[\s-]*)(\d{4})\b/i);
  const accountMask = maskMatch ? `•••• ${maskMatch[1]}` : undefined;

  const yearMatches = allTextCombined.match(/\b(20[12]\d)\b/g);
  const statementYear = yearMatches && yearMatches.length > 0 ? Number(yearMatches[0]) : new Date().getFullYear();

  const endingMatch = allTextCombined.match(/(?:closing|ending|new)\s+balance[:\s]*\$?([0-9,]+\.\d{2})/i);
  const endingBalance = endingMatch ? parseFloat(endingMatch[1].replace(/,/g, '')) : undefined;

  const transactions: Array<Omit<Transaction, 'id'>> = [];

  for (const rows of pageRowsList) {
    let layout: ColumnLayout | null = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const detectedHeader = detectColumnHeaders(row);
      if (detectedHeader) {
        layout = detectedHeader;
        continue;
      }

      if (SUMMARY_SKIP_RE.test(row.text)) continue;

      const dateMatch = row.text.match(DATE_AT_START_RE);
      if (!dateMatch) continue;

      let candidateText = row.text;
      let candidateTokens = [...row.tokens];

      // If a date row has no monetary amount, merge with the immediate continuation row if it has an amount and no date
      const initialMoneyMatches = candidateText.match(MONEY_TOKEN_RE);
      if ((!initialMoneyMatches || initialMoneyMatches.length === 0) && i + 1 < rows.length) {
        const nextRow = rows[i + 1];
        if (!DATE_AT_START_RE.test(nextRow.text) && MONEY_TOKEN_RE.test(nextRow.text)) {
          MONEY_TOKEN_RE.lastIndex = 0;
          candidateText = `${candidateText} ${nextRow.text}`;
          candidateTokens = [...candidateTokens, ...nextRow.tokens];
          i++;
        }
      }
      MONEY_TOKEN_RE.lastIndex = 0;

      // Also handle inline pipe/multi-transaction lines (e.g. single-row text statements)
      const formattedDate = formatDateFromMatch(dateMatch, statementYear);
      const afterDate = candidateText.slice(dateMatch[0].length).replace(/^[\s|:-]+/, '');

      // Extract money tokens along with their x positions when available
      const moneyMatches = [...afterDate.matchAll(MONEY_TOKEN_RE)];
      if (moneyMatches.length === 0) continue;

      // Determine description by stripping money amounts
      let description = afterDate;
      for (const m of moneyMatches) {
        description = description.replace(m[0], ' ');
      }
      description = description
        .replace(/[|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s\-–—]+|[\s\-–—]+$/g, '')
        .trim();

      if (!description || description.length < 2 || SUMMARY_SKIP_RE.test(description)) continue;

      // Parse all candidate money tokens on this row
      const parsedMoney = moneyMatches
        .map((m) => {
          const val = parseMoneyValue(m[0]);
          if (!val) return null;
          // Match token x position for column classification
          const tokenMatch = candidateTokens.find((t) => t.text.includes(m[0].trim()) || m[0].includes(t.text));
          return { ...val, raw: m[0], x: tokenMatch?.x };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (parsedMoney.length === 0) continue;

      let chosen = parsedMoney[0];
      let isIncome = false;

      if (layout && (layout.debitX !== undefined || layout.creditX !== undefined)) {
        // Filter out token aligned with Balance column if multiple values exist
        const nonBalance = parsedMoney.filter((m) => {
          if (parsedMoney.length === 1 || layout?.balanceX === undefined || m.x === undefined) return true;
          const distBalance = Math.abs(m.x - layout.balanceX);
          const distDebit = layout.debitX !== undefined ? Math.abs(m.x - layout.debitX) : Infinity;
          const distCredit = layout.creditX !== undefined ? Math.abs(m.x - layout.creditX) : Infinity;
          const distAmount = layout.amountX !== undefined ? Math.abs(m.x - layout.amountX) : Infinity;
          return distBalance > Math.min(distDebit, distCredit, distAmount);
        });

        chosen = nonBalance[0] || parsedMoney[0];
        if (chosen.explicitSign !== 0) {
          isIncome = chosen.explicitSign > 0;
        } else if (chosen.x !== undefined && layout.creditX !== undefined && layout.debitX !== undefined) {
          isIncome = Math.abs(chosen.x - layout.creditX) < Math.abs(chosen.x - layout.debitX);
        } else {
          isIncome = inferDirectionFromDescription(description);
        }
      } else {
        // No explicit table column headers detected:
        // If 2+ numbers appear at end of row (e.g. [Amount, Running Balance]), use first amount!
        chosen = parsedMoney[0];
        if (chosen.explicitSign !== 0) {
          isIncome = chosen.explicitSign > 0;
        } else {
          isIncome = inferDirectionFromDescription(description);
        }
      }

      const signedAmount = isIncome ? chosen.amount : -chosen.amount;
      const inferred = inferForm65FromDescription(description, signedAmount);

      transactions.push({
        userId,
        accountId,
        company: description.slice(0, 90),
        date: formattedDate,
        amount: chosen.amount,
        category: inferred.category,
        form65Category: inferred.form65Category || undefined,
        isCategorized: inferred.isCategorized,
        status: 'cleared',
      });
    }
  }

  if (transactions.length === 0) {
    warnings.push(
      'Could not locate standard dated transaction rows inside this PDF. Ensure the file is a bank or credit card statement PDF.'
    );
  }

  return {
    format: 'pdf',
    pageCount: pdf.numPages,
    institution,
    accountName: institution ? `${institution} ${accountType}` : undefined,
    accountType,
    accountMask,
    endingBalance: Number.isFinite(endingBalance) ? endingBalance : undefined,
    transactions,
    warnings,
  };
}
