type ServeHandler = (request: Request) => Response | Promise<Response>;

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: ServeHandler): void;
};

// ─── Domain types ─────────────────────────────────────────────────────────────

interface ProfileRow {
  display_name: string | null;
  currency: string | null;
  monthly_budget: number | string | null;
}

interface ExpenseRow {
  amount: number | string;
  merchant: string;
  category: string;
  spent_at: string;
}

interface CategoryStat {
  category: string;
  total: number;
  count: number;
  percent: number;
}

interface WeekTotal {
  label: string;
  total: number;
}

interface ComputedStats {
  expenseCount: number;
  monthlyBudget: number;
  monthlySpent: number;
  remainingBudget: number;
  budgetUsedPercent: number;
  categoryTotals: CategoryStat[];
  topCategory: CategoryStat | null;
  highestExpense: { merchant: string; amount: number; category: string } | null;
  weeklyTotals: WeekTotal[];
  previousMonthSpent: number;
  monthOverMonthChange: number | null;
  currency: string;
  // Spending pace fields
  daysInMonth: number;
  currentDayOfMonth: number;
  monthElapsedPercent: number;
  daysRemaining: number;
  averageDailySpend: number;
  projectedMonthEndSpend: number;
  budgetPaceStatus: 'on_track' | 'ahead_of_budget' | 'over_pace';
}

// ─── Insight output types (mirrors types/ai.ts) ───────────────────────────────

interface AIInsightsResult {
  summary: { headline: string; description: string; tone: string };
  cards: { title: string; value: string; description: string; severity: string }[];
  recommendations: { title: string; description: string; estimatedImpact: string }[];
  patterns: { title: string; description: string }[];
  generatedAt: string;
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Validate session and extract userId
    const authResult = await authenticateAndGetUserId(request);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    // 2. Check required secrets
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      return json({ error: 'OPENAI_API_KEY is not configured for this Edge Function.' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Supabase environment is not configured.' }, 500);
    }

    // 3. Fetch user profile
    const profile = await fetchProfile(userId, supabaseUrl, serviceRoleKey);
    const displayName = typeof profile?.display_name === 'string' ? profile.display_name : 'there';
    const currency = normalizeCurrency(profile?.currency);
    const monthlyBudget = safeNumber(profile?.monthly_budget) || 2000;

    // 4. Fetch current + previous month expenses
    const now = new Date();
    const { monthStart, monthEnd, prevMonthStart, prevMonthEnd } = getMonthRanges(now);

    const [currentExpenses, prevExpenses] = await Promise.all([
      fetchExpenses(userId, monthStart, monthEnd, supabaseUrl, serviceRoleKey),
      fetchExpenses(userId, prevMonthStart, prevMonthEnd, supabaseUrl, serviceRoleKey),
    ]);

    // 5. Compute stats server-side
    const stats = computeStats(currentExpenses, prevExpenses, monthlyBudget, currency, now);

    // 6. Call OpenAI structured output
    const model =
      Deno.env.get('OPENAI_INSIGHTS_MODEL') ??
      Deno.env.get('OPENAI_EXPENSE_MODEL') ??
      'gpt-4o-mini';

    const insights = await generateInsightsFromOpenAI(
      openAiApiKey,
      model,
      displayName,
      currency,
      stats,
      now,
    );

    return json(insights);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected error generating insights.';
    return json({ error: message }, 500);
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function authenticateAndGetUserId(
  request: Request,
): Promise<{ userId: string } | Response> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return json({ error: 'Authentication required.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Supabase auth environment is not configured.' }, 500);
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      authorization: authHeader,
      apikey: supabaseAnonKey,
    },
  });

  if (!response.ok) {
    return json({ error: 'Invalid or expired session.' }, 401);
  }

  const body = await response.json().catch(() => null);
  const userId = isRecord(body) ? body.id : null;
  if (typeof userId !== 'string' || !userId) {
    return json({ error: 'Could not read user identity from session.' }, 401);
  }

  return { userId };
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────

async function fetchProfile(
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<ProfileRow | null> {
  const url =
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/profiles` +
    `?id=eq.${encodeURIComponent(userId)}` +
    `&select=display_name,currency,monthly_budget` +
    `&limit=1`;

  const res = await fetch(url, { headers: dbHeaders(serviceRoleKey) });
  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  return Array.isArray(data) && data.length > 0 ? (data[0] as ProfileRow) : null;
}

async function fetchExpenses(
  userId: string,
  startIso: string,
  endIso: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<ExpenseRow[]> {
  const url =
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/expenses` +
    `?profile_id=eq.${encodeURIComponent(userId)}` +
    `&spent_at=gte.${encodeURIComponent(startIso)}` +
    `&spent_at=lte.${encodeURIComponent(endIso)}` +
    `&select=amount,merchant,category,spent_at` +
    `&order=spent_at.desc` +
    `&limit=200`;

  const res = await fetch(url, { headers: dbHeaders(serviceRoleKey) });
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  return Array.isArray(data) ? (data as ExpenseRow[]) : [];
}

function dbHeaders(serviceRoleKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
    Accept: 'application/json',
  };
}

// ─── Stats computation ────────────────────────────────────────────────────────

function computeStats(
  current: ExpenseRow[],
  prev: ExpenseRow[],
  monthlyBudget: number,
  currency: string,
  now: Date,
): ComputedStats {
  const monthlySpent = round2(current.reduce((s, e) => s + safeNumber(e.amount), 0));
  const previousMonthSpent = round2(prev.reduce((s, e) => s + safeNumber(e.amount), 0));
  const remainingBudget = round2(monthlyBudget - monthlySpent);
  const budgetUsedPercent =
    monthlyBudget > 0 ? Math.min(100, Math.round((monthlySpent / monthlyBudget) * 100)) : 0;

  const catMap = new Map<string, { total: number; count: number }>();
  for (const e of current) {
    const cat = String(e.category || 'Other');
    const entry = catMap.get(cat) ?? { total: 0, count: 0 };
    entry.total += safeNumber(e.amount);
    entry.count += 1;
    catMap.set(cat, entry);
  }

  const categoryTotals: CategoryStat[] = [...catMap.entries()]
    .map(([category, { total, count }]) => ({
      category,
      total: round2(total),
      count,
      percent: monthlySpent > 0 ? Math.round((total / monthlySpent) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const topCategory = categoryTotals[0] ?? null;

  let highestExpense: ComputedStats['highestExpense'] = null;
  for (const e of current) {
    const amount = safeNumber(e.amount);
    if (!highestExpense || amount > highestExpense.amount) {
      highestExpense = {
        merchant: String(e.merchant || 'Unknown'),
        amount: round2(amount),
        category: String(e.category || 'Other'),
      };
    }
  }

  const weeklyTotals = buildWeeklyTotals(current, now);

  const monthOverMonthChange =
    previousMonthSpent > 0
      ? Math.round(((monthlySpent - previousMonthSpent) / previousMonthSpent) * 100)
      : null;

  // Spending pace — compare budget consumption rate to time elapsed
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDayOfMonth = now.getDate();
  const monthElapsedPercent = Math.round((currentDayOfMonth / daysInMonth) * 100);
  const daysRemaining = daysInMonth - currentDayOfMonth;
  const averageDailySpend = currentDayOfMonth > 0 ? round2(monthlySpent / currentDayOfMonth) : 0;
  const projectedMonthEndSpend = round2(averageDailySpend * daysInMonth);
  const budgetPaceStatus =
    budgetUsedPercent > monthElapsedPercent + 10
      ? 'over_pace'
      : budgetUsedPercent > monthElapsedPercent + 5
        ? 'ahead_of_budget'
        : 'on_track';

  return {
    expenseCount: current.length,
    monthlyBudget,
    monthlySpent,
    remainingBudget,
    budgetUsedPercent,
    categoryTotals,
    topCategory,
    highestExpense,
    weeklyTotals,
    previousMonthSpent,
    monthOverMonthChange,
    currency,
    daysInMonth,
    currentDayOfMonth,
    monthElapsedPercent,
    daysRemaining,
    averageDailySpend,
    projectedMonthEndSpend,
    budgetPaceStatus,
  };
}

function buildWeeklyTotals(expenses: ExpenseRow[], now: Date): WeekTotal[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const weeks = [
    { label: 'Week 1', start: 1, end: 7 },
    { label: 'Week 2', start: 8, end: 14 },
    { label: 'Week 3', start: 15, end: 21 },
    { label: 'Week 4', start: 22, end: 31 },
  ];

  return weeks.map((week) => {
    const total = expenses
      .filter((e) => {
        const d = new Date(e.spent_at);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() >= week.start &&
          d.getDate() <= week.end
        );
      })
      .reduce((s, e) => s + safeNumber(e.amount), 0);
    return { label: week.label, total: round2(total) };
  });
}

function getMonthRanges(now: Date): {
  monthStart: string;
  monthEnd: string;
  prevMonthStart: string;
  prevMonthEnd: string;
} {
  const y = now.getFullYear();
  const m = now.getMonth();

  const monthStart = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
  const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();

  const pm = m - 1;
  const py = pm < 0 ? y - 1 : y;
  const pmn = pm < 0 ? 11 : pm;

  const prevMonthStart = new Date(py, pmn, 1, 0, 0, 0, 0).toISOString();
  const prevMonthEnd = new Date(py, pmn + 1, 0, 23, 59, 59, 999).toISOString();

  return { monthStart, monthEnd, prevMonthStart, prevMonthEnd };
}

// ─── OpenAI call ──────────────────────────────────────────────────────────────

async function generateInsightsFromOpenAI(
  apiKey: string,
  model: string,
  displayName: string,
  currency: string,
  stats: ComputedStats,
  now: Date,
): Promise<AIInsightsResult> {
  const periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const spendingData = {
    user: { displayName, currency },
    currentMonth: {
      period: periodLabel,
      expenseCount: stats.expenseCount,
      monthlyBudget: stats.monthlyBudget,
      monthlySpent: stats.monthlySpent,
      remainingBudget: stats.remainingBudget,
      budgetUsedPercent: stats.budgetUsedPercent,
      topCategory: stats.topCategory,
      highestExpense: stats.highestExpense,
      categoryTotals: stats.categoryTotals,
      weeklyTotals: stats.weeklyTotals,
      // Spending pace
      daysInMonth: stats.daysInMonth,
      currentDayOfMonth: stats.currentDayOfMonth,
      monthElapsedPercent: stats.monthElapsedPercent,
      daysRemaining: stats.daysRemaining,
      averageDailySpend: stats.averageDailySpend,
      projectedMonthEndSpend: stats.projectedMonthEndSpend,
      budgetPaceStatus: stats.budgetPaceStatus,
    },
    previousMonth: {
      monthlySpent: stats.previousMonthSpent,
      monthOverMonthChange: stats.monthOverMonthChange,
    },
  };

  const hasLimitedData = stats.expenseCount < 3;

  const systemPrompt = [
    `You are a personal finance AI assistant for MochiMemo, a spending tracker for young professionals in Malaysia.`,
    `Generate spending insights based ONLY on the provided data. Do NOT invent amounts, merchants, or categories.`,

    // Currency instruction
    `Use "RM" for Malaysian Ringgit in all text (e.g. "RM 68", not "MYR 68" or "68 MYR").`,

    // Tone rules based on spending pace — these are mandatory
    `TONE RULES (you MUST follow these, they override any default positive framing):`,
    `- If budgetPaceStatus is "over_pace" (budgetUsedPercent > monthElapsedPercent + 10): tone MUST be "warning". Clearly state the user is spending faster than the month is passing.`,
    `- If projectedMonthEndSpend > monthlyBudget: tone MUST be "warning" regardless of other factors.`,
    `- If budgetPaceStatus is "ahead_of_budget": use "neutral" tone. Acknowledge the user is slightly ahead of pace without being alarmist.`,
    `- Only use "positive" tone if budgetPaceStatus is "on_track" AND projectedMonthEndSpend <= monthlyBudget.`,
    `- NEVER say "controlled start", "great start", "on track", or any positive phrase if budgetPaceStatus is "over_pace".`,
    `- If spending is concentrated in one day or one category (single expense is >40% of total), mention it specifically.`,

    // Content rules
    hasLimitedData
      ? `The user has only ${stats.expenseCount} expense(s) this month. Acknowledge limited data. Provide 2–3 cards and 1 recommendation focused on building the habit.`
      : `Provide exactly 3–4 insight cards, 1–2 actionable recommendations, and 1–2 spending patterns.`,

    `Be honest, direct, and practical. A user with RM 120 spent at day 3 of a RM 600 month is spending at 3x the ideal daily rate — say so clearly.`,
    `Recommendations must be specific and actionable (not generic).`,
    `Set generatedAt to the current ISO timestamp.`,
  ].join(' ');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_output_tokens: 1400,
      input: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate spending insights based on this data:\n${JSON.stringify(spendingData, null, 2)}`,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'spending_insights',
          strict: true,
          schema: insightsJsonSchema(),
        },
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI insights call failed: ${readOpenAiError(body) ?? response.status}`);
  }

  const outputText = readOutputText(body);
  if (!outputText) throw new Error('OpenAI did not return structured insights JSON.');

  const result = JSON.parse(outputText) as AIInsightsResult;
  result.generatedAt = new Date().toISOString();
  return result;
}

function insightsJsonSchema(): unknown {
  const toneEnum = { type: 'string', enum: ['positive', 'neutral', 'warning'] };
  const severityEnum = { type: 'string', enum: ['info', 'positive', 'warning'] };

  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'cards', 'recommendations', 'patterns', 'generatedAt'],
    properties: {
      summary: {
        type: 'object',
        additionalProperties: false,
        required: ['headline', 'description', 'tone'],
        properties: {
          headline: { type: 'string' },
          description: { type: 'string' },
          tone: toneEnum,
        },
      },
      cards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'value', 'description', 'severity'],
          properties: {
            title: { type: 'string' },
            value: { type: 'string' },
            description: { type: 'string' },
            severity: severityEnum,
          },
        },
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'description', 'estimatedImpact'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            estimatedImpact: { type: 'string' },
          },
        },
      },
      patterns: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      generatedAt: { type: 'string' },
    },
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function readOutputText(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.output_text === 'string') return value.output_text;

  const output = Array.isArray(value.output) ? value.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === 'string') return content.text;
    }
  }

  return null;
}

function readOpenAiError(value: unknown): unknown {
  if (!isRecord(value)) return null;
  const error = value.error;
  if (!isRecord(error)) return null;
  return typeof error.message === 'string' ? error.message : error;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeCurrency(value: unknown): string {
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if (/^[A-Z]{2,4}$/.test(upper)) return upper;
  }
  return 'MYR';
}
