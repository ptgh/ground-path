/**
 * ms-kb-search
 *
 * Semantic search over the Groundpath knowledge base.
 * Embeds the query, runs `kb_search` RPC, returns top matches.
 * Admin + allow-list gated.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
} from '../_shared/m365.ts';

const BodySchema = z.object({
  query: z.string().min(2).max(2000),
  matchCount: z.number().int().min(1).max(20).default(6),
  minSimilarity: z.number().min(0).max(1).default(0.6),
});

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!res.ok) {
    throw new Error(`Embedding failed [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);

  try {
    const embedding = await embedQuery(parsed.data.query);
    const { data, error } = await guard.caller!.serviceClient.rpc('kb_search', {
      query_embedding: embedding as unknown as string,
      match_count: parsed.data.matchCount,
      min_similarity: parsed.data.minSimilarity,
    });
    if (error) throw new Error(error.message);

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-kb-search',
        action: 'search',
        target: parsed.data.query.slice(0, 120),
        status: 'success',
        request_metadata: { results: (data ?? []).length },
      },
      req,
    );
    return jsonResponse({ query: parsed.data.query, results: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-kb-search',
        action: 'search',
        target: parsed.data.query.slice(0, 120),
        status: 'error',
        error_message: msg,
      },
      req,
    );
    return jsonResponse({ error: msg }, 500);
  }
});
