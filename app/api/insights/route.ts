import { NextRequest, NextResponse } from 'next/server';
import { generateInsights } from '@/lib/ai-service';
import { InsightsRequestSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

/**
 * POST /api/insights
 * Generates financial insights and analysis using Gemma 3 27B
 * 
 * Request body should match InsightsRequestSchema
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate and generate insights
    const insights = await generateInsights(body);
    return NextResponse.json(insights);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.error('Insights API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate insights',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
