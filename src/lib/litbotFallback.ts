import { LitBotKnowledgeArticle, findRelevantKnowledge } from './litbotKnowledge';

export interface LitBotContextSummary {
  firstName?: string;
  province?: string;
  householdSize?: number;
  litName?: string;
  surplusPayment?: number;
  activeThreshold?: number;
  activeReportMonth?: string;
}

export function getFallbackLitBotResponse(
  prompt: string,
  contextProfile?: LitBotContextSummary,
  knowledgeArticles: LitBotKnowledgeArticle[] = []
): { text: string } {
  const p = (prompt || '').toLowerCase();
  const householdSize = contextProfile?.householdSize || 2;
  const thresholdStr =
    householdSize === 1
      ? '$2,400'
      : householdSize === 2
      ? '$2,980'
      : householdSize === 3
      ? '$3,600'
      : householdSize === 4
      ? '$4,200'
      : '$4,800';
  const litName = contextProfile?.litName || 'Sarah Jenkins, LIT';

  // 0. Check custom user-trained articles/studies FIRST so user training works even offline
  const customArticles = (knowledgeArticles || []).filter((a) => a.isActive && !a.isBuiltIn);
  if (customArticles.length > 0) {
    const matched = findRelevantKnowledge(prompt, customArticles, 2);
    const tokens = p
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    const best = matched[0];
    if (
      best &&
      tokens.some(
        (t) =>
          best.title.toLowerCase().includes(t) ||
          best.content.toLowerCase().includes(t)
      )
    ) {
      return {
        text: `### Based on Your Trained Knowledge Source: ${best.title}

${best.content.trim()}

${best.citation ? `*Reference: ${best.citation}*` : ''}`
      };
    }
  }

  // Cash gifts, birthday money, holiday gifts, e-transfers, windfalls
  if (
    p.includes('gift') ||
    p.includes('birthday') ||
    p.includes('holiday') ||
    p.includes('christmas') ||
    p.includes('present') ||
    p.includes('windfall') ||
    p.includes('inherit') ||
    p.includes('lottery') ||
    p.includes('e-transfer') ||
    p.includes('etransfer')
  ) {
    return {
      text: `### How to Handle Cash Gifts, Birthday & Holiday Money

Great question—many people worry they'll get in trouble for receiving birthday or holiday cash from family! Here is the simple rule so you stay 100% protected:

1. **Modest, Occasional Gifts** *(like $20–$100 in a birthday card or holiday gift)*:
   - Small one-off personal gifts aren't meant to punish you. If you keep it as pocket cash for a treat, just jot down a quick note in case anyone asks. If you **deposit it into your bank account**, let your trustee know so an unexplained deposit doesn't trigger a question later.

2. **Larger or Recurring Cash Gifts** *(like several hundred dollars, regular family help, or e-transfers to pay bills)*:
   - On Form 65, money coming into your household to help cover living costs goes under **Section 1: Family Income (Net) → Other Net Income** for that month.

3. **Big Windfalls** *(inheritances or lottery winnings)*:
   - Always tell your Licensed Insolvency Trustee (**${litName}**) right away before spending any major windfall, as large lump sums received before discharge can fall under bankruptcy estate rules.

*Bottom line:* Honest disclosure keeps your discharge smooth and stress-free!`
    };
  }

  // Tax refund / GST / HST / Carbon rebate / Child Tax Benefit
  if (
    p.includes('tax refund') ||
    p.includes('cra') ||
    p.includes('gst') ||
    p.includes('hst') ||
    p.includes('rebate') ||
    p.includes('child tax') ||
    p.includes('ccb')
  ) {
    return {
      text: `### Tax Refunds, GST/HST Credits & Government Rebates

- **Income Tax Refunds:** During personal bankruptcy, tax refunds for the year of bankruptcy (pre- and post-bankruptcy returns) are normally sent directly to your bankruptcy estate by the CRA as part of standard BIA administration.
- **GST/HST Credit & Carbon Rebates:** Keep your trustee (**${litName}**) updated—small quarterly credits are often handled by your trustee depending on your total estate contributions.
- **Canada Child Benefit (CCB):** Report what you receive in **Section 1: Family Income (Net) → Child Tax Benefit** so your monthly Form 65 matches your bank deposits cleanly.`
    };
  }

  // Selling personal items / Facebook Marketplace / Kijiji
  if (
    p.includes('sell') ||
    p.includes('sold') ||
    p.includes('marketplace') ||
    p.includes('kijiji') ||
    p.includes('furniture') ||
    p.includes('poshmark')
  ) {
    return {
      text: `### Selling Old Household Items (Facebook Marketplace / Kijiji)

- **Selling small, exempt personal belongings** *(like an old couch, clothes, or kids' gear you already owned)*: Converting your exempt household goods into a bit of cash to buy groceries is normally fine—just save screenshots of the listing/sale so your trustee knows an e-transfer deposit wasn't hidden job wages!
- **Wait before selling high-value items** *(vehicles, jewelry, investments, collectibles)*: Always check with **${litName}** first to confirm the item is protected under your province's exemptions.`
    };
  }

  // 1. "Medical Condition Expenses" vs "Prescriptions"
  if (
    (p.includes('medical condition') && p.includes('prescription')) ||
    (p.includes('difference') && (p.includes('medical') || p.includes('prescription'))) ||
    (p.includes('medical condition') && (p.includes('what') || p.includes('vs') || p.includes('compare') || p.includes('mean')))
  ) {
    return {
      text: `### "Medical Condition Expenses" vs. "Prescriptions" — Made Simple

Don't worry, this trips up almost everyone! Official Canadian Form 65 puts health costs in two places, and here is the easy way to tell them apart:

1. **Medical Condition Expenses** *(under Family Non-Discretionary Expenses)*:
   - **What it is:** Ongoing medical costs tied to a **diagnosed medical condition** that aren't paid by insurance or provincial healthcare (e.g., daily insulin, CPAP supplies, doctor-authorized medical cannabis, ongoing physiotherapy, or recurring condition medications).
   - **Why it matters:** Every dollar here **directly lowers your monthly bankruptcy payment** (100% deduction), as long as you attach a receipt or prescription!

2. **Prescriptions** *(under Non-Recoverable Medical Expenses)*:
   - **What it is:** Everyday or one-off out-of-pocket pharmacy prescriptions (like a quick course of antibiotics, allergy pills, or minor co-pays) that you're simply logging as normal household living costs.

**Simple Rule of Thumb:**
- If you have a receipt or prescription for an ongoing medical need, put it in **Medical Condition Expenses** and attach the receipt so your trustee can deduct it.
- **Never put the same receipt in both categories** (that would double-count it).`
    };
  }

  // 2. Repeated categories across Income vs Non-Discretionary Expenses
  if (
    p.includes('repeated') ||
    p.includes('duplicate') ||
    p.includes('multiple of the same') ||
    p.includes('same category') ||
    p.includes('listed twice') ||
    (p.includes('family income') && p.includes('non-discretionary')) ||
    (p.includes('twice') && (p.includes('category') || p.includes('support') || p.includes('form 65')))
  ) {
    return {
      text: `### Why Categories Look Repeated on Form 65 (Income vs. Non-Discretionary Expenses)

Great catch—it definitely looks like a typo at first! Official Canadian Form 65 uses almost identical names in both sections because one tracks **money coming IN** and the other tracks **money forced to go OUT**:

- **Monthly Family Income (Net)** = Money **coming INTO** your home:
  - Example: Put **Child Support** or **Spousal Support** here *only if you receive it* from someone else.
- **Monthly Family Non-Discretionary Expenses** = Money **legally forced to go OUT** of your home:
  - Example: Put **Child Support Payments** or **Spousal Support** here *only if a court order requires you to pay it* to someone else.

**You are NOT supposed to enter the same number twice!** Just ask yourself: *"Did this money come into my pocket (Income), or did I have to pay it out (Non-Discretionary Expense)?"*`
    };
  }

  // 4. Employment Insurance / Employment Income Benefits vs Social Assistance
  if (
    p.includes('social assistance') ||
    p.includes('employment income benefits') ||
    p.includes('employment insurance') ||
    p.includes('government program') ||
    p.includes('ontario works') ||
    p.includes('odsp') ||
    p.includes('welfare') ||
    (p.includes('ei') && p.includes('assistance'))
  ) {
    return {
      text: `### Employment Insurance (EI) vs. Social Assistance — What's the Difference?

You're right that both are government payments! Here is the simple everyday difference so you pick the right box:

1. **Employment Insurance Benefits** *(sometimes labeled Employment Income Benefits)*:
   - **What it is:** Federal insurance **you paid into from your paycheques while working** (Service Canada).
   - **Examples:** Regular EI after a layoff, EI sickness benefits, or maternity/parental EI.

2. **Social Assistance:**
   - **What it is:** **Provincial needs-based financial aid** for people with very little or no income—you didn't pay into it through payroll deductions.
   - **Examples:** Ontario Works (OW), ODSP, BC Income Assistance / PWD, Alberta Works, or provincial welfare.

**What to do on Form 65:** Both live in **Section 1: Family Income (Net)**. Just pick the one matching the program on your deposit statement—you will never put the same payment in both!`
    };
  }

  // 5. Multiple bank accounts, secured credit cards, internal transfers, Step 1 vs Step 2
  if (
    p.includes('transfer') ||
    p.includes('internally') ||
    p.includes('each account') ||
    p.includes('multiple') ||
    p.includes('several bank') ||
    p.includes('secured credit') ||
    p.includes('step 1') ||
    p.includes('step 2') ||
    p.includes('scotiabank') ||
    p.includes('neo ') ||
    p.includes('credit card') ||
    p.includes('outgoings')
  ) {
    return {
      text: `### Managing Multiple Accounts, Secured Cards & Internal Transfers (Use Step 2!)

Juggling multiple accounts (like Neo Chequing, separate Neo Savings for pay/rent, secured credit cards, and Scotiabank) is exhausting—take a deep breath, you do **NOT** need a separate Form 65 breakdown for each account!

**The Short Answer: Always do Step 2 (Total each category across ALL accounts combined).**

Your trustee wants **one combined monthly total** per category (for example, all groceries across Scotiabank + Neo + your secured cards added together into one "Food/Grocery" number)—not separate reports for every card or bank account.

**3 Easy Rules so You Never Double-Count Internal Transfers:**
1. **Count Income ONCE:** Count your paycheck or benefit when it *first lands* in your deposit savings/chequing account.
2. **IGNORE Internal Transfers:** Moving your own money between Neo Savings, Neo Chequing, Rent Savings, or Scotiabank is **NOT new income and NOT an expense**—skip those lines when adding up categories.
3. **Skip Credit Card Bill Payments (Count the Swipe Instead!):** Count groceries or gas once when you *swipe* your secured credit card at the store. When you later transfer money from chequing to pay off that secured card, **do not count that payment**—otherwise you'd count the same groceries twice!

*Tip:* Keep all your monthly bank and card PDF statements saved just in case **${litName}** asks to verify a transfer, and let CleanSlate's **Categorize** tab add the combined totals up for you automatically.`
    };
  }

  // 3. Which categories are NOT counted towards my bankruptcy payment calculation?
  if (
    p.includes('not counted') ||
    p.includes("don't count") ||
    p.includes('dont count') ||
    p.includes('which categories') ||
    p.includes('count toward') ||
    p.includes('payment calculation') ||
    p.includes('affect my payment') ||
    p.includes('included in my payment') ||
    p.includes('calculate my payment')
  ) {
    return {
      text: `### Which Categories Do NOT Count Toward Your Bankruptcy Payment?

This is one of the biggest reliefs once you understand how it works!

Under Canadian law (**OSB Directive 11R2**), your monthly payment is calculated using **only two sections** plus a government living allowance:
- **Counts (pushes calculation UP):** **Family Income (Net)**
- **Counts (pushes calculation DOWN dollar-for-dollar):** **Family Non-Discretionary Expenses** (court-ordered child/spousal support paid, childcare needed for work, verified Medical Condition Expenses, mandatory work tools/union dues, court fines)
- **Minus Government Living Allowance:** For your household of ${householdSize}, the government automatically subtracts **${thresholdStr}/month** before taking 50% of anything left over.

**These Categories Do NOT Directly Change Your Monthly Payment:**
- **Housing Expenses** (Rent/Mortgage, Hydro, Gas, Phone, Cable, Water, Furniture)
- **Living Expenses** (Food/Grocery, Clothing, Grooming, Laundry)
- **Personal Expenses** (Dining Out, Entertainment, Smoking, Alcohol, Gifts)
- **Transportation Expenses** (Gas, Car Repairs, Public Transit)
- **Insurance Expenses** (Car, House, Life Insurance)
- **Non-Recoverable Medical** (routine Prescriptions, Dental)
- **Payments** (tracking payments to the estate or a kept car loan)

*Why are they on Form 65 then?* Because the government's flat living allowance already covers everyday living costs—listing these helps your trustee see your real household budget, even though spending more or less on rent or groceries won't raise your statutory surplus payment.`
    };
  }

  // Overtime / Extra pay / Surplus formula
  if (
    p.includes('surplus') ||
    p.includes('calculate') ||
    p.includes('threshold') ||
    p.includes('directive 11r2') ||
    p.includes('overtime') ||
    p.includes('bonus') ||
    p.includes('raise') ||
    p.includes('fluctuate')
  ) {
    return {
      text: `### How Your Bankruptcy Surplus Payment Works (Plain English)

Under **OSB Directive 11R2**, you are never penalized for earning extra income—you **always keep at least 50%** of anything above the government threshold!

1. **Simple Formula**:
   - Start with your **Total Net Monthly Family Income** (after taxes)
   - Subtract **Non-Discretionary Expenses** (child/spousal support paid, childcare for work, verified medical condition receipts)
   - Subtract your **Government Living Allowance** (**${thresholdStr}/month** for a ${householdSize}-person household)

2. **What You Pay**: If the leftover number is positive, **50%** goes to your bankruptcy estate and **50% stays in your pocket**.

3. **Timeline Rule (9 vs. 21 Months)**:
   - First-time bankruptcy: **9 months** if average surplus payment is under $200/month, or **21 months** if it averages $200/month or more.
   - Second-time bankruptcy: **24 months** without surplus; **36 months** with surplus.

Want to test different paycheque numbers? Try the **Surplus Simulator** or upload a paystub right here!`
    };
  }

  // Spouse / Partner income
  if (p.includes('spouse') || p.includes('partner') || p.includes('wife') || p.includes('husband')) {
    return {
      text: `### Does My Spouse's Income Count?

Your spouse's or partner's income is **only** used to calculate the household's fair share of the government living allowance (under OSB Directive 11R2). **Your spouse is never personally responsible for paying your bankruptcy debts.**

If you share rent, groceries, and utilities together, the trustee compares total household income against the larger household threshold (${thresholdStr}/month for ${householdSize} people) and prorates only your portion.`
    };
  }

  // Receipts / proof / childcare
  if (
    p.includes('receipt') ||
    p.includes('non-discretionary') ||
    p.includes('proof') ||
    p.includes('rx') ||
    p.includes('rexall') ||
    p.includes('pharmacy') ||
    p.includes('childcare') ||
    p.includes('daycare')
  ) {
    return {
      text: `### When Do You Actually Need to Upload a Receipt?

You don't need to stress over every single coffee receipt! Under **BIA Form 65**, receipts or proof are **mandatory only for Non-Discretionary deductions** that lower your payment:

- **Medical Condition Expenses**: Prescriptions for ongoing conditions, medical cannabis authorization, therapy, or medical gear not covered by provincial health insurance.
- **Child Care**: Daycare or babysitting receipts required so you can work.
- **Court-Ordered Support**: Written agreement or court order for child/spousal support you pay.
- **Mandatory Work Expenses**: Union dues, steel-toe safety boots, or tools required by your employer.

Everyday groceries, rent, and gas don't require receipts for your surplus formula—just upload your mandatory receipts in the **Receipts** tab or drop one right here!`
    };
  }

  if (p.includes('instacart') || p.includes('grocery') || p.includes('groceries') || p.includes('dining')) {
    return {
      text: `### Groceries vs. Dining Out on Form 65

- **Supermarket food & pantry groceries** (including grocery delivery like Instacart) belong under **Living Expenses → Food/Grocery**.
- **Takeout, coffee shops, or restaurant meals** belong under **Personal Expenses → Dining/Lunches/Restaurants**.

Neither category directly changes your monthly surplus payment because both fall inside your flat government living allowance—just pick whichever matches most closely!`
    };
  }

  if (p.includes('car') || p.includes('vehicle') || p.includes('gas') || p.includes('commut')) {
    return {
      text: `### Vehicles, Gas & Commuting Expenses

- **Gas, oil changes, and repairs** go under **Transportation Expenses → Repair/Maintenance/Gas**.
- **Bus/train/transit passes** go under **Transportation Expenses → Public Transportation**.
- **Car insurance** goes under **Insurance Expenses → Vehicle**.
- If you are keeping a financed car with a **secured car loan**, your monthly loan payment goes under **Payments → To Secured Creditor**.

Normal gas and car repairs fall under your everyday household living allowance, so they help document your budget for your trustee without directly changing the statutory surplus formula.`
    };
  }

  // Discharge timeline / duties
  if (p.includes('discharge') || p.includes('timeline') || p.includes('duties') || p.includes('finish') || p.includes('counsel')) {
    return {
      text: `### Your Step-by-Step Path to Discharge

Getting to your **Certificate of Discharge** (when your eligible debts are officially wiped clean) comes down to 4 simple steps:

1. **Attend 2 Counseling Sessions**: Short, supportive one-on-one sessions on budgeting and rebuilding credit.
2. **Submit Monthly Form 65 Reports**: Report your income and expenses by the **15th of every month** with paystubs/bank statements.
3. **Make Required Estate / Surplus Payments**: Stay on top of the monthly payments calculated with your trustee.
4. **Cooperate on Non-Exempt Assets**: Let your trustee handle anything not protected by provincial exemptions.

Your trustee (**${litName}**) and CleanSlate will guide you through each step one month at a time.`
    };
  }

  // General fallback
  return {
    text: `### I'm Here to Walk You Through This Step-by-Step

Bankruptcy paperwork can feel overwhelming, and there is no such thing as a silly question here! Ask me anything in plain English, and we'll walk through it together step-by-step.

For example, try asking:
- **"How do I count cash gifts from family and friends for the holidays and my birthday?"**
- **"What is the difference between Medical Condition Expenses and Prescriptions?"**
- **"Which categories are NOT counted toward my bankruptcy payment?"**
- **"How do I report multiple bank accounts, secured credit cards, and internal transfers?"**

Tell me what you're stuck on and we'll sort it out together!`
  };
}
