type ServeHandler = (request: Request) => Response | Promise<Response>;

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: ServeHandler): void;
};

interface ExpenseExtractionResult {
  expenses: {
    amount: number;
    currency: string;
    merchant: string;
    category: string;
    date: string;
    note: string;
    confidence: number;
  }[];
  needsClarification: boolean;
  clarificationQuestion: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const categoryOptions = [
  'Food & Drinks',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Utilities',
  'Education',
  'Other',
];

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      return json({ error: 'OPENAI_API_KEY is not configured for this Edge Function.' }, 500);
    }

    const body = await readJsonBody(request);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const currency = normalizeCurrency(body.currency);

    if (!text) {
      return json({
        expenses: [],
        needsClarification: true,
        clarificationQuestion: 'What did you spend, and how much was it?',
      } satisfies ExpenseExtractionResult);
    }

    const model = Deno.env.get('OPENAI_EXPENSE_MODEL') ?? 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_output_tokens: 900,
        input: [
          {
            role: 'system',
            content: [
              'You extract personal expense data from short Malaysian spending notes.',
              'Return only expenses that are present in the user text.',
              'Support multiple expenses in one sentence.',
              `Use ${currency} as the currency unless the user clearly specifies another currency.`,
              'Use merchant as the item, place, or service name. If unknown, use "Unknown".',
              `Choose category from: ${categoryOptions.join(', ')}.`,
              'Use "today" for relative current-day spending. Preserve explicit dates if present.',
              'Confidence is a decimal from 0 to 1.',
              'If confidence is below 0.75, set needsClarification true and ask one short clarification question.',
              'Do not invent amounts, merchants, or dates that are not implied by the text.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `Extract expenses from this text:\n${text}`,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'expense_extraction_result',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['expenses', 'needsClarification', 'clarificationQuestion'],
              properties: {
                expenses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: [
                      'amount',
                      'currency',
                      'merchant',
                      'category',
                      'date',
                      'note',
                      'confidence',
                    ],
                    properties: {
                      amount: { type: 'number', minimum: 0 },
                      currency: { type: 'string' },
                      merchant: { type: 'string' },
                      category: { type: 'string', enum: categoryOptions },
                      date: { type: 'string' },
                      note: { type: 'string' },
                      confidence: { type: 'number', minimum: 0, maximum: 1 },
                    },
                  },
                },
                needsClarification: { type: 'boolean' },
                clarificationQuestion: {
                  anyOf: [{ type: 'string' }, { type: 'null' }],
                },
              },
            },
          },
        },
      }),
    });

    const openAiBody = await response.json();
    if (!response.ok) {
      return json(
        {
          error: 'OpenAI expense extraction failed.',
          details: readOpenAiError(openAiBody),
        },
        response.status,
      );
    }

    const outputText = readOutputText(openAiBody);
    if (!outputText) {
      return json({ error: 'OpenAI did not return structured expense JSON.' }, 502);
    }

    const result = sanitizeResult(JSON.parse(outputText), currency);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected extraction error.';
    return json({ error: message }, 500);
  }
});

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return isRecord(body) ? body : {};
}

function normalizeCurrency(value: unknown): string {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? value : 'MYR';
}

function sanitizeResult(value: unknown, currency: string): ExpenseExtractionResult {
  const source = isRecord(value) ? value : {};
  const rawExpenses = Array.isArray(source.expenses) ? source.expenses : [];
  const expenses = rawExpenses
    .filter(isRecord)
    .map((expense) => ({
      amount: safeNumber(expense.amount),
      currency: normalizeCurrency(expense.currency ?? currency),
      merchant: safeText(expense.merchant, 'Unknown'),
      category: categoryOptions.includes(String(expense.category)) ? String(expense.category) : 'Other',
      date: safeText(expense.date, 'today'),
      note: safeText(expense.note, 'Expense'),
      confidence: clamp(safeNumber(expense.confidence), 0, 1),
    }))
    .filter((expense) => expense.amount > 0);

  const lowestConfidence = expenses.reduce(
    (lowest, expense) => Math.min(lowest, expense.confidence),
    1,
  );
  const needsClarification =
    source.needsClarification === true || expenses.length === 0 || lowestConfidence < 0.75;
  const clarificationQuestion =
    typeof source.clarificationQuestion === 'string' && source.clarificationQuestion.trim()
      ? source.clarificationQuestion.trim()
      : needsClarification
        ? 'Can you confirm the missing expense details?'
        : null;

  return { expenses, needsClarification, clarificationQuestion };
}

function readOutputText(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.output_text === 'string') return value.output_text;

  const output = Array.isArray(value.output) ? value.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (typeof content.text === 'string') return content.text;
    }
  }

  return null;
}

function readOpenAiError(value: unknown): unknown {
  if (!isRecord(value)) return null;
  const error = value.error;
  if (!isRecord(error)) return null;
  if (typeof error.message === 'string') return error.message;
  return error;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
