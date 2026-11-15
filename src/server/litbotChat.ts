import { GoogleGenAI } from '@google/genai';

const LITBOT_SYSTEM_INSTRUCTION = `You are LITbot, the official AI Licensed Insolvency Trustee (LIT) assistant for CleanSlate — Canada's personal bankruptcy guidance app.

WHO OUR USERS ARE & HOW YOU MUST TALK TO THEM:
- Many CleanSlate users feel overwhelmed, anxious about money, unfamiliar with banking or legal terms, or exhausted trying to follow bankruptcy rules.
- Treat EVERY user with warmth, patience, zero judgment, and supportive hand-holding. Never make them feel silly for asking basic or repeated questions.
- Use **plain, everyday English first**. Whenever you mention a legal or Form 65 term (like "Non-Discretionary" or "Surplus Income"), immediately translate it into simple words with a concrete example.
- Keep answers well-structured with short reassuring openings, clear **bold headings**, bullet points or numbered steps, and an exact **"What to do in CleanSlate"** tip when helpful.
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

CRITICAL ANSWERS FOR COMMON CONFUSING QUESTIONS:

1. "MEDICAL CONDITION EXPENSES" vs. "PRESCRIPTIONS":
   - Why they both exist: Official Canadian BIA Form 65 lists medical costs in two places, which confuses almost everyone!
   - **Medical Condition Expenses** (in Section 2: *Family Non-Discretionary Expenses*): Use this for **ongoing, documented medical needs** not covered by insurance or provincial health care (e.g., daily insulin, CPAP supplies, doctor-authorized medical cannabis, ongoing physical therapy, specialized orthopedic gear, or prescription medication tied to a diagnosed medical condition). Every dollar here **directly lowers** your surplus income payment (100% deduction), as long as you attach your receipt/prescription.
   - **Prescriptions** (in Section 8: *Non-Recoverable Medical Expenses*): Use this for **routine or one-off out-of-pocket pharmacy prescriptions** (like a one-time antibiotic, allergy meds, or minor co-pays when you are simply logging household medical bills without claiming a special Non-Discretionary medical deduction).
   - **Golden Rule**: Never enter the same receipt in both! If you have a prescription receipt for an ongoing medical condition, put it under **Medical Condition Expenses** and attach the receipt so your trustee can deduct it from your surplus income.

2. WHY CATEGORIES LOOK REPEATED ("Monthly Family Income (Net)" vs. "Monthly Family Non-Discretionary Expenses"):
   - It is **Money Coming IN** vs. **Money Forced to Go OUT**!
   - Official Form 65 uses nearly identical names in both sections—for example, **Child Support** and **Spousal Support** (plus "Other").
   - In **Family Income (Net)**, enter support or money you **RECEIVE** into your household.
   - In **Family Non-Discretionary Expenses**, enter support you are **LEGALLY ORDERED TO PAY OUT** to someone else.
   - You are not repeating information—only fill the Income line if money comes in, and only fill the Expense line if you pay it out.

3. WHICH CATEGORIES COUNT vs. DO NOT COUNT TOWARD MY BANKRUPTCY PAYMENT (SURPLUS INCOME) CALCULATION:
   - Under **OSB Directive 11R2**, your monthly surplus payment is calculated using ONLY:
     \`(Total Net Monthly Family Income) - (Total Non-Discretionary Expenses) - (Government OSB Household Living Allowance)\`.
     If there is money left over above that allowance, you pay **50% of the excess** to your estate (and keep the other 50%!).
   - **Categories that DO count in your payment calculation**:
     - **Family Income (Net)** (pushes the calculation up).
     - **Family Non-Discretionary Expenses** (pushes the calculation DOWN dollar-for-dollar!).
   - **Categories that DO NOT directly raise or lower your bankruptcy payment**:
     - **Housing Expenses** (Rent/Mortgage, Hydro, Gas, Phone, Cable, Water, Furniture)
     - **Personal Expenses** (Smoking, Alcohol, Dining Out, Entertainment, Gifts)
     - **Living Expenses** (Food/Grocery, Laundry, Grooming, Clothing)
     - **Transportation Expenses** (Gas, Repairs, Public Transit)
     - **Insurance Expenses** (Vehicle, House, Life)
     - **Non-Recoverable Medical Expenses** (routine Prescriptions, Dental)
     - **Payments** (tracking payments to the estate or a secured creditor like a kept car loan)
   - **Why?** The government already gives everyone a flat monthly living allowance based on household size (e.g., ~$2,400 for 1 person, ~$2,980 for 2 people, ~$3,600 for 3 people) to cover rent, groceries, gas, and everyday bills. Form 65 still asks you to list those expenses so your trustee can see your full household budget and spot hardship, but spending more or less on rent or groceries will not change your statutory surplus payment formula.

4. "EMPLOYMENT INSURANCE BENEFITS" (or "Employment Income Benefits") vs. "SOCIAL ASSISTANCE":
   - Even though both are government programs, Form 65 separates them into two lines under **Family Income (Net)**:
   - **Employment Insurance Benefits (EI)** (sometimes called *Employment Income Benefits*): Money from **federal Employment Insurance** that you paid into from your paycheques while working (regular layoff EI, EI sickness, maternity/parental EI).
   - **Social Assistance**: **Provincial/territorial needs-based financial help** for people with very low or no income (such as Ontario Works / OW, ODSP, BC Income Assistance / PWD, Alberta Works). You didn't pay into this from payroll—it is based on financial need.
   - Both belong in Section 1 (*Family Income*), and you only pick the one that matches the program paying you. Form 65 keeps them separate because the Office of the Superintendent of Bankruptcy (OSB) tracks insurance-based wage replacement differently from provincial social assistance.

5. MULTIPLE BANK ACCOUNTS, SECURED CREDIT CARDS & INTERNAL TRANSFERS (STEP 1 vs. STEP 2):
   - Many people juggle multiple accounts (e.g., Neo Financial Everyday Chequing, Neo Savings for paycheck deposits, Neo Savings #2 for rent, Secured Credit Cards #1 & #2, plus Scotiabank chequing for cash/debit) and move money back and forth internally.
   - **Do you need a breakdown per account, or combine everything? ALWAYS DO STEP 2 (combine and total each category across ALL accounts)!**
   - Your Licensed Insolvency Trustee wants **ONE combined Form 65 monthly total per category** (e.g., all groceries across Scotiabank + Neo + both secured cards added into one "Food/Grocery" total)—NOT separate Form 65 reports for every account!
   - **The 3 Golden Rules for Internal Transfers (Avoid Double-Counting!):**
     1. **Count Income ONCE:** When your paycheck or benefit first lands (e.g., into Neo Savings), count it once under Income. Moving that same money later from Neo Savings -> Neo Everyday Chequing or Neo Savings #2 is **NOT new income**—skip/ignore internal transfers!
     2. **Count Expenses ONCE (at the real store/landlord):** Count rent once when it leaves Neo Savings #2 to your landlord. Count groceries once when you swipe your Scotiabank card or Neo Secured Card at the store.
     3. **Do NOT count Credit Card Payments as an expense:** Paying off Secured Credit Card #1 or #2 from your chequing account is just an internal transfer paying back purchases you already counted when you swiped the card. Counting both the grocery swipe AND the card payment would double-count your spending!
   - **Important**: Still keep monthly PDF statements for every bank and secured card in case your LIT asks to verify transfers, and link/categorize them inside CleanSlate's **Bank Account(s)** and **Categorize** tabs so CleanSlate totals everything for you automatically.

6. AUTOMATIC DISCHARGE TIMELINES & DUTIES:
   - First-time bankrupt: **9 months** if average surplus income is under $200/month; **21 months** if $200+/month.
   - Second-time bankrupt: **24 months** without surplus; **36 months** with surplus.
   - Duties: Complete 2 mandatory financial counseling sessions, file monthly Form 65 reports with paystubs/statements on the 15th, make required estate/surplus payments, and surrender non-exempt assets.

DOCUMENT & IMAGE ANALYSIS:
- When the user uploads bank statements, paystubs, receipts, tax assessments, or BIA documents (images or PDFs):
  - Read payee names, amounts, dates, and line items carefully.
  - Explain in simple terms which exact Form 65 category each item belongs to, flag internal transfers so the user doesn't double-count, and note if a receipt is required.`;

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

    // Append prior chat history cleanly: Gemini expects conversation history to start with a 'user' turn
    // and alternate roles without leading model greeting bubbles breaking the turn sequence.
    if (Array.isArray(messages) && messages.length > 0) {
      const recent = messages.slice(-10).filter((m) => m && m.text && m.text.trim().length > 0);
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
      const extraSimContext = contextProfile.activeThreshold
        ? `, Active OSB Threshold: $${contextProfile.activeThreshold}/mo`
        : '';
      const extraReportContext = contextProfile.activeReportMonth
        ? `, Active Form 65 Period: ${contextProfile.activeReportMonth}`
        : '';
      fullPrompt = `[Debtor Profile Context: ${contextProfile.firstName || 'Debtor'}, Household Size: ${contextProfile.householdSize || 2}, Province: ${contextProfile.province || 'BC'}, LIT: ${contextProfile.litName || 'Sarah Jenkins, LIT'}, Current Surplus Payment: $${contextProfile.surplusPayment ?? 159}/mo${extraThresholdStr(extraSimContext)}${extraReportContext}]\n\nUser Question: ${prompt}`;
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

    const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: LITBOT_SYSTEM_INSTRUCTION
          }
        });

        const textOutput = response.text;
        if (textOutput && textOutput.trim().length > 0) {
          return { text: textOutput };
        }
      } catch (err) {
        lastError = err;
        console.warn(`LITbot model ${model} attempt failed, trying fallback...`, err);
      }
    }

    if (lastError) {
      console.error('All Gemini model attempts failed in processLitBotChatRequest:', lastError);
    }
    return getFallbackLitBotResponse(prompt, contextProfile);
  } catch (error: any) {
    console.error('Error executing Gemini API in processLitBotChatRequest:', error);
    return getFallbackLitBotResponse(prompt, contextProfile);
  }
}

function extraThresholdStr(val: string) {
  return val || '';
}

export function getFallbackLitBotResponse(prompt: string, contextProfile?: any) {
  const p = prompt.toLowerCase();
  const householdSize = contextProfile?.householdSize || 2;
  const thresholdStr =
    householdSize === 1 ? '$2,400' : householdSize === 2 ? '$2,980' : householdSize === 3 ? '$3,600' : '$4,200';
  const litName = contextProfile?.litName || 'Sarah Jenkins, LIT';

  // Q1: Difference between "Medical Condition Expenses" and "Prescriptions"
  if (
    (p.includes('medical condition') && p.includes('prescription')) ||
    (p.includes('difference') && (p.includes('medical') || p.includes('prescription'))) ||
    (p.includes('medical condition') && (p.includes('what') || p.includes('vs') || p.includes('compare')))
  ) {
    return {
      text: `### "Medical Condition Expenses" vs. "Prescriptions" — Made Simple\n\nDon't worry, this trips up almost everyone! Official Canadian Form 65 puts health costs in two places, and here is the easy way to tell them apart:\n\n1. **Medical Condition Expenses** *(under Family Non-Discretionary Expenses)*:\n   - **What it is:** Ongoing medical costs tied to a **diagnosed medical condition** that aren't paid by insurance or provincial healthcare (e.g., daily insulin, CPAP supplies, doctor-authorized medical cannabis, ongoing physiotherapy, or recurring condition medications).\n   - **Why it matters:** Every dollar here **directly lowers your monthly bankruptcy payment** (100% deduction), as long as you attach a receipt or prescription!\n\n2. **Prescriptions** *(under Non-Recoverable Medical Expenses)*:\n   - **What it is:** Everyday or one-off out-of-pocket pharmacy prescriptions (like a quick course of antibiotics, allergy pills, or minor co-pays) that you're simply logging as normal household living costs.\n\n**Simple Rule of Thumb:**\n- If you have a receipt/prescription for an ongoing medical need, put it in **Medical Condition Expenses** and attach the receipt so your trustee can deduct it.\n- **Never put the same receipt in both categories** (that would double-count it).`
    };
  }

  // Q2: Repeated categories across Income vs. Non-Discretionary Expenses
  if (
    p.includes('repeated') ||
    p.includes('multiple of the same') ||
    p.includes('same category') ||
    (p.includes('family income') && p.includes('non-discretionary')) ||
    (p.includes('listed twice') && (p.includes('support') || p.includes('category') || p.includes('form 65')))
  ) {
    return {
      text: `### Why Categories Look Repeated on Form 65 (Income vs. Non-Discretionary Expenses)\n\nGreat catch—it definitely looks like a typo at first! Official Canadian Form 65 uses almost identical names in both sections because one tracks **money coming IN** and the other tracks **money forced to go OUT**:\n\n- **Monthly Family Income (Net)** = Money **coming INTO** your home:\n  - Example: Put **Child Support** or **Spousal Support** here *only if you receive it* from someone else.\n- **Monthly Family Non-Discretionary Expenses** = Money **legally forced to go OUT** of your home:\n  - Example: Put **Child Support Payments** or **Spousal Support** here *only if a court order forces you to pay it* to someone else.\n\n**You are NOT supposed to enter the same number twice!** Just ask yourself: *"Did this money come into my pocket (Income), or did I have to pay it out (Non-Discretionary Expense)?"*`
    };
  }

  // Q4: Employment Insurance / Employment Income Benefits vs. Social Assistance
  if (
    p.includes('social assistance') ||
    p.includes('employment income benefits') ||
    p.includes('employment insurance') ||
    p.includes('government program') ||
    (p.includes('ei') && p.includes('assistance'))
  ) {
    return {
      text: `### Employment Insurance (EI) vs. Social Assistance — What's the Difference?\n\nYou're right that both are government payments! Here is the simple everyday difference so you pick the right box:\n\n1. **Employment Insurance Benefits** *(sometimes labeled Employment Income Benefits)*:\n   - **What it is:** Federal insurance **you paid into from your paycheques while working** (Service Canada).\n   - **Examples:** Regular EI after a layoff, EI sickness benefits, or maternity/parental EI.\n\n2. **Social Assistance:**\n   - **What it is:** **Provincial needs-based financial aid** for people with very little or no income—you didn't pay into it through payroll deductions.\n   - **Examples:** Ontario Works (OW), ODSP, BC Income Assistance / PWD, Alberta Works, or provincial welfare.\n\n**What to do on Form 65:** Both live in **Section 1: Family Income (Net)**. Just pick the one matching the program on your deposit statement—you will never put the same payment in both!`
    };
  }

  // Q5: Multiple bank accounts, internal transfers, secured credit cards, Step 1 vs Step 2
  if (
    p.includes('transfer') ||
    p.includes('internally') ||
    p.includes('each account') ||
    p.includes('multiple') ||
    p.includes('several bank') ||
    p.includes('secured credit card') ||
    p.includes('step 1') ||
    p.includes('step 2') ||
    p.includes('scotiabank') ||
    p.includes('neo ') ||
    p.includes('credit card')
  ) {
    return {
      text: `### Managing Multiple Accounts, Secured Cards & Internal Transfers (Use Step 2!)\n\nJuggling multiple accounts (like Neo Chequing, separate Neo Savings for pay/rent, secured credit cards, and Scotiabank) is exhausting—take a deep breath, you do **NOT** need a separate Form 65 breakdown for each account!\n\n**The Short Answer: Always do Step 2 (Total each category across ALL accounts combined).**\n\nYour trustee wants **one combined monthly total** per category (for example, all groceries across Scotiabank + Neo + your secured cards added together into one "Food/Grocery" number).\n\n**3 Easy Rules so You Never Double-Count Internal Transfers:**\n1. **Count Income ONCE:** Count your paycheck or benefit when it *first lands* in your deposit savings/chequing account.\n2. **IGNORE Internal Transfers:** Moving your own money between Neo Savings, Neo Chequing, Rent Savings, or Scotiabank is **NOT new income and NOT an expense**—skip those lines when adding up categories.\n3. **Skip Credit Card Bill Payments (Count the Swipe Instead!):** Count groceries or gas once when you *swipe* your secured credit card at the store. When you later transfer money from chequing to pay off that secured card, **do not count that payment**—otherwise you'd count the same groceries twice!\n\n*Tip:* Keep all your monthly bank and card PDF statements saved just in case **${litName}** asks to verify a transfer, and let CleanSlate's **Categorize** tab add the combined totals up for you automatically.`
    };
  }

  // Q3: Which categories are NOT counted towards my bankruptcy payment calculation?
  if (
    p.includes('not counted') ||
    p.includes('which categories') ||
    p.includes('count towards') ||
    p.includes('payment calculation') ||
    p.includes('affect my payment') ||
    p.includes('included in my payment')
  ) {
    return {
      text: `### Which Categories Do NOT Count Toward Your Bankruptcy Payment?\n\nThis is one of the biggest reliefs once you understand how it works!\n\nUnder Canadian law (**OSB Directive 11R2**), your monthly payment is calculated using **only two sections** plus a government living allowance:\n- **Counts (pushes calculation UP):** **Family Income (Net)**\n- **Counts (pushes calculation DOWN dollar-for-dollar):** **Family Non-Discretionary Expenses** (court-ordered child/spousal support paid, childcare needed for work, verified Medical Condition Expenses, mandatory work tools/union dues, court fines)\n- **Minus Government Living Allowance:** For your household of ${householdSize}, the government automatically subtracts **${thresholdStr}/month** before taking 50% of anything left over.\n\n**These Categories Do NOT Directly Change Your Monthly Payment:**\n- **Housing Expenses** (Rent/Mortgage, Hydro, Gas, Phone, Cable, Water, Furniture)\n- **Living Expenses** (Food/Grocery, Clothing, Grooming, Laundry)\n- **Personal Expenses** (Dining Out, Entertainment, Smoking, Alcohol, Gifts)\n- **Transportation Expenses** (Gas, Car Repairs, Public Transit)\n- **Insurance Expenses** (Car, House, Life Insurance)\n- **Non-Recoverable Medical** (routine Prescriptions, Dental)\n- **Payments** (tracking payments to the estate or a kept car loan)\n\n*Why are they on Form 65 then?* Because the government's flat living allowance already covers everyday living costs—listing these helps your trustee see your real household budget, even though spending more or less on rent or groceries won't raise your statutory surplus payment.`
    };
  }

  if (p.includes('surplus') || p.includes('calculate') || p.includes('threshold') || p.includes('directive 11r2') || p.includes('overtime')) {
    return {
      text: `### How Your Bankruptcy Surplus Payment Works (Plain English)\n\nUnder **OSB Directive 11R2**, you are never penalized for earning extra income—you **always keep at least 50%** of anything above the government threshold!\n\n1. **Simple Formula**:\n   - Start with your **Total Net Monthly Family Income** (after taxes)\n   - Subtract **Non-Discretionary Expenses** (child/spousal support paid, childcare for work, verified medical condition receipts)\n   - Subtract your **Government Living Allowance** (**${thresholdStr}/month** for a ${householdSize}-person household)\n\n2. **What You Pay**: If the leftover number is positive, **50%** goes to your bankruptcy estate and **50% stays in your pocket**.\n\n3. **Timeline Rule (9 vs. 21 Months)**:\n   - First-time bankruptcy: **9 months** if average surplus payment is under $200/month, or **21 months** if it averages $200/month or more.\n   - Second-time bankruptcy: **24 months** without surplus; **36 months** with surplus.\n\nWant to check your exact numbers? Try the **Surplus Simulator** or upload a paystub here and I'll walk through it with you!`
    };
  }

  if (p.includes('receipt') || p.includes('non-discretionary') || p.includes('proof')) {
    return {
      text: `### When Do You Actually Need to Upload a Receipt?\n\nYou don't need to stress over every single coffee receipt! Under **BIA Form 65**, receipts or proof are **mandatory only for Non-Discretionary deductions** that lower your payment:\n\n- **Medical Condition Expenses**: Prescriptions, medical cannabis authorization, therapy, or medical gear not covered by provincial health insurance.\n- **Child Care**: Daycare or babysitting receipts required so you can work.\n- **Court-Ordered Support**: Written agreement or court order for child/spousal support you pay.\n- **Mandatory Work Expenses**: Union dues, steel-toe safety boots, or tools required by your employer.\n\nEveryday groceries, rent, and gas don't require receipts for your surplus formula—just upload your mandatory receipts in the **Receipts** tab or drop one right here!`
    };
  }

  if (p.includes('discharge') || p.includes('timeline') || p.includes('duties') || p.includes('finish')) {
    return {
      text: `### Your Step-by-Step Path to Discharge\n\nGetting to your **Certificate of Discharge** (when your eligible debts are officially wiped clean) comes down to 4 simple steps:\n\n1. **Attend 2 Counseling Sessions**: Short, supportive one-on-one sessions on budgeting and rebuilding credit.\n2. **Submit Monthly Form 65 Reports**: Report your income and expenses by the **15th of every month** with paystubs/bank statements.\n3. **Make Required Estate / Surplus Payments**: Stay on top of the monthly payments calculated with your trustee.\n4. **Cooperate on Non-Exempt Assets**: Let your trustee handle anything not protected by provincial exemptions.\n\nYour trustee (**${litName}**) and CleanSlate will guide you through each step one month at a time.`
    };
  }

  return {
    text: `### I'm Here to Walk You Through This Step-by-Step\n\nBankruptcy paperwork can feel overwhelming, and there is no such thing as a silly question here! I can explain any part of Form 65 or your banking in plain English—for example:\n\n- **"What is the difference between Medical Condition Expenses and Prescriptions?"**\n- **"Why do categories look repeated in Family Income vs. Non-Discretionary Expenses?"**\n- **"Which categories are NOT counted toward my bankruptcy payment?"**\n- **"What's the difference between Employment Insurance Benefits and Social Assistance?"**\n- **"How do I report multiple bank accounts, secured credit cards, and internal transfers?"**\n\nTell me what's stressing you out or what line on Form 65 you're stuck on, and we'll solve it together!`
  };
}
