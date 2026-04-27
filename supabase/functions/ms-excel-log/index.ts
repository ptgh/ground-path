/**
 * ms-excel-log
 *
 * Append a row to a Groundpath Excel workbook table. Used for ops logs
 * (e.g. weekly metrics, lead pipeline snapshots, founder dashboard exports).
 *
 * Inputs:
 *   - filePath: path under OneDrive root (e.g. "Groundpath/Logs/ops.xlsx")
 *   - tableName: name of the Excel Table within the workbook (e.g. "OpsLog")
 *   - values: 2D array of cell values to append (rows × columns)
 *
 * The workbook + table must already exist. We do NOT create them — the user
 * sets the schema once in Excel so column meanings stay stable.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  gatewayFetch,
} from '../_shared/m365.ts';

const BodySchema = z.object({
  filePath: z.string().min(1).max(400),
  tableName: z.string().min(1).max(120),
  values: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .min(1).max(200),
});

interface DriveItem { id: string; name: string }

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);
  const { filePath, tableName, values } = parsed.data;

  const cleanPath = filePath.replace(/^\/+/, '');

  try {
    // Resolve drive item id from path
    const item = await gatewayFetch<DriveItem>(
      'microsoft_excel',
      `/me/drive/root:/${encodeURI(cleanPath)}`,
    );

    // Append rows to the named table
    const result = await gatewayFetch<{ index: number }>(
      'microsoft_excel',
      `/me/drive/items/${item.id}/workbook/tables/${encodeURIComponent(tableName)}/rows/add`,
      { method: 'POST', body: JSON.stringify({ values }) },
    );

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-excel-log',
        action: 'append_rows',
        target: `${cleanPath}#${tableName}`,
        status: 'success',
        request_metadata: { rows: values.length, columns: values[0]?.length ?? 0 },
      },
      req,
    );

    return jsonResponse({ ok: true, rowsAppended: values.length, tableName, filePath: cleanPath, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-excel-log',
        action: 'append_rows',
        target: `${cleanPath}#${tableName}`,
        status: 'error',
        error_message: msg,
      },
      req,
    );
    return jsonResponse({ error: msg }, 502);
  }
});
