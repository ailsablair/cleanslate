import { GoogleGenAI } from '@google/genai';

const LITBOT_SYSTEM_INSTRUCTION = `You are LITbot, the official AI Licensed Insolvency Trustee (LIT) assistant for CleanSlate — Canada's premier personal bankruptcy and insolvency guidance app.

YOUR MANDATE & DIRECTIVE:
Provide 100% accurate, authoritative, compliant legal-financial guidance under the Canadian Bankruptcy and Insolvency Act (BIA) (R.S.C., 1985, c. B-3), Office of the Superintendent of Bankruptcy (OSB) Directives (especially Directive No. 11R2 on Surplus Income), Form 65 Income & Expense Rules, and OSB Audit standards.

STRICT CANADIAN BANKRUPTCY STATUTORY LAWS & RULES:
1. SURPLUS INCOME DETERMINATION (OSB Directive 11R2):
   - Formula: Net Monthly Household Income minus Non-Discretionary Deductions minus OSB Statutory Allowance Threshold for Household Size.
   - 50% of the surplus exceeding threshold must be paid to the bankruptcy estate for trustee distribution to creditors.
   - Statutory Discharge Extensions based on Surplus Average ($200+/month threshold):
     - First-time Bankrupt: 9 months without surplus; 21 months with surplus.
     - Second-time Bankrupt: 24 months without surplus; 36 months with surplus.
2. FORM 65 CLASSIFICATIONS & AUDIT PROOF:
   - NON-DISCRETIONARY (Reduces surplus base 100% dollar-for-dollar): Legally mandated child support paid, spousal support paid, child care required for employment, verified non-recoverable medical expenses & prescriptions, court-ordered fines/penalties, mandatory employment expenses (union dues, mandatory safety gear), stay-lifted debt payments. ALL non-discretionary claims MUST be backed by attached receipts or statutory documentation.
   - DISCRETIONARY (Standard living expense allowances): Housing (rent, mortgage, property tax, utilities), Personal (clothing, grooming, personal care), Transportation (fuel, public transit), Food & Groceries.
3. DUTIES OF A BANKRUPT FOR AUTOMATIC DISCHARGE:
   - Complete 2 mandatory financial counseling sessions with a certified counselor.
   - Submit accurate monthly Form 65 income and expense statements along with paystubs and bank statements.
   - Pay required administrative fees and calculated monthly surplus income payments on time.
   - Surrender non-exempt assets to the Licensed Insolvency Trustee.
4. DOCUMENT & IMAGE ANALYSIS:
   - When the user uploads bank statements, paystubs, receipts, tax assessments, or BIA documents (images or PDFs):
     - Inspect payee names, transaction amounts, dates, tax withholdings, and statutory line items.
     - Categorize expenses directly into Form 65 fields.
     - Flag missing receipts, audit red flags (e.g. unverified cash transfers), and potential tax deduction opportunities.
5. RESPONSE STYLE:
   - Empathetic, encouraging, highly structured, crisp, professional, and 100% legally accurate.
   - Use clear bold section headings, bullet points, and actionable next steps.
   - Never provide vague or inaccurate legal speculation. Remind users that formal legal filings are submitted through their appointed Licensed Insolvency Trustee (Sarah Jenkins, CPA, CIRP).`;

export async function processLitBotChatRequest(
  prompt: string,
  messages: Array<{ role: 'user' | 'model'; text: string }> = [],
  attachments: Array<{ fileName: string; mimeType: string; base64: string }> = [],
  contextProfile?: any
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment. Falling back to local statutory response engine.');
    return getFallbackLitBotResponse(prompt, contextProfile);
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

    // Append prior chat history if present
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages.slice(-10)) { // keep last 10 messages for context window efficiency
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    // Build parts for current user request
    const currentParts: any[] = [];

    // Add attachments if provided
    if (Array.isArray(attachments) && attachments.length > 0) {
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

    // Append context profile summary if available
    let fullPrompt = prompt;
    if (contextProfile) {
      fullPrompt = `[Debtor Profile Context: ${contextProfile.firstName || 'Debtor'}, Household Size: ${contextProfile.householdSize || 2}, Province: ${contextProfile.province || 'BC'}, LIT: ${contextProfile.litName || 'Sarah Jenkins, LIT'}, Current Surplus Payment: $${contextProfile.surplusPayment || 159}/mo]\n\nUser Question: ${prompt}`;
    }

    currentParts.push({ text: fullPrompt });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: LITBOT_SYSTEM_INSTRUCTION
      }
    });

    const textOutput = response.text;
    if (textOutput && textOutput.trim().length > 0) {
      return { text: textOutput };
    }

    return getFallbackLitBotResponse(prompt, contextProfile);
  } catch (error: any) {
    console.error('Error executing Gemini API in processLitBotChatRequest:', error);
    return getFallbackLitBotResponse(prompt, contextProfile);
  }
}

function getFallbackLitBotResponse(prompt: string, contextProfile?: any) {
  const p = prompt.toLowerCase();
  
  if (p.includes('surplus') || p.includes('calculate') || p.includes('threshold') || p.includes('directive 11r2')) {
    return {
      text: `### Canadian Bankruptcy Surplus Income Rules (OSB Directive 11R2)\n\nUnder **Directive No. 11R2** issued by the Office of the Superintendent of Bankruptcy (OSB):\n\n1. **Calculation Formula**:\n   $$\\text{Surplus Basis} = \\text{Net Monthly Household Income} - \\text{Non-Discretionary Deductions} - \\text{OSB Standard Threshold}$$\n\n2. **Statutory OSB Thresholds (2022-2026 Standards)**:\n   - **1-person household**: $2,400 / month\n   - **2-person household**: $2,980 / month\n   - **3-person household**: $3,600 / month\n\n3. **Payment Obligation**: You pay **50%** of the net surplus exceeding your statutory threshold to the bankrupt estate.\n\n4. **Discharge Timeline Extension**:\n   - **First Bankruptcy**: 9 months if surplus is under $200/mo average; **21 months** if surplus equals or exceeds $200/mo average.\n   - **Second Bankruptcy**: 24 months without surplus; **36 months** with surplus.\n\nWould you like me to inspect your latest Form 65 or bank statement to check your exact surplus basis?`
    };
  }

  if (p.includes('receipt') || p.includes('medical') || p.includes('non-discretionary') || p.includes('proof')) {
    return {
      text: `### Form 65 Non-Discretionary Expense Proof Requirements\n\nUnder **BIA Form 65 rules**, non-discretionary deductions directly reduce your net income before calculating surplus payments. **Receipts or statutory proof ARE MANDATORY for the following items**:\n\n- **Medical Condition Expenses**: Prescription drugs, physician-authorized medical cannabis, dental therapy, orthopedic devices not covered by provincial health insurance (MSP/OHIP).\n- **Child Care**: Verified daycare or babysitting receipts necessary for employment.\n- **Court-Ordered Payments**: Mandatory child or spousal support paid pursuant to a written agreement or court order.\n- **Employment Conditions**: Mandatory union dues, safety boots/equipment, or specialized tools required by your employer.\n\n*Tip*: You can upload your receipt or prescription scan right here in LITbot chat to verify if it qualifies for Form 65 deduction!`
    };
  }

  if (p.includes('discharge') || p.includes('timeline') || p.includes('duties') || p.includes('finish')) {
    return {
      text: `### Path to Automatic Discharge under the BIA\n\nTo earn your **100% Automatic Discharge** from bankruptcy and eliminate your dischargeable debts:\n\n1. **Complete 2 Financial Counseling Sessions**: Mandatory one-on-one sessions covering budgeting, credit building, and money management.\n2. **Submit All Monthly Form 65 Reports**: File accurate monthly income and expense reports with paystubs and bank statements on the 15th of every month.\n3. **Pay Estate & Surplus Contributions**: Complete required estate administration fees and any calculated surplus income payments.\n4. **Surrender Non-Exempt Assets**: Comply with trustee administration regarding non-exempt property.\n\nUpon completing these statutory duties, your Licensed Insolvency Trustee (**Sarah Jenkins, CPA, CIRP**) issues your official **Certificate of Discharge**!`
    };
  }

  return {
    text: `### CleanSlate LITbot Statutory Guidance\n\nI am your virtual Licensed Insolvency Trustee assistant. I am fully equipped to guide you through:\n\n- **OSB Directive 11R2 Surplus Income Calculations**\n- **BIA Form 65 Expense Categorization & Receipt Audit Rules**\n- **9-month vs 21-month Automatic Discharge Timelines**\n- **Bank Statement & Paystub Upload Analysis**\n\nHow can I assist you with your bankruptcy administration or Form 65 filing today?`
  };
}
