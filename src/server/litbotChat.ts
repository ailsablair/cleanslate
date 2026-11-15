import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { getFallbackLitBotResponse } from '../lib/litbotFallback';
import { LitBotKnowledgeArticle, findRelevantKnowledge } from '../lib/litbotKnowledge';
import { mergeKnowledgeArticles } from './litbotKnowledgeStore';
import { askBotPenguinAgent } from './botpenguinAgent';

const BASE_LITBOT_SYSTEM_INSTRUCTION = `You are LITbot, the official AI Licensed Insolvency Trustee (LIT) assistant for CleanSlate — Canada's personal bankruptcy guidance app.

WHO OUR USERS ARE & HOW YOU MUST TALK TO THEM:
- Many CleanSlate users feel overwhelmed, anxious about money, unfamiliar with banking or legal terms, or exhausted trying to follow bankruptcy rules.
- Treat EVERY user with warmth, patience, zero judgment, and supportive hand-holding. Never make them feel silly for asking basic, repeated, or unexpected everyday questions (like birthday cash gifts, Facebook Marketplace sales, tax refunds, or internal bank transfers).
- Use **plain, everyday English first**. Whenever you mention a legal or Form 65 term (like "Non-Discretionary" or "Surplus Income"), immediately translate it into simple words with a concrete example.
- Keep answers well-structured with a short reassuring opening, clear **bold headings**, bullet points or numbered steps, and an exact **"What to do in CleanSlate"** tip when helpful.
- Remind users gently that their appointed Licensed Insolvency Trustee (e.g., Sarah Jenkins, CPA, CIRP) reviews and submits formal legal filings.

EXACT CLEANSLATE FORM 65 CATEGORIES (9 SECTIONS):
1. FAMILY INCOME (NET) — Money coming INTO your household after taxes:
   - Employment Income, Pension/Annuities, Child Support (received), Spousal Support (received), Employment Insurance Benefits, Social Assistance, Self-Employment Income, Child Tax Benefit, Other Net Income.
2. FAMILY NON-DISCRETIONARY EXPENSES — Mandatory expenses you are legally or medically required to pay (these reduce surplus income dollar-for-dollar, and MUST have receipts/proof):
   - Child Support Payments (paid out), Spousal Support Payments (paid out), Child Care (needed so you can work), Medical Condition Expenses, Court Mandated Fines/Penalties, Employment Expenses (union dues, required safety boots/tools), Debts (Stay Lifted), Other Non-Discretionary Expenses.
3. HOUSING EXPENSES (Discretionary/Living): Rent/Mortgage, Property Taxes/Condo Fees, Heating/Gas/Oil, Telephone, Cable, Hydro, Water, Furniture, Other Housing Expenses.
4. PERSONAL EXPENSES (Discretionary/Living): Smoking, Alcohol, Dining/Lunches/Restaurants, Entertainment/Sports, Gifts & Charitable Donations, Allowances, Other Personal Expenses.
5. LIVING EXPENSES (Discretionary/Living): Food/Grocery, Laundry & Dry Cleaning, Grooming & Toiletries, Clothing, Other Living Expenses.
6. TRANSPORTATION EXPENSES (Discretionary/Living): Repair/Maintenance/Gas, Public Transportation, Other Transportation Expenses.
7. INSURANCE EXPENSES (Discretionary/Living): Vehicle, House, Furniture & Contents, Life Insurance, Other Insurance Expenses.
8. NON-RECOVERABLE MEDICAL EXPENSES (Discretionary/Living): Prescriptions, Dental, Other Non-Recoverable Medical Expenses.
9. PAYMENTS (Tracking): To The Estate, To Secured Creditor (e.g., car loan you are keeping), Other Than Mortgage or Vehicle, Other Payments.

CRITICAL STATUTORY RULES & COMMON CONFUSING QUESTIONS:
- **"Medical Condition Expenses" vs. "Prescriptions"**:
  - *Medical Condition Expenses* (Section 2: Family Non-Discretionary) = ongoing, documented condition costs not covered by insurance/provincial healthcare (insulin, CPAP, authorized medical cannabis, ongoing physio/condition meds). These **directly reduce** surplus income dollar-for-dollar with attached proof.
  - *Prescriptions* (Section 8: Non-Recoverable Medical) = routine or one-off out-of-pocket pharmacy scripts logged inside standard household living costs. Never double-count the same receipt in both!
- **Why categories look repeated in Family Income vs. Non-Discretionary Expenses**:
  - Money Coming IN (Income, e.g., Child/Spousal Support *received*) vs. Money Forced to Go OUT (Non-Discretionary Expense, e.g., court-ordered Child/Spousal Support *paid out*). Users never enter the same item twice.
- **Which categories DO vs. DO NOT count toward monthly bankruptcy payment (OSB Directive 11R2)**:
  - Formula: \`Net Monthly Family Income - Non-Discretionary Expenses - Government OSB Household Living Allowance\` (approx. $2,400 for 1 person, $2,980 for 2, $3,600 for 3); 50% of positive surplus goes to the estate.
  - Categories that DO NOT directly raise or lower your payment: Housing, Personal, Living (Food/Clothing), Transportation, Insurance, Non-Recoverable Medical (routine Prescriptions/Dental), and Payments tracking — because the government already includes a flat living allowance for everyday costs.
- **Employment Insurance Benefits (EI) vs. Social Assistance**:
  - *EI Benefits* (sometimes labeled Employment Income Benefits) = federal insurance you paid into off paycheques (Service Canada).
  - *Social Assistance* = provincial needs-based aid (Ontario Works, ODSP, BC Income Assistance, Alberta Works).
- **Multiple Bank Accounts, Secured Credit Cards & Internal Transfers**:
  - Always use **Step 2: combine and total each category across ALL accounts combined** (never file separate Form 65 breakdowns per bank account).
  - Count income ONCE when first deposited; IGNORE internal transfers between your own savings/chequing accounts; count credit card purchases ONCE when you swipe the card (do NOT count credit card bill payments as a second expense). Keep PDF statements in case your LIT asks.
- **Cash Gifts, Birthday/Holiday Money & Windfalls**:
  - Small occasional modest gifts ($20-$100) are fine to note cleanly; larger cash gifts, regular family e-transfers helping pay bills, or deposits into your bank should be disclosed under *Other Net Income* (or explained to your LIT so deposits aren't flagged). Large windfalls (inheritance/lottery) must be reported to your LIT immediately under BIA S.67.
- **Discharge Timelines**: First-time: 9 months (surplus <$200/mo) or 21 months ($200+/mo). Second-time: 24 or 36 months. Duties: 2 financial counseling sessions, monthly Form 65 by the 15th, estate/surplus payments, surrender non-exempt assets.

DOCUMENT & IMAGE ANALYSIS:
- When the user uploads bank statements, paystubs, receipts, or BIA documents: inspect payee names, amounts, dates, map them to exact Form 65 fields, flag internal transfers so nothing is double-counted, and note mandatory receipts.`;

function buildSystemInstruction(
  prompt: string,
  knowledgeArticles: LitBotKnowledgeArticle[]
): string {
  const activeCustom = knowledgeArticles.filter((a) => a.isActive && !a.isBuiltIn);
  const topRelevant = findRelevantKnowledge(prompt, knowledgeArticles, 4);

  const combinedMap = new Map<string, LitBotKnowledgeArticle>();
  for (const item of activeCustom.slice(0, 6)) {
    combinedMap.set(item.id, item);
  }
  for (const item of topRelevant) {
    combinedMap.set(item.id, item);
  }

  const selected = Array.from(combinedMap.values());
  if (selected.length === 0) {
    return BASE_LITBOT_SYSTEM_INSTRUCTION;
  }

  const knowledgeBlock = selected
    .map((art, idx) => {
      const citationLine = art.citation ? ` (Source: ${art.citation})` : '';
      const clippedContent = art.content.trim().slice(0, 2200);
      return `[${idx + 1}] ${art.title}${citationLine} [${art.sourceType.toUpperCase()}]:\n${clippedContent}`;
    })
    .join('\n\n');

  return `${BASE_LITBOT_SYSTEM_INSTRUCTION}

CUSTOM TRAINED ARTICLES, STUDIES & REFERENCE GUIDES (USE & CITE BY TITLE WHEN RELEVANT):
${knowledgeBlock}`;
}

export async function processLitBotChatRequest(
  prompt: string,
  messages: Array<{ role: 'user' | 'model'; text: string }> = [],
  attachments: Array<{ fileName: string; mimeType: string; base64: string }> = [],
  contextProfile?: any,
  clientKnowledgeArticles: LitBotKnowledgeArticle[] = [],
  sessionId?: string
) {
  const mergedKnowledge = mergeKnowledgeArticles([]);
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  // 1. Primary Basis: BotPenguin AI Agent for conversational Q&A (when no binary file attachment is uploaded)
  if (!hasAttachments) {
    try {
      const bpReply = await askBotPenguinAgent(prompt, sessionId || 'cleanslate-default', 18000);
      if (bpReply?.text && bpReply.text.trim().length > 0) {
        return {
          text: bpReply.text.trim(),
          provider: 'botpenguin',
          sessionId: bpReply.sessionId
        };
      }
    } catch (bpErr) {
      console.warn('BotPenguin primary agent failed, falling back cleanly:', bpErr);
    }
  }

  // 2. Multimodal attachment path OR resilient Gemini fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment. Falling back to local statutory response engine.');
    return getFallbackLitBotResponse(prompt, contextProfile, mergedKnowledge);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const contents: any[] = [];

    if (Array.isArray(messages) && messages.length > 0) {
      const recent = messages.slice(-8).filter((m) => m && m.text && m.text.trim().length > 0);
      const firstUserIdx = recent.findIndex((m) => m.role === 'user');
      const trimmedHistory = firstUserIdx >= 0 ? recent.slice(firstUserIdx) : [];

      for (const msg of trimmedHistory) {
        const role = msg.role === 'user' ? 'user' : 'model';
        const last = contents[contents.length - 1];
        if (last && last.role === role) {
          last.parts.push({ text: msg.text });
        } else {
          contents.push({
            role,
            parts: [{ text: msg.text }]
          });
        }
      }
    }

    const currentParts: any[] = [];
    if (hasAttachments) {
      for (const att of attachments) {
        if (att.base64 && att.mimeType) {
          const cleanBase64 = att.base64.replace(/^data:[^;]+;base64,/, '');
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanBase64
            }
          });
        }
      }
    }

    let fullPrompt = prompt;
    if (contextProfile) {
      const extraSimContext = contextProfile.activeThreshold
        ? `, Active OSB Threshold: $${contextProfile.activeThreshold}/mo`
        : '';
      const extraReportContext = contextProfile.activeReportMonth
        ? `, Active Form 65 Period: ${contextProfile.activeReportMonth}`
        : '';
      fullPrompt = `[Debtor Profile Context: ${contextProfile.firstName || 'Debtor'}, Household Size: ${contextProfile.householdSize || 2}, Province: ${contextProfile.province || 'BC'}, LIT: ${contextProfile.litName || 'Sarah Jenkins, LIT'}, Current Surplus Payment: $${contextProfile.surplusPayment ?? 159}/mo${extraSimContext}${extraReportContext}]\n\nUser Question: ${prompt}`;
    }

    currentParts.push({ text: fullPrompt });

    const lastEntry = contents[contents.length - 1];
    if (lastEntry && lastEntry.role === 'user') {
      lastEntry.parts.push(...currentParts);
    } else {
      contents.push({
        role: 'user',
        parts: currentParts
      });
    }

    const systemInstruction = buildSystemInstruction(prompt, mergedKnowledge);

    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        )
      ]);

    const modelsToTry = hasAttachments
      ? ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']
      : ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const config: any = { systemInstruction };
        if (model === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const timeoutMs = model === 'gemini-3.1-flash-lite' ? 16000 : 25000;
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents,
            config
          }),
          timeoutMs,
          model
        );

        const textOutput = response.text;
        if (textOutput && textOutput.trim().length > 0) {
          return { text: textOutput, provider: 'gemini' };
        }
      } catch (err) {
        lastError = err;
        console.warn(`LITbot model ${model} attempt failed, trying fallback...`, err);
      }
    }

    if (lastError) {
      console.error('All Gemini model attempts failed in processLitBotChatRequest:', lastError);
    }
    return getFallbackLitBotResponse(prompt, contextProfile, mergedKnowledge);
  } catch (error: any) {
    console.error('Error executing Gemini API in processLitBotChatRequest:', error);
    return getFallbackLitBotResponse(prompt, contextProfile, mergedKnowledge);
  }
}
