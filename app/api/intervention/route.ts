import { NextRequest, NextResponse } from 'next/server';
import { generateIntervention } from '@/lib/ai-service';
import { InterventionRequestSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

/**
 * POST /api/intervention
 * Generates a behavioral intervention using Gemma 3 27B
 * 
 * Request body should match InterventionRequestSchema
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate and generate intervention
    const intervention = await generateIntervention(body);
    return NextResponse.json(intervention);
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

    console.error('Intervention API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate intervention',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
