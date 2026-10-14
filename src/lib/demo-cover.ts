import { buildColouringSvg, COLOURING_KEYS } from "./colouring-pages";

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

/** Extract inner drawing (skip white bg rect + closing svg tag) for embedding. */
function colouringArt(seedIndex: number): string {
  const key = COLOURING_KEYS[seedIndex % COLOURING_KEYS.length];
  const full = buildColouringSvg(key);
  const inner = full
    .replace(/^[\s\S]*?<rect[^>]*fill="#FFFFFF"\/>\s*/, "")
    .replace(/<\/svg>\s*$/, "");
  return `<g transform="translate(200 145) scale(0.22) translate(-400 -500)" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
}

const PALETTES = [
  ["#FDE8D7", "#F6B26B", "#E4633F"],
  ["#E8F0D9", "#A8C66C", "#5E8C3A"],
  ["#E4E9F7", "#9DB2E0", "#4A66B0"],
  ["#FBE4EF", "#EFA8C8", "#C2517E"],
  ["#E5F4F1", "#8FCFC2", "#2F8A7A"],
  ["#FFF3D6", "#F0C86A", "#C98A1F"],
];

export function buildDemoCoverSvg(opts: {
  title: string;
  category: string;
  emoji: string;
  seedIndex: number;
}): string {
  const palette = PALETTES[opts.seedIndex % PALETTES.length];
  const [bg, mid, deep] = palette;
  const lines = wrapText(opts.title, 18);
  const startY = 340 - ((lines.length - 1) * 26) / 2;
  const textNodes = lines
    .map(
      (line, i) =>
        `<text x="200" y="${startY + i * 34}" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="#2B2118">${escapeXml(line)}</text>`
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${mid}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#g)"/>
  <rect x="16" y="16" width="368" height="468" fill="none" stroke="${deep}" stroke-width="3" rx="18" opacity="0.55"/>
  <rect x="100" y="36" width="200" height="210" rx="14" fill="#FFFFFF" stroke="${deep}" stroke-width="2.5"/>
  ${colouringArt(opts.seedIndex)}
  ${textNodes}
  <text x="200" y="418" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#5A4A3A">${escapeXml(opts.category)}</text>
  <rect x="120" y="436" width="160" height="30" rx="15" fill="${deep}"/>
  <text x="200" y="456" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">INSTANT DOWNLOAD</text>
  <text x="200" y="486" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#2B2118">GT Shopping</text>
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
