/**
 * ms-kb-sync
 *
 * Walks the OneDrive `/Groundpath/` folder recursively, downloads changed files,
 * extracts text, chunks it, embeds via Lovable AI Gateway, and upserts into
 * `kb_documents` + `kb_chunks`. Idempotent via etag comparison — re-running
 * is cheap when nothing has changed.
 *
 * Triggers:
 *   - Manual: POST from the M365 Hub admin UI
 *   - Scheduled: nightly via pg_cron (set up separately)
 *
 * Supported file types (text extraction):
 *   - .docx → Word `?format=html` then strip tags
 *   - .txt, .md, .csv → raw text
 *   - .pdf → Word can't convert; we mark stub for now (TODO: pdf-parse)
 *   - .xlsx, .pptx → marked stub (handled by future passes)
 *
 * Embeddings: text-embedding-3-small (1536 dims) via Lovable AI Gateway.
 */
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  gatewayFetch,
  gatewayFetchBinary,
} from '../_shared/m365.ts';

const ROOT_PATH = '/Groundpath';
const MAX_FILE_BYTES = 4 * 1024 * 1024; // skip files > 4MB
const CHUNK_TARGET_CHARS = 2000;        // ~500 tokens
const CHUNK_OVERLAP_CHARS = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBED_BATCH_SIZE = 16;

interface DriveItem {
  id: string;
  name: string;
  size?: number;
  eTag?: string;
  cTag?: string;
  lastModifiedDateTime?: string;
  webUrl?: string;
  folder?: { childCount?: number };
  file?: { mimeType?: string };
  parentReference?: { path?: string };
}

interface DriveListResponse {
  value: DriveItem[];
  '@odata.nextLink'?: string;
}

/* ============================================================
 *  Walk OneDrive folder recursively
 * ============================================================ */
async function listChildren(folderPath: string): Promise<DriveItem[]> {
  const apiPath = folderPath === '/'
    ? '/me/drive/root/children?$top=200'
    : `/me/drive/root:${folderPath}:/children?$top=200`;
  const all: DriveItem[] = [];
  let url: string | null = apiPath;
  while (url) {
    const data: DriveListResponse = await gatewayFetch('microsoft_onedrive', url);
    all.push(...(data.value ?? []));
    url = data['@odata.nextLink']
      // strip absolute graph host so it routes through the gateway
      ? data['@odata.nextLink'].replace(/^https?:\/\/[^/]+/i, '')
      : null;
  }
  return all;
}

async function walk(folderPath: string): Promise<DriveItem[]> {
  const out: DriveItem[] = [];
  const queue: string[] = [folderPath];
  while (queue.length) {
    const current = queue.shift()!;
    const items = await listChildren(current);
    for (const it of items) {
      if (it.folder) {
        const sub = current === '/' ? `/${it.name}` : `${current}/${it.name}`;
        queue.push(sub);
      } else if (it.file) {
        out.push(it);
      }
    }
  }
  return out;
}

/* ============================================================
 *  Text extraction per file type
 * ============================================================ */
function ext(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractText(item: DriveItem): Promise<string | null> {
  const e = ext(item.name);
  // Plain text-ish formats: download as raw bytes, decode UTF-8
  if (['txt', 'md', 'csv', 'json', 'html', 'htm'].includes(e)) {
    const bytes = await gatewayFetchBinary('microsoft_onedrive', `/me/drive/items/${item.id}/content`);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return e === 'html' || e === 'htm' ? stripHtml(text) : text;
  }
  // Word docs: convert to HTML via Word connector, then strip tags
  if (e === 'docx' || e === 'doc') {
    const bytes = await gatewayFetchBinary(
      'microsoft_word',
      `/me/drive/items/${item.id}/content?format=html`,
    );
    const html = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return stripHtml(html);
  }
  // PDF / Excel / PowerPoint: defer (would need Word/Excel/PPT format conversion or pdf parse)
  return null;
}

/* ============================================================
 *  Chunking + embedding
 * ============================================================ */
function chunk(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const out: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_TARGET_CHARS, cleaned.length);
    // try to break on sentence/paragraph boundary near `end`
    let breakAt = end;
    if (end < cleaned.length) {
      const slice = cleaned.slice(i, end);
      const lastPeriod = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('? '),
        slice.lastIndexOf('! '),
      );
      if (lastPeriod > CHUNK_TARGET_CHARS / 2) breakAt = i + lastPeriod + 1;
    }
    out.push(cleaned.slice(i, breakAt).trim());
    i = Math.max(breakAt - CHUNK_OVERLAP_CHARS, breakAt);
    if (i >= cleaned.length) break;
  }
  return out.filter((c) => c.length > 30);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding API failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  return (json.data as { embedding: number[] }[]).map((d) => d.embedding);
}

/* ============================================================
 *  Main handler
 * ============================================================ */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);
  const svc = guard.caller!.serviceClient;

  // Open a sync run row
  const { data: runRow, error: runErr } = await svc
    .from('kb_sync_runs')
    .insert({
      source: 'onedrive',
      triggered_by: guard.caller!.userId,
      trigger_kind: 'manual',
      status: 'running',
    })
    .select('id')
    .single();
  if (runErr || !runRow) {
    return jsonResponse({ error: `Could not open sync run: ${runErr?.message}` }, 500);
  }
  const runId = runRow.id;

  let filesSeen = 0;
  let filesChanged = 0;
  let filesFailed = 0;
  const errors: string[] = [];

  try {
    const files = await walk(ROOT_PATH);
    filesSeen = files.length;

    // Map of existing docs by external_id
    const externalIds = files.map((f) => f.id);
    const { data: existing } = externalIds.length
      ? await svc.from('kb_documents')
        .select('id, external_id, etag')
        .eq('source', 'onedrive')
        .in('external_id', externalIds)
      : { data: [] as { id: string; external_id: string; etag: string | null }[] };
    const existingMap = new Map((existing ?? []).map((d) => [d.external_id, d]));

    for (const f of files) {
      try {
        const prior = existingMap.get(f.id);
        const currentTag = f.eTag ?? f.cTag ?? null;
        if (prior && prior.etag === currentTag) {
          // unchanged → just bump last_synced_at
          await svc.from('kb_documents')
            .update({ last_synced_at: new Date().toISOString(), status: 'active' })
            .eq('id', prior.id);
          continue;
        }
        if ((f.size ?? 0) > MAX_FILE_BYTES) {
          await svc.from('kb_documents').upsert({
            source: 'onedrive',
            external_id: f.id,
            path: `${(f.parentReference?.path ?? '').replace(/^\/drive\/root:/, '')}/${f.name}`,
            name: f.name,
            mime_type: f.file?.mimeType ?? null,
            size_bytes: f.size ?? null,
            etag: currentTag,
            last_modified_at: f.lastModifiedDateTime ?? null,
            last_synced_at: new Date().toISOString(),
            status: 'error',
            error_message: 'File too large to ingest (>4MB)',
          }, { onConflict: 'source,external_id' });
          filesFailed += 1;
          continue;
        }

        const text = await extractText(f);
        const docPath = `${(f.parentReference?.path ?? '').replace(/^\/drive\/root:/, '')}/${f.name}`;

        if (!text) {
          // Unsupported type: store metadata but no chunks
          const { data: upserted } = await svc.from('kb_documents').upsert({
            source: 'onedrive',
            external_id: f.id,
            path: docPath,
            name: f.name,
            mime_type: f.file?.mimeType ?? null,
            size_bytes: f.size ?? null,
            etag: currentTag,
            last_modified_at: f.lastModifiedDateTime ?? null,
            last_synced_at: new Date().toISOString(),
            status: 'stale',
            error_message: 'File type not yet supported for text extraction',
          }, { onConflict: 'source,external_id' }).select('id').single();
          if (upserted) await svc.from('kb_chunks').delete().eq('document_id', upserted.id);
          filesFailed += 1;
          continue;
        }

        const chunks = chunk(text);
        if (chunks.length === 0) {
          await svc.from('kb_documents').upsert({
            source: 'onedrive',
            external_id: f.id,
            path: docPath,
            name: f.name,
            mime_type: f.file?.mimeType ?? null,
            size_bytes: f.size ?? null,
            etag: currentTag,
            last_modified_at: f.lastModifiedDateTime ?? null,
            last_synced_at: new Date().toISOString(),
            status: 'stale',
            error_message: 'No extractable text content',
          }, { onConflict: 'source,external_id' });
          filesFailed += 1;
          continue;
        }

        // Embed in batches
        const embeddings: number[][] = [];
        for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
          const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
          const embs = await embedBatch(batch);
          embeddings.push(...embs);
        }

        // Upsert document
        const { data: doc, error: docErr } = await svc.from('kb_documents').upsert({
          source: 'onedrive',
          external_id: f.id,
          path: docPath,
          name: f.name,
          mime_type: f.file?.mimeType ?? null,
          size_bytes: f.size ?? null,
          etag: currentTag,
          last_modified_at: f.lastModifiedDateTime ?? null,
          last_synced_at: new Date().toISOString(),
          status: 'active',
          error_message: null,
        }, { onConflict: 'source,external_id' }).select('id').single();
        if (docErr || !doc) throw new Error(docErr?.message ?? 'doc upsert failed');

        // Replace chunks atomically (delete old, insert new)
        await svc.from('kb_chunks').delete().eq('document_id', doc.id);
        const rows = chunks.map((content, idx) => ({
          document_id: doc.id,
          chunk_index: idx,
          content,
          tokens: Math.ceil(content.length / 4),
          embedding: embeddings[idx] as unknown as string,
        }));
        // Insert in batches of 50 to avoid payload limits
        for (let i = 0; i < rows.length; i += 50) {
          const slice = rows.slice(i, i + 50);
          const { error: insErr } = await svc.from('kb_chunks').insert(slice);
          if (insErr) throw new Error(insErr.message);
        }
        filesChanged += 1;
      } catch (err) {
        filesFailed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${f.name}: ${msg}`);
        console.error(`KB sync failed for ${f.name}:`, msg);
      }
    }

    const status = filesFailed === 0 ? 'success' : (filesChanged > 0 ? 'partial' : 'failed');
    await svc.from('kb_sync_runs').update({
      finished_at: new Date().toISOString(),
      status,
      files_seen: filesSeen,
      files_changed: filesChanged,
      files_failed: filesFailed,
      error_message: errors.length ? errors.slice(0, 5).join('; ') : null,
    }).eq('id', runId);

    await writeAudit(svc, guard.caller!, {
      function_name: 'ms-kb-sync',
      action: 'sync',
      target: ROOT_PATH,
      status: status === 'failed' ? 'error' : 'success',
      request_metadata: { filesSeen, filesChanged, filesFailed },
    }, req);

    return jsonResponse({
      ok: status !== 'failed',
      runId,
      filesSeen,
      filesChanged,
      filesFailed,
      status,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await svc.from('kb_sync_runs').update({
      finished_at: new Date().toISOString(),
      status: 'failed',
      files_seen: filesSeen,
      files_changed: filesChanged,
      files_failed: filesFailed,
      error_message: msg,
    }).eq('id', runId);
    await writeAudit(svc, guard.caller!, {
      function_name: 'ms-kb-sync',
      action: 'sync',
      target: ROOT_PATH,
      status: 'error',
      error_message: msg,
    }, req);
    // Most likely failure: /Groundpath folder doesn't exist yet
    const isMissing = msg.includes('404');
    return jsonResponse({
      error: isMissing
        ? `OneDrive folder "${ROOT_PATH}" not found. Please create it under the connect@groundpath.com.au account and add documents to sync.`
        : msg,
      runId,
    }, isMissing ? 404 : 500);
  }
});
