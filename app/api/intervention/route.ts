import { NextRequest, NextResponse } from 'next/server';

/**
 * Gemma 3 27B Behavioral Intervention API
 * 
 * Uses Google AI Studio's free REST API to call Gemma 3 27B.
 * No downloads needed — just an API key from https://aistudio.google.com/apikey
 * 
 * Set your key in .env.local:
 *   GOOGLE_AI_API_KEY=your_key_here
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GEMMA_MODEL = 'gemma-3-27b-it';
const GOOGLE_AI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`;

interface InterventionRequest {
  amount: number;
  category: string;
  description: string;
  monthlyBudget: number;
  monthlySpending: number;
  recentExpenses: Array<{
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
}

// Fallback intervention when Ollama is not available (for demo purposes)
function generateFallbackIntervention(data: InterventionRequest) {
  const remainingBudget = data.monthlyBudget - data.monthlySpending;
  const percentUsed = (data.monthlySpending / data.monthlyBudget) * 100;
  const afterPurchase = percentUsed + (data.amount / data.monthlyBudget) * 100;

  const recentExpenses = data.recentExpenses || [];

  // Analyze category frequency
  const categoryCount = recentExpenses.filter(e => e.category === data.category).length;
  const todayExpenses = recentExpenses.filter(e => {
    const expDate = new Date(e.date).toDateString();
    return expDate === new Date().toDateString();
  });
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical';
  if (afterPurchase > 100) severity = 'critical';
  else if (afterPurchase > 85) severity = 'high';
  else if (afterPurchase > 60 || categoryCount >= 3) severity = 'medium';
  else severity = 'low';

  let message: string;
  let recommendation: 'proceed' | 'caution' | 'stop';

  if (severity === 'critical') {
    message = `This purchase of Rs.${data.amount} will push you over your monthly budget. You've already spent Rs.${data.monthlySpending.toFixed(0)} of your Rs.${data.monthlyBudget} budget. After this, you'll be at ${afterPurchase.toFixed(0)}%. I strongly recommend reconsidering this expense.`;
    recommendation = 'stop';
  } else if (severity === 'high') {
    message = `You're at ${percentUsed.toFixed(0)}% of your budget with Rs.${remainingBudget.toFixed(0)} remaining. This Rs.${data.amount} ${data.category} expense will bring you to ${afterPurchase.toFixed(0)}%. ${categoryCount >= 2 ? `You've made ${categoryCount} ${data.category} purchases recently — this category is adding up.` : ''} Consider if this is essential.`;
    recommendation = 'caution';
  } else if (severity === 'medium') {
    if (todayTotal > data.monthlyBudget * 0.1) {
      message = `You've already spent Rs.${todayTotal.toFixed(0)} today. Adding Rs.${data.amount} for ${data.category} makes today a high-spend day. Your budget is at ${percentUsed.toFixed(0)}% — you have room, but be mindful of the pattern.`;
    } else if (categoryCount >= 3) {
      message = `You've logged ${categoryCount} ${data.category} expenses recently. This is becoming a pattern. Your overall budget is at ${percentUsed.toFixed(0)}%, so you can afford it, but watch this category closely.`;
    } else {
      message = `Your budget is at ${percentUsed.toFixed(0)}% with Rs.${remainingBudget.toFixed(0)} remaining. This Rs.${data.amount} purchase is reasonable. You're on track — just stay consistent.`;
    }
    recommendation = 'caution';
  } else {
    message = `You're well within your budget at ${percentUsed.toFixed(0)}%. Rs.${data.amount} for ${data.category} is perfectly fine. You still have Rs.${remainingBudget.toFixed(0)} available this month. Go ahead!`;
    recommendation = 'proceed';
  }

  return {
    severity,
    message,
    recommendation,
    budgetAfter: afterPurchase.toFixed(0),
    pattern: categoryCount >= 3 ? `Frequent ${data.category} spending detected` : null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const data: InterventionRequest = await req.json();

    // Try Google AI Studio with Gemma 3 27B
    if (GOOGLE_AI_API_KEY) {
      try {
        const recentExpenses = data.recentExpenses || [];
        const sameCatCount = recentExpenses.filter(e => e.category === data.category).length;
        const todaySpent = recentExpenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).reduce((s, e) => s + e.amount, 0);
        const budgetPct = ((data.monthlySpending / data.monthlyBudget) * 100).toFixed(0);
        const remaining = (data.monthlyBudget - data.monthlySpending).toFixed(0);
        const randomSeed = Math.floor(Math.random() * 1000);

        const prompt = `You are Gemma, the AI guardian inside Finguard — a behavioral finance app. You care deeply about the user's financial wellbeing. You speak like a protective friend: warm but honest. NEVER be generic. Always reference the SPECIFIC numbers below.

IMPORTANT: Each response must be UNIQUE. Vary your tone — sometimes be encouraging, sometimes stern, sometimes use an analogy or metaphor, sometimes ask a rhetorical question. Random seed for variety: ${randomSeed}.

User's financial snapshot:
- Monthly budget: Rs.${data.monthlyBudget} | Spent so far: Rs.${data.monthlySpending} (${budgetPct}%) | Left: Rs.${remaining}
- This purchase: Rs.${data.amount} for ${data.category}${data.description ? ` (${data.description})` : ''}
- Same category purchases recently: ${sameCatCount} times
- Today's total spending: Rs.${todaySpent.toFixed(0)}
- Total expenses logged: ${recentExpenses.length}

Rules:
1. Be 2-3 sentences MAX. Be specific — mention actual amounts.
2. If budget usage is under 50%, be supportive but still mention the numbers.
3. If 50-80%, gently warn with specific projections.
4. If over 80%, be firm and protective. Use urgency.
5. If this pushes over 100%, be very direct — tell them they cannot afford this.
6. If same category count >= 3, call out the pattern by name.
7. Pick ONE severity: low, medium, high, or critical.
8. Pick ONE recommendation: proceed, caution, or stop.

Respond with ONLY valid JSON (no markdown, no code blocks, no explanation):
{"severity":"low|medium|high|critical","message":"your unique intervention","recommendation":"proceed|caution|stop","pattern":"null or detected pattern"}`;

        const googleResponse = await fetch(`${GOOGLE_AI_URL}?key=${GOOGLE_AI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.95,
              maxOutputTokens: 300,
              topP: 0.95,
              topK: 40,
            },
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          const responseText = googleData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

          if (responseText) {
            try {
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({
                  ...parsed,
                  source: 'gemma-3-27b',
                  budgetAfter: (((data.monthlySpending + data.amount) / data.monthlyBudget) * 100).toFixed(0),
                });
              }
            } catch {
              return NextResponse.json({
                severity: 'medium',
                message: responseText.substring(0, 300),
                recommendation: 'caution',
                source: 'gemma-3-27b',
                budgetAfter: (((data.monthlySpending + data.amount) / data.monthlyBudget) * 100).toFixed(0),
              });
            }
          }
        } else {
          const errBody = await googleResponse.text();
          console.log('Google AI API error:', googleResponse.status, errBody);
        }
      } catch (err) {
        console.log('Google AI API call failed, using fallback:', err);
      }
    } else {
      console.log('No GOOGLE_AI_API_KEY set, using fallback intervention engine');
    }

    // Fallback: rule-based intervention
    const fallback = generateFallbackIntervention(data);
    return NextResponse.json({ ...fallback, source: 'fallback' });
  } catch (error) {
    console.error('Intervention API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate intervention' },
      { status: 500 }
    );
  }
}
