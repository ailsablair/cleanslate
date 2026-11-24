import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { BankAccount, Transaction } from '../types';
import { inferForm65FromDescription } from '../lib/statementParser';
import { normalizeForm65Category } from '../lib/form65Categories';

export interface ServerStatementParseResult {
  success: boolean;
  code?: 'NO_AI_KEY' | 'PARSE_ERROR' | 'API_ERROR';
  institution?: string;
  accountName?: string;
  accountType?: BankAccount['accountType'];
  accountMask?: string;
  endingBalance?: number;
  transactions: Array<Omit<Transaction, 'id'>>;
  error?: string;
}

const VALID_FORM65_CATEGORIES = [
  'Employment Income',
  'Pension/Annuities',
  'Child Support',
  'Spousal Support',
  'Employment Insurance Benefits',
  'Social Assistance',
  'Self-Employment Income',
  'Child Tax Benefit',
  'Other Net Income',
  'Child Support Payments',
  'Spousal Support Payments',
  'Child Care',
  'Medical Condition Expenses',
  'Fines/Penalties Imposed by Court',
  'Expenses as Condition of Employment',
  'Debts Stay Lifted',
  'Rent/Mortgage',
  'Property Taxes & Condo Fees',
  'Heating/Gas/Oil',
  'Telephone',
  'Cable',
  'Hydro',
  'Water',
  'Furniture',
  'Other Housing',
  'Smoking & Tobacco',
  'Alcohol & Beverages',
  'Dining/Lunches/Restaurants',
  'Clothing & Apparel',
  'Grooming & Personal Care',
  'Hobbies & Recreation',
  'Other Personal',
  'Prescriptions',
  'Dental',
  'Food/Grocery',
  'Laundry & Dry Cleaning',
  'Grooming & Toiletries',
  'Clothing',
  'Repair/Maintenance/Gas',
  'Public Transportation',
  'Vehicle',
  'House Insurance',
  'Furniture & Contents Insurance',
  'Life Insurance',
  'To The Estate',
  'To Secured Creditor',
  'Other Payments',
] as const;

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);

export async function parseBankStatementPdfWithAI(
  fileBase64: string,
  mimeType: string = 'application/pdf',
  userId: string = 'demo-user-chad-001'
): Promise<ServerStatementParseResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      success: false,
      code: 'NO_AI_KEY',
      transactions: [],
      error:
        'AI PDF statement parsing requires a valid GEMINI_API_KEY configured in Settings > Secrets.',
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

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'] as const;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const config: any = {
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
                    category: { type: Type.STRING },
                    form65Category: { type: Type.STRING },
                    requiresProof: { type: Type.BOOLEAN },
                    confidence: { type: Type.NUMBER },
                    confidenceReason: { type: Type.STRING },
                  },
                  required: ['date', 'description', 'amount', 'isIncome', 'category', 'form65Category', 'confidence'],
                },
              },
            },
            required: ['transactions'],
          },
        };

        if (model === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const timeoutMs = model === 'gemini-4-hydrogen' ? 24000 : 18000;

        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType,
                  },
                },
                {
                  text: `You are extracting and auto-categorizing financial statement transactions for a Canadian personal bankruptcy Form 65 ledger (Office of the Superintendent of Bankruptcy Canada).
Inspect this PDF/image bank or credit card statement carefully and extract:
1. institution: Canadian bank/issuer name (e.g. "RBC Royal Bank", "TD Canada Trust", "Neo Financial", "Scotiabank", "BMO", "CIBC", "Tangerine").
2. accountName: Account label on the statement (e.g. "RBC Advantage Banking").
3. accountType: One of "Chequing", "Savings", "Credit Card".
4. accountLast4: Last 4 digits of account number if visible (e.g. "5678").
5. endingBalance: Closing/ending balance in CAD as a number (optional if unclear).
6. transactions: Every visible transaction line item (exclude summary/header/opening-balance rows) with:
   - date: formatted as "MMM DD, YYYY" (e.g. "Jan 15, 2026")
   - description: concise merchant or transaction description
   - amount: positive numeric CAD dollar value (e.g. 42.19)
   - isIncome: true ONLY if it is a deposit/payroll/credit/government benefit/refund; false if it is a withdrawal/purchase/debit/fee.
   - category: broad readable category (e.g. "Income", "Government Benefits", "Food & Grocery", "Food & Dining", "Housing", "Utilities", "Transportation", "Healthcare", "Insurance", "Child Care", "Personal", "Payments", "Transfer / Internal").
   - form65Category: MUST be one exact value from: ${VALID_FORM65_CATEGORIES.join(', ')}.
     Mapping tips:
     * Salary/payroll/wages -> "Employment Income"
     * EI/Service Canada -> "Employment Insurance Benefits"
     * Child Tax / CCB -> "Child Tax Benefit"
     * Grocery/supermarket (e.g. Save-On-Foods, Loblaws, Sobeys) -> "Food/Grocery"
     * Restaurants/coffee/Uber Eats/DoorDash/Skip -> "Dining/Lunches/Restaurants"
     * Pharmacy/medical (Shoppers Drug Mart, Rexall, London Drugs, clinics) -> prefer suggesting "Medical Condition Expenses" when it could be non-discretionary condition care, or "Prescriptions", and set confidence < 100 so the client confirms!
     * Gas/fuel/auto repair/mechanic -> "Repair/Maintenance/Gas"
     * Transit/Uber ride/Presto/Compass -> "Public Transportation"
     * Hydro/electricity -> "Hydro"; Enbridge/Fortis -> "Heating/Gas/Oil"; Telus/Rogers/Bell/Fido -> "Telephone"; Internet/TV -> "Cable"
     * Rent/mortgage -> "Rent/Mortgage"
     * Credit card bill payment / internal e-transfer between own accounts -> "Other Payments"
     * Beer/wine/liquor/LCBO/SAQ -> "Alcohol & Beverages"
     * Clothing stores -> "Clothing & Apparel"
   - requiresProof: true if statutory non-discretionary deduction candidate (Child Care, Medical Condition Expenses, Child Support Payments, Spousal Support Payments, Expenses as Condition of Employment, Prescriptions, Dental).
   - confidence: integer 0-100 representing certainty in this Form 65 category.
     CRITICAL ACCURACY RULE FOR DEBTOR PROTECTION:
     * Set confidence = 100 ONLY when 100% certain of both the merchant purpose and statutory Form 65 line (e.g., clearly named utility like BC Hydro, obvious grocery supermarket like Save-On-Foods, clear employer payroll).
     * Set confidence between 40 and 85 (NOT 100!) whenever there is ANY doubt so the transaction enters the 1-by-1 Confirm Queue:
       - Pharmacies, clinics, dental, childcare, or potential work-related purchases (could qualify as Non-Discretionary deductions that help the bankrupt client retain more of their earnings!).
       - Mixed retailers (Walmart, Costco, Amazon, Canadian Tire, Dollarama).
       - E-transfers, vague codes, generic deposits, repairs, or subscriptions.
   - confidenceReason: concise 1-sentence explanation for the user when confidence < 100 (especially noting Non-Discretionary deduction opportunities when relevant).

Respond strictly with valid JSON matching the schema.`,
                },
              ],
            },
            config,
          }),
          timeoutMs,
          model
        );

        const parsed = JSON.parse(response.text || '{}');
        const rawTxs: Array<{
          date?: string;
          description?: string;
          amount?: number;
          isIncome?: boolean;
          category?: string;
          form65Category?: string;
          requiresProof?: boolean;
          confidence?: number;
          confidenceReason?: string;
        }> = Array.isArray(parsed.transactions) ? parsed.transactions : [];

        const validSet = new Set<string>(VALID_FORM65_CATEGORIES);

        const mappedTransactions: Array<Omit<Transaction, 'id'>> = rawTxs
          .filter((tx) => typeof tx.amount === 'number' && tx.amount > 0 && tx.description)
          .map((tx) => {
            const signedAmount = tx.isIncome ? Math.abs(tx.amount!) : -Math.abs(tx.amount!);
            const desc = String(tx.description || 'Bank Transaction').slice(0, 90);
            const fallback = inferForm65FromDescription(desc, signedAmount);
            const rawAiCategory =
              tx.form65Category && validSet.has(tx.form65Category)
                ? tx.form65Category
                : fallback.form65Category || undefined;
            const aiCategory = rawAiCategory ? normalizeForm65Category(rawAiCategory) : undefined;
            const rawConf =
              typeof tx.confidence === 'number' && Number.isFinite(tx.confidence)
                ? Math.min(100, Math.max(0, Math.round(tx.confidence)))
                : fallback.confidenceScore;
            const isUncertain =
              !aiCategory || rawConf < 100 || fallback.needsConfirmation;

            return {
              userId,
              company: desc,
              date:
                tx.date ||
                new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                }),
              amount: Number(Math.abs(tx.amount!).toFixed(2)),
              category: tx.category || fallback.category,
              form65Category: aiCategory,
              isCategorized: !isUncertain,
              needsConfirmation: isUncertain,
              confidenceScore: rawConf,
              confirmationReason: tx.confidenceReason || fallback.confirmationReason,
              status: 'cleared',
              requiresProof: Boolean(tx.requiresProof || fallback.requiresProof),
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
    const msg = String(err?.message || '');
    const status = err?.status || err?.code;
    if (status === 400 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) {
      return {
        success: false,
        code: 'API_ERROR',
        transactions: [],
        error:
          'Gemini API key was rejected or missing permissions. Please verify your GEMINI_API_KEY in Settings > Secrets.',
      };
    }
    if (status === 429 || /RESOURCE_EXHAUSTED/i.test(msg)) {
      return {
        success: false,
        code: 'API_ERROR',
        transactions: [],
        error: 'Gemini API rate limit reached. Please wait a moment and try uploading the PDF again.',
      };
    }
    return {
      success: false,
      code: 'PARSE_ERROR',
      transactions: [],
      error:
        'Could not extract transactions from this PDF statement. Ensure the file is a readable bank or credit card statement PDF.',
    };
  }
}
