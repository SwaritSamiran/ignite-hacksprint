import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GEMMA_MODEL = 'gemma-3-27b-it';
const GOOGLE_AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      monthlyIncome, monthlyBudget, monthTotal,
      categoryBreakdown, daysElapsed, daysInMonth,
      savingsGoal, savingsTarget, transactionCount,
    } = data;

    const budgetPct = ((monthTotal / monthlyBudget) * 100).toFixed(1);
    const dailyAvg = Math.round(monthTotal / Math.max(daysElapsed, 1));
    const projectedSpend = Math.round((monthTotal / Math.max(daysElapsed, 1)) * daysInMonth);
    const projectedSave = Math.max(monthlyIncome - projectedSpend, 0);
    const daysLeft = Math.max(daysInMonth - daysElapsed, 1);
    const dailyBudgetLeft = Math.round(Math.max((monthlyBudget - monthTotal) / daysLeft, 0));
    const randomSeed = Math.floor(Math.random() * 10000);

    const catStr = Object.entries(categoryBreakdown || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([cat, amt]) => `${cat}: Rs.${amt}`)
      .join(', ');

    // Fallback insights (used when Gemma is unavailable)
    const fallbackInsights = [
      `You've spent Rs.${monthTotal.toLocaleString()} in ${daysElapsed} days — averaging Rs.${dailyAvg.toLocaleString()}/day.`,
      `At this pace, month-end spending: Rs.${projectedSpend.toLocaleString()}, saving Rs.${projectedSave.toLocaleString()}.`,
      parseFloat(budgetPct) < 80
        ? `Budget utilization: ${budgetPct}% — you're on track. Keep it up.`
        : `Budget utilization: ${budgetPct}% — tighten spending for the remaining ${daysLeft} days.`,
    ];

    if (!GOOGLE_AI_API_KEY) {
      return NextResponse.json({
        source: 'fallback',
        insights: fallbackInsights,
        monthEndForecast: `Projected: Rs.${projectedSpend.toLocaleString()} spending, Rs.${projectedSave.toLocaleString()} savings by month-end.`,
        savingsAdvice: projectedSave > 0
          ? `At Rs.${projectedSave.toLocaleString()}/month, you'll reach your ${savingsGoal} goal in ${Math.ceil(savingsTarget / projectedSave)} months.`
          : 'Reduce spending to start saving towards your goal.',
        spendingHealth: parseFloat(budgetPct) < 50 ? 'excellent' : parseFloat(budgetPct) < 80 ? 'good' : parseFloat(budgetPct) < 100 ? 'fair' : 'poor',
      });
    }

    const prompt = `You are Gemma, a sharp AI financial analyst inside Finguard. Give an honest, data-driven assessment referencing EXACT numbers from the data. No generic advice. Seed: ${randomSeed}

USER'S FINANCIAL SNAPSHOT:
- Monthly income: Rs.${monthlyIncome.toLocaleString()}
- Monthly budget limit: Rs.${monthlyBudget.toLocaleString()}
- Spent so far: Rs.${monthTotal.toLocaleString()} (${budgetPct}% of budget used)
- Days: ${daysElapsed} of ${daysInMonth} elapsed (${daysLeft} remaining)
- Daily average spending: Rs.${dailyAvg.toLocaleString()}
- Daily budget remaining: Rs.${dailyBudgetLeft.toLocaleString()}/day
- Projected month-end spending: Rs.${projectedSpend.toLocaleString()}
- Projected monthly savings: Rs.${projectedSave.toLocaleString()}
- Category breakdown: ${catStr || 'no expenses yet'}
- Savings goal: "${savingsGoal}" (target: Rs.${(savingsTarget || 100000).toLocaleString()})
- Total transactions: ${transactionCount}

RULES:
- 3 insights: one about spending pattern with specific Rs. amounts, one about budget health comparing spent vs budget, one actionable tip referencing their numbers.
- monthEndForecast: 1-2 sentences predicting month outcome. Reference projected spend vs budget.
- savingsAdvice: 1 sentence about reaching their ${savingsGoal} goal of Rs.${(savingsTarget || 100000).toLocaleString()}. Be specific about timeline.
- spendingHealth: "excellent" if <50% budget used, "good" if 50-80%, "fair" if 80-100%, "poor" if >100%.

Return ONLY valid JSON (no markdown, no code blocks):
{"insights":["...","...","..."],"monthEndForecast":"...","savingsAdvice":"...","spendingHealth":"excellent|good|fair|poor"}`;

    const response = await fetch(`${GOOGLE_AI_URL}?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 500, topP: 0.9, topK: 30 },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ ...parsed, source: 'gemma-3-27b' });
          }
        } catch {
          // JSON parse failed, use fallback
        }
      }
    }

    return NextResponse.json({
      source: 'fallback',
      insights: fallbackInsights,
      monthEndForecast: `Projected: Rs.${projectedSpend.toLocaleString()} spending, Rs.${projectedSave.toLocaleString()} savings.`,
      spendingHealth: parseFloat(budgetPct) < 50 ? 'excellent' : parseFloat(budgetPct) < 80 ? 'good' : parseFloat(budgetPct) < 100 ? 'fair' : 'poor',
    });
  } catch {
    return NextResponse.json({
      source: 'error',
      insights: ['Analysis temporarily unavailable.'],
      spendingHealth: 'good',
    }, { status: 500 });
  }
}
