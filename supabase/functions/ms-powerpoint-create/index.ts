/**
 * ms-powerpoint-create
 *
 * Generates a minimal PowerPoint (.pptx) deck from a structured slide list
 * and uploads it to OneDrive under /Groundpath/Generated/<filename>.pptx.
 *
 * Each slide has a title and an optional bullet list of body lines. Useful
 * for weekly business reviews, founder updates, and quick client briefs.
 *
 * Built without external libs — same store-only ZIP approach as ms-word-create.
 * PowerPoint will open and reflow it; visual polish is intentionally light.
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  m365CorsHeaders,
  jsonResponse,
  requireM365Caller,
  writeAudit,
  fireAndForgetOpsLog,
  gatewayUrl,
  gatewayHeaders,
} from '../_shared/m365.ts';

const SlideSchema = z.object({
  title: z.string().min(1).max(200),
  bullets: z.array(z.string().max(500)).max(12).default([]),
});

const BodySchema = z.object({
  filename: z.string().min(1).max(120)
    .regex(/^[a-zA-Z0-9 _\-\.]+$/, 'Filename: alphanumerics, spaces, _, -, . only'),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).default(''),
  slides: z.array(SlideSchema).min(1).max(40),
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
  const { filename, title, subtitle, slides, folderPath } = parsed.data;

  const cleanFolder = folderPath.replace(/^\/+|\/+$/g, '');
  const finalName = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  const fullPath = `${cleanFolder}/${finalName}`;

  const startedAt = Date.now();
  try {
    const pptxBytes = buildPptx(title, subtitle, slides);

    const url = gatewayUrl(
      'microsoft_onedrive',
      `/me/drive/root:/${encodeURI(fullPath)}:/content`,
    );
    const headers = gatewayHeaders('microsoft_onedrive', {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const res = await fetch(url, { method: 'PUT', headers, body: pptxBytes });
    const respText = await res.text();
    if (!res.ok) throw new Error(`OneDrive upload failed [${res.status}]: ${respText.slice(0, 300)}`);
    const item = JSON.parse(respText) as { id: string; webUrl: string; name: string };

    const duration = Date.now() - startedAt;
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-powerpoint-create',
        action: 'create_pptx',
        target: fullPath,
        status: 'success',
        request_metadata: { itemId: item.id, slideCount: slides.length, bytes: pptxBytes.length, duration_ms: duration },
      },
      req,
    );
    fireAndForgetOpsLog(guard.caller!.serviceClient, guard.caller!, {
      function_name: 'ms-powerpoint-create',
      action: 'create_pptx',
      target: fullPath,
      status: 'success',
      duration_ms: duration,
      notes: `itemId=${item.id} slides=${slides.length} bytes=${pptxBytes.length} title="${title}"`,
    });

    return jsonResponse({ ok: true, itemId: item.id, name: item.name, webUrl: item.webUrl, path: fullPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - startedAt;
    await writeAudit(
      guard.caller!.serviceClient,
      guard.caller!,
      {
        function_name: 'ms-powerpoint-create',
        action: 'create_pptx',
        target: fullPath,
        status: 'error',
        error_message: msg,
      },
      req,
    );
    fireAndForgetOpsLog(guard.caller!.serviceClient, guard.caller!, {
      function_name: 'ms-powerpoint-create',
      action: 'create_pptx',
      target: fullPath,
      status: 'error',
      duration_ms: duration,
      notes: msg.slice(0, 400),
    });
    return jsonResponse({ error: msg }, 502);
  }
});

/* ---------- minimal PPTX builder ---------- */

interface Slide { title: string; bullets: string[] }

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function slideXml(slide: Slide, isTitle: boolean, subtitle?: string): string {
  // Title text frame (top), then content text frame (below)
  const bulletParas = slide.bullets.length === 0 && !isTitle
    ? `<a:p><a:r><a:rPr lang="en-AU"/><a:t></a:t></a:r></a:p>`
    : slide.bullets.map((b) =>
        `<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-AU" sz="2000"/><a:t>${escapeXml(b)}</a:t></a:r></a:p>`
      ).join('');

  const subtitleParas = isTitle && subtitle
    ? `<a:p><a:r><a:rPr lang="en-AU" sz="2400"/><a:t>${escapeXml(subtitle)}</a:t></a:r></a:p>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="838200" y="365125"/><a:ext cx="10515600" cy="1325563"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/>
          <a:p><a:r><a:rPr lang="en-AU" sz="${isTitle ? '4400' : '3200'}" b="1"/><a:t>${escapeXml(slide.title)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="838200" y="1825625"/><a:ext cx="10515600" cy="4351338"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/>${subtitleParas}${bulletParas}</p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
}

function buildPptxFiles(title: string, subtitle: string, slides: Slide[]): Record<string, string> {
  const allSlides: Slide[] = [{ title, bullets: [] }, ...slides];
  const slideRels = allSlides.map((_, i) => i + 1);

  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                saveSubsetFonts="1">
  <p:sldIdLst>
    ${slideRels.map((n, i) => `<p:sldId id="${256 + i}" r:id="rId${n}"/>`).join('')}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${allSlides.map((_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
  ).join('')}
</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${allSlides.map((_, i) =>
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('')}
</Types>`;

  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypesXml,
    '_rels/.rels': rootRels,
    'ppt/presentation.xml': presentationXml,
    'ppt/_rels/presentation.xml.rels': presentationRels,
  };

  for (let i = 0; i < allSlides.length; i++) {
    files[`ppt/slides/slide${i + 1}.xml`] = slideXml(allSlides[i], i === 0, subtitle);
  }
  return files;
}

function buildPptx(title: string, subtitle: string, slides: Slide[]): Uint8Array {
  return zipStore(buildPptxFiles(title, subtitle, slides));
}

/* ---------- Tiny STORE-only ZIP (shared logic, inlined) ---------- */
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
    const lh = new Uint8Array(30 + nameBytes.length + size);
    const dvLh = new DataView(lh.buffer);
    dvLh.setUint32(0, 0x04034b50, true);
    dvLh.setUint16(4, 20, true);
    dvLh.setUint16(6, 0, true);
    dvLh.setUint16(8, 0, true);
    dvLh.setUint16(10, 0, true);
    dvLh.setUint16(12, 0x21, true);
    dvLh.setUint32(14, crc, true);
    dvLh.setUint32(18, size, true);
    dvLh.setUint32(22, size, true);
    dvLh.setUint16(26, nameBytes.length, true);
    dvLh.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    lh.set(data, 30 + nameBytes.length);
    local.push(lh);

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
