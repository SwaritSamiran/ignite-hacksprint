import { InterventionRequestSchema, InsightsRequestSchema } from '@/lib/schemas';
import type { InterventionResponse, InsightsResponse } from '@/lib/schemas';
import { ZodError } from 'zod';

const GOOGLE_AI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
const GEMMA_MODEL = 'gemma-3-27b-it';
const GOOGLE_AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleValidationError(error: ZodError): ApiError {
  const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
  return new ApiError(400, `Validation error: ${messages}`, 'VALIDATION_ERROR');
}

export async function callGemmaAI(prompt: string): Promise<string | null> {
  if (!GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_AI_API_KEY not set, using fallback');
    return null;
  }

  try {
    const response = await fetch(`${GOOGLE_AI_URL}?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 500,
          topP: 0.9,
          topK: 30,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemma API error:', response.status, errorBody);
      return null;
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch (error) {
    console.error('Gemma API call failed:', error);
    return null;
  }
}

export async function generateIntervention(
  interventionData: typeof InterventionRequestSchema._type
): Promise<InterventionResponse> {
  try {
    // Validate input
    const validated = InterventionRequestSchema.parse(interventionData);

    const remaining = validated.monthly_budget - validated.monthly_spending;
    const percentUsed = (validated.monthly_spending / validated.monthly_budget) * 100;
    const afterPurchase =
      percentUsed + (validated.amount / validated.monthly_budget) * 100;

    const recentExpenses = validated.recent_expenses || [];
    const sameCatCount = recentExpenses.filter(
      (e) => e.category === validated.category
    ).length;
    const todaySpent = recentExpenses
      .filter((e) => new Date(e.date).toDateString() === new Date().toDateString())
      .reduce((s, e) => s + e.amount, 0);

    const randomSeed = Math.floor(Math.random() * 1000);

    const prompt = `You are Gemma, the AI guardian inside Finguard — a behavioral finance app. You care deeply about the user's financial wellbeing. You speak like a protective friend: warm but honest. NEVER be generic. Always reference the SPECIFIC numbers below.

IMPORTANT: Each response must be UNIQUE. Vary your tone — sometimes be encouraging, sometimes stern, sometimes use an analogy or metaphor, sometimes ask a rhetorical question. Random seed for variety: ${randomSeed}.

CRITICAL — ITEM-LEVEL PRICE CHECK:
You MUST match the description/category to the CLOSEST item below and check Rs.${validated.amount} against that SPECIFIC item's range:
- chai/tea: Rs.10-30
- coffee: Rs.50-200
- snack/samosa/vada pav: Rs.20-80
- burger: Rs.80-300
- pizza: Rs.150-600
- meal/lunch/dinner/thali: Rs.100-500
- biryani: Rs.150-400
- groceries/vegetables/fruits: Rs.200-3000
- sweets/dessert: Rs.50-300
- auto/rickshaw: Rs.30-200
- cab/uber/ola: Rs.100-800
- bus/metro/train ticket: Rs.10-100
- petrol/fuel: Rs.200-3000
- clothes/shirt/pants: Rs.300-3000
- shoes/footwear: Rs.500-5000
- phone/mobile: Rs.8000-50000
- laptop/computer: Rs.25000-100000
- rent/housing: Rs.5000-30000
- electricity/water bill: Rs.200-3000
- internet/wifi/recharge: Rs.200-1000
- movie/cinema: Rs.150-500
- subscription/netflix/spotify: Rs.100-700
- gym/fitness: Rs.500-3000
- medicine/pharmacy: Rs.50-2000
- doctor/consultation: Rs.200-2000

STEPS:
1. Identify which item above best matches "${validated.description || validated.category}"
2. If Rs.${validated.amount} is WITHIN or up to 1.5x the item's max → price is REASONABLE. Do NOT flag it.
3. If Rs.${validated.amount} is 1.5x-3x the item's max → WARN about the price being on the higher side.
4. If Rs.${validated.amount} is 3x+ above the item's max → FLAG IT CLEARLY as overpriced. Set severity to "high" or "critical" and recommendation to "caution" or "stop".
5. If no specific item matches, use the broad category and be lenient.

User's financial snapshot:
- Monthly budget: Rs.${validated.monthly_budget.toLocaleString()} | Spent so far: Rs.${validated.monthly_spending.toLocaleString()} (${percentUsed.toFixed(0)}%) | Left: Rs.${remaining.toLocaleString()}
- This purchase: Rs.${validated.amount} for ${validated.category}${validated.description ? ` (${validated.description})` : ''}
- Same category purchases recently: ${sameCatCount} times
- Today's total spending: Rs.${todaySpent.toFixed(0)}
- Total expenses logged: ${recentExpenses.length}

Rules:
1. Be 2-3 sentences MAX. Be specific — mention actual amounts.
2. If the PRICE is unreasonable for the specific item (3x+ above its max), flag it FIRST. This overrides budget rules.
3. If price is 1.5x-3x above max, mention it's pricey but evaluate with budget context too.
4. If price is within range, DO NOT mention pricing at all — focus only on budget health.
5. If budget usage is under 50%, be supportive but still mention the numbers.
6. If 50-80%, gently warn with specific projections.
7. If over 80%, be firm and protective. Use urgency.
8. If this pushes over 100%, be very direct — tell them they cannot afford this.
9. If same category count >= 3, call out the pattern by name.
10. Pick ONE severity: low, medium, high, or critical.
11. Pick ONE recommendation: proceed, caution, or stop.

Respond with ONLY valid JSON (no markdown, no code blocks, no explanation):
{"severity":"low|medium|high|critical","message":"your unique intervention","recommendation":"proceed|caution|stop","pattern":"null or detected pattern"}`;

    // Try to get Gemma's response
    if (GOOGLE_AI_API_KEY) {
      const response = await callGemmaAI(prompt);
      if (response) {
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              severity: parsed.severity || 'medium',
              message: parsed.message || 'Unable to analyze this expense.',
              recommendation: parsed.recommendation || 'caution',
              pattern: parsed.pattern || null,
              budget_after: afterPurchase.toFixed(0),
              source: 'gemma-3-27b',
            };
          }
        } catch (e) {
          console.error('Failed to parse Gemma response:', e);
        }
      }
    }

    // Fallback logic
    return generateFallbackIntervention({
      ...validated,
      percentUsed,
      afterPurchase,
      sameCatCount,
      todaySpent,
      description: validated.description,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleValidationError(error);
    }
    throw new ApiError(500, 'Failed to generate intervention', 'INTERVENTION_ERROR');
  }
}

// Item-specific price ranges for accurate price sanity checking
const ITEM_PRICES: Record<string, { min: number; max: number }> = {
  // Food items
  chai: { min: 10, max: 30 }, tea: { min: 10, max: 30 },
  coffee: { min: 50, max: 200 },
  snack: { min: 20, max: 80 }, samosa: { min: 20, max: 80 }, 'vada pav': { min: 20, max: 50 },
  burger: { min: 80, max: 300 },
  pizza: { min: 150, max: 600 },
  meal: { min: 100, max: 500 }, lunch: { min: 100, max: 500 }, dinner: { min: 100, max: 500 }, thali: { min: 100, max: 300 },
  biryani: { min: 150, max: 400 },
  groceries: { min: 200, max: 3000 }, vegetables: { min: 50, max: 1000 }, fruits: { min: 50, max: 1000 },
  sweets: { min: 50, max: 300 }, dessert: { min: 50, max: 300 },
  // Transport
  auto: { min: 30, max: 200 }, rickshaw: { min: 30, max: 200 },
  cab: { min: 100, max: 800 }, uber: { min: 100, max: 800 }, ola: { min: 100, max: 800 },
  bus: { min: 10, max: 100 }, metro: { min: 10, max: 60 }, train: { min: 10, max: 100 },
  petrol: { min: 200, max: 3000 }, fuel: { min: 200, max: 3000 },
  // Shopping
  clothes: { min: 300, max: 3000 }, shirt: { min: 300, max: 2000 }, pants: { min: 500, max: 3000 },
  shoes: { min: 500, max: 5000 }, footwear: { min: 300, max: 5000 },
  phone: { min: 8000, max: 50000 }, mobile: { min: 8000, max: 50000 },
  laptop: { min: 25000, max: 100000 }, computer: { min: 25000, max: 100000 },
  // Entertainment
  movie: { min: 150, max: 500 }, cinema: { min: 150, max: 500 },
  subscription: { min: 100, max: 700 }, netflix: { min: 100, max: 700 }, spotify: { min: 100, max: 200 },
  // Utilities
  rent: { min: 5000, max: 30000 },
  electricity: { min: 200, max: 3000 }, 'water bill': { min: 100, max: 1000 },
  internet: { min: 200, max: 1000 }, wifi: { min: 200, max: 1000 }, recharge: { min: 100, max: 1000 },
  gym: { min: 500, max: 3000 }, fitness: { min: 500, max: 3000 },
  medicine: { min: 50, max: 2000 }, pharmacy: { min: 50, max: 2000 },
  doctor: { min: 200, max: 2000 },
};

// Category-level fallback ranges (broader)
const CATEGORY_PRICES: Record<string, { min: number; max: number }> = {
  food: { min: 20, max: 3000 },
  transport: { min: 10, max: 3000 },
  shopping: { min: 100, max: 50000 },
  entertainment: { min: 100, max: 2000 },
  utilities: { min: 100, max: 30000 },
  other: { min: 50, max: 50000 },
};

function getItemPriceRange(description: string | undefined, category: string): { range: { min: number; max: number }; matched: string } {
  const desc = (description || '').toLowerCase();
  // Try to match description keywords to specific items
  for (const [item, range] of Object.entries(ITEM_PRICES)) {
    if (desc.includes(item)) {
      return { range, matched: item };
    }
  }
  // Fall back to broad category range
  return { range: CATEGORY_PRICES[category] || { min: 50, max: 50000 }, matched: category };
}

function generateFallbackIntervention(data: {
  amount: number;
  category: string;
  monthly_budget: number;
  monthly_spending: number;
  percentUsed: number;
  afterPurchase: number;
  recent_expenses: any[];
  sameCatCount: number;
  todaySpent: number;
  description?: string;
}): InterventionResponse {
  const remaining = data.monthly_budget - data.monthly_spending;

  // Item-specific price sanity check
  const { range: expectedRange, matched: matchedItem } = getItemPriceRange(data.description, data.category);
  const priceRatio = data.amount / expectedRange.max;
  const isPriceOverpriced = priceRatio >= 3;   // 3x+ above item max → flag hard
  const isPricePricey = priceRatio >= 1.5;      // 1.5x-3x → warn

  let severity: 'low' | 'medium' | 'high' | 'critical';
  let message: string;
  let recommendation: 'proceed' | 'caution' | 'stop';

  // PRICE SANITY CHECK: Flag if 3x+ above the specific item's max
  if (isPriceOverpriced) {
    severity = priceRatio >= 5 ? 'critical' : 'high';
    message = `Rs.${data.amount.toFixed(0)} for ${data.description || data.category}? That's way above typical pricing for ${matchedItem} (Rs.${expectedRange.min}-${expectedRange.max}). Double-check this amount.`;
    recommendation = priceRatio >= 5 ? 'stop' : 'caution';
  } else if (isPricePricey) {
    // 1.5x-3x: warn about price but factor in budget too
    severity = data.afterPurchase > 80 ? 'high' : 'medium';
    message = `Rs.${data.amount.toFixed(0)} is on the higher side for ${matchedItem} (typical: Rs.${expectedRange.min}-${expectedRange.max}). You have Rs.${remaining.toLocaleString()} left in your budget — make sure this is worth it.`;
    recommendation = 'caution';
  } else if (data.afterPurchase > 100) {
    severity = 'critical';
    message = `This purchase of Rs.${data.amount.toFixed(0)} will push you over your Rs.${data.monthly_budget.toLocaleString()} budget. You've already spent ${data.percentUsed.toFixed(0)}%. I strongly recommend reconsidering.`;
    recommendation = 'stop';
  } else if (data.afterPurchase > 85) {
    severity = 'high';
    message = `You're at ${data.percentUsed.toFixed(0)}% of your budget. This Rs.${data.amount.toFixed(0)} ${data.category} expense will bring you to ${data.afterPurchase.toFixed(0)}%. ${data.sameCatCount >= 2 ? `You've made ${data.sameCatCount} ${data.category} purchases recently.` : ''} Consider if this is essential.`;
    recommendation = 'caution';
  } else if (data.afterPurchase > 60 || data.sameCatCount >= 3) {
    severity = 'medium';
    if (data.todaySpent > data.monthly_budget * 0.1) {
      message = `You've already spent Rs.${data.todaySpent.toFixed(0)} today. Adding Rs.${data.amount.toFixed(0)} for ${data.category} makes today a high-spend day. Be mindful of the pattern.`;
    } else if (data.sameCatCount >= 3) {
      message = `You've logged ${data.sameCatCount} ${data.category} expenses recently. This is becoming a pattern. You have Rs.${remaining.toLocaleString()} left, so you can afford it, but watch this category closely.`;
    } else {
      message = `Your budget is at ${data.percentUsed.toFixed(0)}% with Rs.${remaining.toLocaleString()} remaining. This Rs.${data.amount.toFixed(0)} purchase is reasonable. Stay consistent.`;
    }
    recommendation = 'caution';
  } else {
    severity = 'low';
    message = `You're well within your budget at ${data.percentUsed.toFixed(0)}%. Rs.${data.amount.toFixed(0)} for ${data.category} is perfectly fine. You still have Rs.${remaining.toLocaleString()} available. Go ahead!`;
    recommendation = 'proceed';
  }

  return {
    severity,
    message,
    recommendation,
    pattern: data.sameCatCount >= 3 ? `Frequent ${data.category} spending detected` : null,
    budget_after: data.afterPurchase.toFixed(0),
    source: 'fallback',
  };
}

export async function generateInsights(
  insightsData: typeof InsightsRequestSchema._type
): Promise<InsightsResponse> {
  try {
    const validated = InsightsRequestSchema.parse(insightsData);

    const budgetPct = ((validated.month_total / validated.monthly_budget) * 100).toFixed(1);
    const dailyAvg = Math.round(
      validated.month_total / Math.max(validated.days_elapsed, 1)
    );
    const projectedSpend = Math.round(
      (validated.month_total / Math.max(validated.days_elapsed, 1)) *
        validated.days_in_month
    );
    const projectedSave = Math.max(validated.monthly_income - projectedSpend, 0);
    const daysLeft = Math.max(validated.days_in_month - validated.days_elapsed, 1);
    const budgetRemaining = Math.max(validated.monthly_budget - validated.month_total, 0);
    const randomSeed = Math.floor(Math.random() * 10000);

    const catStr = Object.entries(validated.category_breakdown || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([cat, amt]) => `${cat}: Rs.${(amt as number).toLocaleString()}`)
      .join(', ');

    const prompt = `You are Gemma, a sharp AI financial analyst inside Finguard. Give an honest, data-driven assessment referencing EXACT numbers from the data. No generic advice. Seed: ${randomSeed}

USER'S FINANCIAL SNAPSHOT:
- Monthly income: Rs.${validated.monthly_income.toLocaleString()}
- Monthly budget limit: Rs.${validated.monthly_budget.toLocaleString()}
- Spent so far: Rs.${validated.month_total.toLocaleString()} (${budgetPct}% of budget used)
- Days: ${validated.days_elapsed} of ${validated.days_in_month} elapsed (${daysLeft} remaining)
- Monthly budget remaining: Rs.${budgetRemaining.toLocaleString()}
- Daily average spending: Rs.${dailyAvg.toLocaleString()}
- Projected month-end spending: Rs.${projectedSpend.toLocaleString()}
- Projected monthly savings: Rs.${projectedSave.toLocaleString()}
- Category breakdown: ${catStr || 'no expenses yet'}
- Savings goal: "${validated.savings_goal}" (target: Rs.${validated.savings_target.toLocaleString()})
- Total transactions: ${validated.transaction_count}

RULES:
- 3 insights: one about spending pattern with specific Rs. amounts, one about budget health comparing spent vs budget, one actionable tip referencing their numbers.
- monthEndForecast: 1-2 sentences predicting month outcome. Reference projected spend vs budget.
- savingsAdvice: 1 sentence about reaching their ${validated.savings_goal} goal of Rs.${validated.savings_target.toLocaleString()}. Be specific about timeline.
- spendingHealth: "excellent" if <50% budget used, "good" if 50-80%, "fair" if 80-100%, "poor" if >100%.

Return ONLY valid JSON (no markdown, no code blocks):
{"insights":["...","...","..."],"monthEndForecast":"...","savingsAdvice":"...","spendingHealth":"excellent|good|fair|poor"}`;

    if (GOOGLE_AI_API_KEY) {
      const response = await callGemmaAI(prompt);
      if (response) {
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              insights: parsed.insights || [],
              month_end_forecast: parsed.monthEndForecast || '',
              savings_advice: parsed.savingsAdvice || '',
              spending_health:
                parsed.spendingHealth || 'fair',
              source: 'gemma-3-27b',
            };
          }
        } catch (e) {
          console.error('Failed to parse insights response:', e);
        }
      }
    }

    // Fallback insights
    const fallbackInsights: InsightsResponse = {
      insights: [
        `You've spent Rs.${validated.month_total.toLocaleString()} in ${validated.days_elapsed} days — averaging Rs.${dailyAvg.toLocaleString()}/day.`,
        `At this pace, month-end spending: Rs.${projectedSpend.toLocaleString()}, saving Rs.${projectedSave.toLocaleString()}.`,
        parseFloat(budgetPct) < 80
          ? `Budget utilization: ${budgetPct}% — you're on track. Keep it up.`
          : `Budget utilization: ${budgetPct}% — tighten spending for the remaining ${daysLeft} days.`,
      ],
      month_end_forecast: `Projected: Rs.${projectedSpend.toLocaleString()} spending, Rs.${projectedSave.toLocaleString()} savings by month-end.`,
      savings_advice:
        projectedSave > 0
          ? `At Rs.${projectedSave.toLocaleString()}/month, you'll reach your ${validated.savings_goal} goal in ${Math.ceil(validated.savings_target / projectedSave)} months.`
          : 'Reduce spending to start saving towards your goal.',
      spending_health:
        parseFloat(budgetPct) < 50
          ? 'excellent'
          : parseFloat(budgetPct) < 80
          ? 'good'
          : parseFloat(budgetPct) < 100
          ? 'fair'
          : 'poor',
      source: 'fallback',
    };

    return fallbackInsights;
  } catch (error) {
    if (error instanceof ZodError) {
      throw handleValidationError(error);
    }
    throw new ApiError(500, 'Failed to generate insights', 'INSIGHTS_ERROR');
  }
}
