import { GoogleGenAI, Type } from '@google/genai';

export interface FinancialInsightResult {
  success: boolean;
  category: string;
  amount: number;
  tip: string;
  estimatedSavings: string;
  impact: string;
}

export async function generateFinancialInsightWithAI(
  category: string,
  amount: number,
  month: string,
  householdSize: number = 2
): Promise<FinancialInsightResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  const defaultTips: Record<string, { tip: string; savings: string; impact: string }> = {
    'Food & Grocery': {
      tip: 'Plan weekly meals around provincial flyer specials using the Flipp app at discount grocers (No Frills, FreshCo, Food Basics). Purchasing pantry staples and seasonal vegetables in bulk can noticeably reduce grocery checkout totals.',
      savings: '$85 - $130 / month',
      impact: 'Trimming grocery bills keeps your monthly net income well below the statutory OSB surplus threshold, preventing unexpected estate payment increases.'
    },
    'Repair, Maintenance & Gas': {
      tip: 'Group your weekly errands into single-trip loops and check GasBuddy for neighbourhood price fluctuations. Maintaining proper tire pressure also optimizes fuel economy by up to 4%.',
      savings: '$40 - $70 / month',
      impact: 'Every dollar saved on commuting expense stays directly in your household budget rather than increasing surplus income exposure.'
    },
    'Dining Out / Takeout': {
      tip: 'Replace two weekly takeout orders with easy sheet-pan home cooking or freezer meals. Preparing coffee and packed lunches at home makes a quick, painless difference.',
      savings: '$110 - $160 / month',
      impact: 'Discretionary dining is scrutinized by trustees; lowering this category shows commendable financial rehabilitation on Form 65 filings.'
    },
    'Smoking & Personal': {
      tip: 'Gradually taper discretionary personal purchases or explore provincial cessation coverage through provincial health plans which often fund nicotine replacement therapy 100%.',
      savings: '$90 - $150 / month',
      impact: 'Redirecting personal habits into basic savings builds an essential post-discharge emergency buffer.'
    },
    'Telephone & Digital Utilities': {
      tip: 'Review mobile carrier plans for regional promotions (e.g. Koodo, Fido, Public Mobile) and eliminate unused subscription streaming bundles that auto-renew monthly.',
      savings: '$35 - $65 / month',
      impact: 'Fixed utility reductions permanently widen your discretionary margin throughout your 9-month bankruptcy term.'
    }
  };

  const fallback = defaultTips[category] || {
    tip: `Review monthly receipts for ${category} and identify recurring non-essential items that can be paused or substituted with lower-cost Canadian alternatives.`,
    savings: '$50 - $90 / month',
    impact: 'Consistent spending restraint ensures your monthly surplus income remains at the baseline target.'
  };

  if (!apiKey) {
    return {
      success: true,
      category,
      amount,
      tip: fallback.tip,
      estimatedSavings: fallback.savings,
      impact: fallback.impact
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an empathetic, practical Canadian financial coach helping someone successfully navigate personal bankruptcy discharge under the Bankruptcy and Insolvency Act (BIA).
Based on their previous monthly report for ${month}, their highest spending category was "${category}" ($${amount.toFixed(2)} CAD) for a household of ${householdSize}.
Provide ONE actionable, high-impact "money-saving tip" tailored specifically to ${category} in Canada. Keep the tone encouraging, respectful, and realistic.

Respond in JSON matching the schema.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: {
              type: Type.STRING,
              description: 'Actionable 2-3 sentence money-saving advice for this category',
            },
            estimatedSavings: {
              type: Type.STRING,
              description: 'Estimated monthly dollar savings, e.g. "$75 - $120 / month"',
            },
            impact: {
              type: Type.STRING,
              description: '1 sentence explaining how this protects their statutory surplus income obligation or helps early discharge',
            },
          },
          required: ['tip', 'estimatedSavings', 'impact'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      success: true,
      category,
      amount,
      tip: parsed.tip || fallback.tip,
      estimatedSavings: parsed.estimatedSavings || fallback.savings,
      impact: parsed.impact || fallback.impact
    };
  } catch (error: any) {
    console.warn('Gemini financial insight note (using expert fallback):', error);
    return {
      success: true,
      category,
      amount,
      tip: fallback.tip,
      estimatedSavings: fallback.savings,
      impact: fallback.impact
    };
  }
}
