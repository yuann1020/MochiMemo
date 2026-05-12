import { getEdgeFunctionAuthHeaders } from '@/services/supabase/auth';
import { supabase } from '@/services/supabase/client';
import type { AIInsightsResult } from '@/types/ai';

const INSIGHTS_FUNCTION = 'generate-insights';

export async function generateInsights(): Promise<AIInsightsResult> {
  const { data, error } = await supabase.functions.invoke<AIInsightsResult>(
    INSIGHTS_FUNCTION,
    {
      headers: await getEdgeFunctionAuthHeaders(),
      body: { period: 'month' },
    },
  );

  if (error) {
    throw new Error(error.message || 'Failed to generate insights.');
  }

  if (!data || typeof data.summary?.headline !== 'string') {
    throw new Error('Invalid insights response from server.');
  }

  return data;
}
