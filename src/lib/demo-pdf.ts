import { buildColouringSvg, pickPages, type ColouringKey } from "./colouring-pages";

type PdfPageLine = { text: string; size?: number; gap?: number };

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildTextStream(lines: PdfPageLine[]): string {
  const parts: string[] = ["BT", "/F1 20 Tf", "50 760 Td"];
  let first = true;
  for (const line of lines) {
    const size = line.size ?? 14;
    if (!first) {
      const gap = line.gap ?? size + 8;
      parts.push(`0 -${gap} Td`);
    }
    parts.push(`/F1 ${size} Tf`);
    parts.push(`(${escapePdfText(line.text)}) Tj`);
    first = false;
  }
  parts.push("ET");
  return parts.join("\n");
}

// ---- minimal SVG-subset → PDF vector conversion (our colouring pages only) ----

type Seg = { cmd: string; nums: number[] };

function parsePath(d: string): Seg[] {
  const segs: Seg[] = [];
  const tokens = d.match(/[MLQZmlqz]|-?\d+(?:\.\d+)?/g) ?? [];
  let i = 0;
  let cmd = "";
  const nums: number[] = [];
  const need = () => (cmd === "Q" ? 6 : 2);
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLQZmlqz]/.test(t)) {
      if (cmd === "Z" && nums.length === 0) segs.push({ cmd, nums: [] });
      else if (cmd && nums.length >= need()) segs.push({ cmd, nums: [...nums] });
      nums.length = 0;
      cmd = t.toUpperCase();
      i++;
      if (cmd === "Z") {
        segs.push({ cmd, nums: [] });
        cmd = "";
      }
    } else {
      nums.push(parseFloat(t));
      i++;
      if (cmd !== "Z" && nums.length >= need()) {
        segs.push({ cmd, nums: [...nums] });
        nums.length = 0;
      }
    }
  }
  if (cmd === "Z") segs.push({ cmd, nums: [] });
  else if (cmd && nums.length >= need()) segs.push({ cmd, nums: [...nums] });
  return segs;
}

function pathToPdf(d: string, pageH: number): string {
  const out: string[] = [];
  const y = (n: number) => (pageH - n).toFixed(2);
  const x = (n: number) => n.toFixed(2);
  let cx = 0;
  let cy = 0;
  for (const seg of parsePath(d)) {
    if (seg.cmd === "M") {
      cx = seg.nums[0];
      cy = seg.nums[1];
      out.push(`${x(cx)} ${y(cy)} m`);
    } else if (seg.cmd === "L") {
      for (let i = 0; i + 1 < seg.nums.length; i += 2) {
        cx = seg.nums[i];
        cy = seg.nums[i + 1];
        out.push(`${x(cx)} ${y(cy)} l`);
      }
    } else if (seg.cmd === "Q") {
      for (let i = 0; i + 5 < seg.nums.length; i += 6) {
        const qx1 = seg.nums[i];
        const qy1 = seg.nums[i + 1];
        const qx2 = seg.nums[i + 2];
        const qy2 = seg.nums[i + 3];
        const ex = seg.nums[i + 4];
        const ey = seg.nums[i + 5];
        // convert quadratic to cubic: C1 = P0 + 2/3(Q1-P0), C2 = P1 + 2/3(Q2-P1)
        const c1x = cx + (2 / 3) * (qx1 - cx);
        const c1y = cy + (2 / 3) * (qy1 - cy);
        const c2x = ex + (2 / 3) * (qx2 - ex);
        const c2y = ey + (2 / 3) * (qy2 - ey);
        out.push(
          `${x(c1x)} ${y(c1y)} ${x(c2x)} ${y(c2y)} ${x(ex)} ${y(ey)} c`
        );
        cx = ex;
        cy = ey;
      }
    } else if (seg.cmd === "Z") {
      out.push("h");
    }
  }
  return out.join("\n");
}

// Approximate ellipse/circle with 4 cubic Béziers (k = 0.5522847498)
function ellipseOps(cx: number, cy: number, rx: number, ry: number, pageH: number): string {
  const k = 0.5522847498;
  const ox = rx * k;
  const oy = ry * k;
  const Y = (n: number) => (pageH - n).toFixed(2);
  const X = (n: number) => n.toFixed(2);
  const x0 = cx + rx;
  const y0 = cy;
  const parts = [`${X(x0)} ${Y(y0)} m`];
  parts.push(
    `${X(x0)} ${Y(cy + oy)} ${X(cx + ox)} ${Y(cy + ry)} ${X(cx)} ${Y(cy + ry)} c`,
    `${X(cx - ox)} ${Y(cy + ry)} ${X(cx - rx)} ${Y(cy + oy)} ${X(cx - rx)} ${Y(cy)} c`,
    `${X(cx - rx)} ${Y(cy - oy)} ${X(cx - ox)} ${Y(cy - ry)} ${X(cx)} ${Y(cy - ry)} c`,
    `${X(cx + ox)} ${Y(cy - ry)} ${X(x0)} ${Y(cy - oy)} ${X(x0)} ${Y(cy)} c`,
    "h"
  );
  return parts.join("\n");
}

function svgElementsToPdf(svgStr: string, pageW: number, pageH: number): string {
  const ops: string[] = [];
  const attrs = (tag: string): Record<string, string> => {
    const o: Record<string, string> = {};
    const re = /([a-zA-Z-]+)="([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(tag)) !== null) o[m[1]] = m[2];
    return o;
  };
  const tagRe = /<(path|circle|ellipse|line|rect)\b[^/]*?\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(svgStr)) !== null) {
    const el = m[1];
    const a = attrs(m[0]);
    const sw = parseFloat(a["stroke-width"] ?? "6");
    if (el === "path" && a.d) {
      ops.push(pathToPdf(a.d, pageH));
    } else if (el === "circle") {
      ops.push(ellipseOps(+a.cx, +a.cy, +a.r, +a.r, pageH));
    } else if (el === "ellipse") {
      ops.push(ellipseOps(+a.cx, +a.cy, +a.rx, +a.ry, pageH));
    } else if (el === "line") {
      ops.push(
        `${(+a.x1).toFixed(2)} ${(pageH - +a.y1).toFixed(2)} m ${(+a.x2).toFixed(2)} ${(pageH - +a.y2).toFixed(2)} l`
      );
    } else if (el === "rect") {
      const x = +a.x;
      const yTop = +a.y;
      const w = +a.width;
      const h = +a.height;
      ops.push(
        `${x.toFixed(2)} ${(pageH - yTop).toFixed(2)} m`,
        `${(x + w).toFixed(2)} ${(pageH - yTop).toFixed(2)} l`,
        `${(x + w).toFixed(2)} ${(pageH - yTop - h).toFixed(2)} l`,
        `${x.toFixed(2)} ${(pageH - yTop - h).toFixed(2)} l`,
        "h"
      );
    }
    // scale stroke width via graphics state; B = fill (white) + stroke
    ops.push(`${sw} w 0 G 1 g B`);
  }
  return ops.join("\n");
}

// Map our 800x1000 SVG canvas onto a US-Letter page with margins.
function colouringStream(key: ColouringKey, caption: string): string {
  const svgStr = buildColouringSvg(key);
  const pageW = 612;
  const pageH = 792;
  const marginX = 36;
  const marginTop = 48;
  const marginBottom = 56;
  const scale = Math.min((pageW - marginX * 2) / 800, (pageH - marginTop - marginBottom) / 1000);
  const tx = marginX;
  const ty = marginTop;
  const body = svgElementsToPdf(svgStr, 800, 1000);
  const captionEsc = escapePdfText(caption);
  return [
    "q",
    `${scale.toFixed(4)} 0 0 ${scale.toFixed(4)} ${tx} ${(pageH - marginTop - 1000 * scale).toFixed(2)} cm`,
    body,
    "Q",
    "BT",
    `/F1 11 Tf`,
    `0 0 0 rg`,
    `${marginX} 28 Td`,
    `(${captionEsc}) Tj`,
    "ET",
  ].join("\n");
}

export function buildDemoPdf(opts: {
  title: string;
  subtitle?: string;
  pageCount?: number;
  demo?: boolean;
  /** Seed index used to pick colouring pages deterministically. */
  seedIndex?: number;
}): Buffer {
  const pageCount = Math.max(1, opts.pageCount ?? 4);
  const seed = opts.seedIndex ?? 0;
  const colouringKeys = pickPages(seed, Math.max(0, pageCount - 1));
  const objects: string[] = [];
  const addObject = (body: string): number => {
    objects.push(body);
    return objects.length;
  };

  const fontNum = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontNum = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  void fontNum;

  const pageNums: number[] = [];
  const contentNums: number[] = [];
  const pagesObjNum = 3 + pageCount * 2;

  for (let i = 0; i < pageCount; i++) {
    let stream: string;
    if (i === 0) {
      const lines: PdfPageLine[] = [];
      lines.push({ text: opts.title, size: 24 });
      if (opts.subtitle) lines.push({ text: opts.subtitle, size: 14, gap: 36 });
      lines.push({ text: "GT Shopping - printable digital product", size: 11, gap: 48 });
      if (opts.demo !== false) {
        lines.push({ text: "DEMO FILE - sample pages follow, replace via admin dashboard", size: 12, gap: 60 });
      }
      lines.push({ text: "Print at 100% scale on A4 or US Letter paper.", size: 12, gap: 40 });
      stream = buildTextStream(lines);
    } else {
      const key = colouringKeys[i - 1] ?? "cat";
      stream = colouringStream(key, `${opts.title} - sample colouring page ${i} of ${pageCount - 1}`);
    }
    const contentNum = addObject(
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`
    );
    contentNums.push(contentNum);

    const pageNum = addObject(
      `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Contents ${contentNum} 0 R ` +
        `/Resources << /Font << /F1 ${boldFontNum} 0 R >> >> >>`
    );
    pageNums.push(pageNum);
  }

  const kids = pageNums.map((n) => `${n} 0 R`).join(" ");
  const pagesNum = addObject(
    `<< /Type /Pages /Kids [${kids}] /Count ${pageNums.length} >>`
  );
  if (pagesNum !== pagesObjNum) {
    throw new Error(`PDF object numbering mismatch: expected ${pagesObjNum}, got ${pagesNum}`);
  }
  const catalogNum = addObject(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNum} 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}
