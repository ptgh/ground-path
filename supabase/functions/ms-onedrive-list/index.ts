/**
 * ms-onedrive-list
 *
 * Lists the contents of a OneDrive folder (default: /Groundpath/).
 * Used by the M365 Hub UI to preview what's in the knowledge folder.
 * Admin + allow-list gated.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  gatewayFetch,
} from '../_shared/m365.ts';

const QuerySchema = z.object({
  path: z.string().max(500).default('/Groundpath'),
  top: z.number().int().min(1).max(200).default(50),
});

interface DriveItem {
  id: string;
  name: string;
  size?: number;
  webUrl?: string;
  lastModifiedDateTime?: string;
  folder?: { childCount?: number };
  file?: { mimeType?: string };
  parentReference?: { path?: string };
}

interface DriveListResponse {
  value: DriveItem[];
  '@odata.nextLink'?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders(req) });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500, req);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    path: url.searchParams.get('path') ?? undefined,
    top: url.searchParams.get('top') ? Number(url.searchParams.get('top')) : undefined,
  });
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400, req);
  const { path, top } = parsed.data;

  // Normalise path for OneDrive Graph: must look like /Groundpath
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Special-case root
  const apiPath = cleanPath === '/' || cleanPath === ''
    ? `/me/drive/root/children?$top=${top}&$orderby=name`
    : `/me/drive/root:${cleanPath}:/children?$top=${top}&$orderby=name`;

  try {
    const data = await gatewayFetch<DriveListResponse>('microsoft_onedrive', apiPath);

    const items = (data.value ?? []).map((it) => ({
      id: it.id,
      name: it.name,
      size: it.size ?? null,
      webUrl: it.webUrl ?? null,
      lastModified: it.lastModifiedDateTime ?? null,
      isFolder: !!it.folder,
      childCount: it.folder?.childCount ?? null,
      mimeType: it.file?.mimeType ?? null,
      parentPath: it.parentReference?.path ?? null,
    }));

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-onedrive-list',
        action: 'list',
        target: cleanPath,
        status: 'success',
        request_metadata: { count: items.length },
      },
      req,
    );

    return jsonResponse({ path: cleanPath, items, hasMore: !!data['@odata.nextLink'] }, req);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-onedrive-list',
        action: 'list',
        target: cleanPath,
        status: 'error',
        error_message: message,
      },
      req,
    );
    // 404 for missing folder is the most common failure mode
    const isMissing = message.includes('404');
    return jsonResponse(
      {
        error: isMissing
          ? `Folder "${cleanPath}" not found in OneDrive. Create it under the connect@groundpath.com.au account.`
          : message,
      },
      isMissing ? 404 : 502, req
    );
  }
});
