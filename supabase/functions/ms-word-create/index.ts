/**
 * ms-word-create
 *
 * Generates a Word (.docx) document from a Markdown / plain-text body and
 * uploads it to OneDrive under /Groundpath/Generated/<filename>.docx.
 *
 * We build a minimal valid .docx (Open XML) in-edge using a tiny ZIP writer
 * so we don't need any external libs. Good enough for memos, briefs, and
 * AI-generated reports — Word will open and prettify it.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  gatewayUrl,
  gatewayHeaders,
} from '../_shared/m365.ts';

const BodySchema = z.object({
  filename: z.string().min(1).max(120)
    .regex(/^[a-zA-Z0-9 _\-\.]+$/, 'Filename: alphanumerics, spaces, _, -, . only'),
  title: z.string().min(1).max(200),
  bodyMarkdown: z.string().min(1).max(100000),
  folderPath: z.string().max(300).default('Groundpath/Generated'),
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: m365CorsHeaders });

  const guard = await requireM365Caller(req);
  if (!guard.ok) return jsonResponse({ error: guard.error }, guard.status ?? 500);

  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);
  const { filename, title, bodyMarkdown, folderPath } = parsed.data;

  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, '');
  const finalName = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  const fullPath = `${cleanFolder}/${finalName}`;

  try {
    const docxBytes = buildDocx(title, bodyMarkdown);

    // Upload via OneDrive simple PUT (works up to 4MB — fine for memos)
    const url = gatewayUrl(
      'microsoft_onedrive',
      `/me/drive/root:/${encodeURI(fullPath)}:/content`,
    );
    const headers = gatewayHeaders('microsoft_onedrive', {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const res = await fetch(url, { method: 'PUT', headers, body: docxBytes });
    const respText = await res.text();
    if (!res.ok) throw new Error(`OneDrive upload failed [${res.status}]: ${respText.slice(0, 300)}`);
    const item = JSON.parse(respText) as { id: string; webUrl: string; name: string };

    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-word-create',
        action: 'create_docx',
        target: fullPath,
        status: 'success',
        request_metadata: { itemId: item.id, bytes: docxBytes.length },
      },
      req,
    );

    return jsonResponse({ ok: true, itemId: item.id, name: item.name, webUrl: item.webUrl, path: fullPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-word-create',
        action: 'create_docx',
        target: fullPath,
        status: 'error',
        error_message: msg,
      },
      req,
    );
    return jsonResponse({ error: msg }, 502);
  }
});

/* ---------- minimal DOCX builder ---------- */

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Convert simple markdown (#, ##, blank lines, bullets) to OOXML paragraphs. */
function markdownToParagraphs(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) { out.push(`<w:p/>`); continue; }
    let style = '';
    let text = line;
    if (line.startsWith('# ')) { style = 'Heading1'; text = line.slice(2); }
    else if (line.startsWith('## ')) { style = 'Heading2'; text = line.slice(3); }
    else if (line.startsWith('### ')) { style = 'Heading3'; text = line.slice(4); }
    else if (line.startsWith('- ') || line.startsWith('* ')) { style = 'ListParagraph'; text = '• ' + line.slice(2); }

    const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
    out.push(`<w:p>${pPr}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`);
  }
  return out.join('');
}

function buildDocxXml(title: string, bodyMd: string): Record<string, string> {
  const paragraphs =
    `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(title)}</w:t></w:r></w:p>` +
    markdownToParagraphs(bodyMd);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return {
    '[Content_Types].xml': contentTypesXml,
    '_rels/.rels': rootRels,
    'word/document.xml': documentXml,
  };
}

function buildDocx(title: string, bodyMd: string): Uint8Array {
  const files = buildDocxXml(title, bodyMd);
  return zipStore(files);
}

/* ---------- Tiny STORE-only ZIP writer (no compression) ---------- */
// CRC-32 table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function zipStore(files: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);
    const crc = crc32(data);
    const size = data.length;

    // Local file header
    const lh = new Uint8Array(30 + nameBytes.length + size);
    const dvLh = new DataView(lh.buffer);
    dvLh.setUint32(0, 0x04034b50, true);
    dvLh.setUint16(4, 20, true); // version
    dvLh.setUint16(6, 0, true);  // flags
    dvLh.setUint16(8, 0, true);  // method=store
    dvLh.setUint16(10, 0, true); // time
    dvLh.setUint16(12, 0x21, true); // date (1980-01-01)
    dvLh.setUint32(14, crc, true);
    dvLh.setUint32(18, size, true);
    dvLh.setUint32(22, size, true);
    dvLh.setUint16(26, nameBytes.length, true);
    dvLh.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    lh.set(data, 30 + nameBytes.length);
    local.push(lh);

    // Central dir header
    const ch = new Uint8Array(46 + nameBytes.length);
    const dvCh = new DataView(ch.buffer);
    dvCh.setUint32(0, 0x02014b50, true);
    dvCh.setUint16(4, 20, true);
    dvCh.setUint16(6, 20, true);
    dvCh.setUint16(8, 0, true);
    dvCh.setUint16(10, 0, true);
    dvCh.setUint16(12, 0, true);
    dvCh.setUint16(14, 0x21, true);
    dvCh.setUint32(16, crc, true);
    dvCh.setUint32(20, size, true);
    dvCh.setUint32(24, size, true);
    dvCh.setUint16(28, nameBytes.length, true);
    dvCh.setUint16(30, 0, true);
    dvCh.setUint16(32, 0, true);
    dvCh.setUint16(34, 0, true);
    dvCh.setUint16(36, 0, true);
    dvCh.setUint32(38, 0, true);
    dvCh.setUint32(42, offset, true);
    ch.set(nameBytes, 46);
    central.push(ch);

    offset += lh.length;
  }

  const centralSize = central.reduce((s, b) => s + b.length, 0);
  const centralOffset = offset;

  const eocd = new Uint8Array(22);
  const dvE = new DataView(eocd.buffer);
  dvE.setUint32(0, 0x06054b50, true);
  dvE.setUint16(4, 0, true);
  dvE.setUint16(6, 0, true);
  dvE.setUint16(8, central.length, true);
  dvE.setUint16(10, central.length, true);
  dvE.setUint32(12, centralSize, true);
  dvE.setUint32(16, centralOffset, true);
  dvE.setUint16(20, 0, true);

  const total = offset + centralSize + eocd.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const b of local) { out.set(b, p); p += b.length; }
  for (const b of central) { out.set(b, p); p += b.length; }
  out.set(eocd, p);
  return out;
}
