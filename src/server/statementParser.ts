import { GoogleGenAI, Type } from '@google/genai';
import type { BankAccount, Transaction } from '../types';
import { inferForm65FromDescription } from '../lib/statementParser';

export interface ServerStatementParseResult {
  success: boolean;
  code?: 'NO_AI_KEY' | 'PARSE_ERROR';
  institution?: string;
  accountName?: string;
  accountType?: BankAccount['accountType'];
  accountMask?: string;
  endingBalance?: number;
  transactions: Array<Omit<Transaction, 'id'>>;
  error?: string;
}

export async function parseBankStatementPdfWithAI(
  fileBase64: string,
  mimeType: string = 'application/pdf',
  userId: string = 'demo-user-chad-001'
): Promise<ServerStatementParseResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');

  if (!apiKey) {
    return {
      success: false,
      code: 'NO_AI_KEY',
      transactions: [],
      error:
        'PDF statement parsing requires a server GEMINI_API_KEY. Please download CSV, OFX, or QFX from your online banking website—those formats parse 100% locally in your browser for free.',
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType,
                  },
                },
                {
                  text: `You are extracting financial statement data for a Canadian personal bankruptcy Form 65 ledger.
Inspect this bank or credit card statement document carefully and extract:
1. institution: Canadian bank/issuer name (e.g. "RBC Royal Bank", "TD Canada Trust", "Neo Financial", "Scotiabank", "BMO", "CIBC", "Tangerine").
2. accountName: Account label on the statement (e.g. "RBC Advantage Banking").
3. accountType: One of "Chequing", "Savings", "Credit Card".
4. accountLast4: Last 4 digits of account number if visible (e.g. "5678").
5. endingBalance: Closing/ending balance in CAD as a number (optional if unclear).
6. transactions: Array of every visible transaction row with:
   - date formatted as "MMM DD, YYYY" (e.g. "Oct 14, 2026")
   - description: concise merchant or transaction description
   - amount: positive numeric CAD dollar value (e.g. 42.19)
   - isIncome: true ONLY if it is a deposit/payroll/credit/refund; false if it is a withdrawal/purchase/debit/fee.

Respond strictly with valid JSON matching the schema.`,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                institution: { type: Type.STRING },
                accountName: { type: Type.STRING },
                accountType: { type: Type.STRING },
                accountLast4: { type: Type.STRING },
                endingBalance: { type: Type.NUMBER },
                transactions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      description: { type: Type.STRING },
                      amount: { type: Type.NUMBER },
                      isIncome: { type: Type.BOOLEAN },
                    },
                    required: ['date', 'description', 'amount', 'isIncome'],
                  },
                },
              },
              required: ['transactions'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        const rawTxs: Array<{
          date?: string;
          description?: string;
          amount?: number;
          isIncome?: boolean;
        }> = Array.isArray(parsed.transactions) ? parsed.transactions : [];

        const mappedTransactions: Array<Omit<Transaction, 'id'>> = rawTxs
          .filter((tx) => typeof tx.amount === 'number' && tx.amount > 0 && tx.description)
          .map((tx) => {
            const signedAmount = tx.isIncome ? Math.abs(tx.amount!) : -Math.abs(tx.amount!);
            const desc = String(tx.description || 'Bank Transaction').slice(0, 90);
            const inferred = inferForm65FromDescription(desc, signedAmount);

            return {
              userId,
              company: desc,
              date: tx.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              amount: Number(Math.abs(tx.amount!).toFixed(2)),
              category: inferred.category,
              form65Category: inferred.form65Category || undefined,
              isCategorized: inferred.isCategorized,
              status: 'cleared',
            };
          });

        const rawType = String(parsed.accountType || '').toLowerCase();
        let accountType: BankAccount['accountType'] = 'Chequing';
        if (rawType.includes('sav')) accountType = 'Savings';
        else if (rawType.includes('credit')) accountType = 'Credit Card';

        return {
          success: true,
          institution: parsed.institution || undefined,
          accountName: parsed.accountName || undefined,
          accountType,
          accountMask: parsed.accountLast4 ? `•••• ${String(parsed.accountLast4).slice(-4)}` : undefined,
          endingBalance:
            typeof parsed.endingBalance === 'number' && Number.isFinite(parsed.endingBalance)
              ? Number(parsed.endingBalance.toFixed(2))
              : undefined,
          transactions: mappedTransactions,
        };
      } catch (err) {
        lastError = err;
        console.warn(`PDF statement model ${model} failed, trying next candidate...`, err);
      }
    }

    throw lastError || new Error('Unable to parse PDF statement');
  } catch (err: any) {
    console.error('PDF bank statement extraction failed:', err);
    return {
      success: false,
      code: 'PARSE_ERROR',
      transactions: [],
      error:
        'Could not extract transactions from this PDF statement. Try exporting CSV, OFX, or QFX from your bank instead.',
    };
  }
}
