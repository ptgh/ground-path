/**
 * ms-onenote-append
 *
 * Appends a page to the Groundpath OneNote notebook. Used to log decisions,
 * weekly recaps, and ad-hoc founder notes. Creates pages under a named
 * section if `section` is provided, otherwise in the user's default section.
 *
 * OneNote API quirk: page CREATE uses Content-Type: text/html with HTML body.
 * Admin + allow-list gated.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  gatewayUrl,
  gatewayHeaders,
  gatewayFetch,
} from '../_shared/m365.ts';

const BodySchema = z.object({
  title: z.string().min(1).max(200),
  contentHtml: z.string().min(1).max(50000),
  notebook: z.string().max(120).default('Groundpath Ops'),
  section: z.string().max(120).default('Decisions'),
});

interface OneNoteSection { id: string; displayName: string }
interface SectionsResponse { value: OneNoteSection[] }
interface OneNoteNotebook { id: string; displayName: string }
interface NotebooksResponse { value: OneNoteNotebook[] }

async function findOrCreateSection(notebookName: string, sectionName: string): Promise<string> {
  // Find notebook
  const nbList = await gatewayFetch<NotebooksResponse>(
    'microsoft_onenote',
    `/me/onenote/notebooks?$select=id,displayName`,
  );
  const nb = nbList.value.find((n) => n.displayName === notebookName);
  if (!nb) throw new Error(`OneNote notebook "${notebookName}" not found. Create it under connect@groundpath.com.au.`);

  // Find section
  const secList = await gatewayFetch<SectionsResponse>(
    'microsoft_onenote',
    `/me/onenote/notebooks/${nb.id}/sections?$select=id,displayName`,
  );
  const sec = secList.value.find((s) => s.displayName === sectionName);
  if (sec) return sec.id;

  // Create section
  const created = await gatewayFetch<OneNoteSection>(
    'microsoft_onenote',
    `/me/onenote/notebooks/${nb.id}/sections`,
    { method: 'POST', body: JSON.stringify({ displayName: sectionName }) },
  );
  return created.id;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders(req) });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500, req);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400, req); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400, req);
  const { title, contentHtml, notebook, section } = parsed.data;

  try {
    const sectionId = await findOrCreateSection(notebook, section);
    const dateStr = new Date().toISOString();
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta name="created" content="${dateStr}" />
  </head>
  <body>
    <p><i>Logged by Groundpath M365 Hub on ${new Date().toLocaleString('en-AU')}</i></p>
    ${contentHtml}
  </body>
</html>`;

    // OneNote create-page requires text/html body
    const url = gatewayUrl('microsoft_onenote', `/me/onenote/sections/${sectionId}/pages`);
    const headers = gatewayHeaders('microsoft_onenote', { 'Content-Type': 'text/html' });
    const res = await fetch(url, { method: 'POST', headers, body: html });
    const responseBody = await res.text();
    if (!res.ok) throw new Error(`OneNote create failed [${res.status}]: ${responseBody.slice(0, 300)}`);
    const page = JSON.parse(responseBody);

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-onenote-append',
        action: 'create_page',
        target: `${notebook}/${section}`,
        status: 'success',
        request_metadata: { pageId: page.id, title },
      },
      req,
    );
    return jsonResponse({ ok: true, pageId: page.id, links: page.links }, req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-onenote-append',
        action: 'create_page',
        target: `${notebook}/${section}`,
        status: 'error',
        error_message: msg,
      },
      req,
    );
    return jsonResponse({ error: msg }, 502, req);
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
